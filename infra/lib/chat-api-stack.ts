import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ChatApiStackProps extends cdk.StackProps {
  hostedZoneId: string;
  /** Apex of the zone, e.g. michaelnusair.site */
  domainName: string;
  /** Subdomain the API answers on. Must be covered by `certificateArn`. */
  subdomain?: string;
  /**
   * Existing wildcard certificate. Reused rather than issuing a new one so this
   * stack never has to write a DNS validation record into the zone.
   */
  certificateArn?: string;
  /**
   * Bedrock model for the chat handler. The bare `anthropic.` id is correct:
   * this is the Messages-API endpoint, where a `us.anthropic.*` inference
   * profile id 404s.
   */
  chatModel?: string;
  /** Verified SES sender for correction emails. Empty disables them. */
  sesFromEmail?: string;
}

/**
 * The backend behind the site's "Ask my AI" button: DynamoDB + Lambda + REST
 * API on chatapi.<domain>.
 *
 * Split out of HostingStack on purpose. HostingStack cannot be deployed — it
 * would collide with the hand-made resources serving the site and take the apex
 * DNS down on rollback (see README.md "Infrastructure"). Everything here is
 * new, and the only Route53 records it owns are for its own subdomain, so it
 * can be deployed and destroyed without touching the live site.
 */
export class ChatApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ChatApiStackProps) {
    super(scope, id, props);

    const {
      domainName,
      hostedZoneId,
      subdomain = 'chatapi',
      // *.michaelnusair.site + *.michaelnusair.tech, already ISSUED.
      certificateArn = 'arn:aws:acm:us-east-1:481432042359:certificate/9065b3f2-c40c-49af-86b9-a15607334126',
      chatModel = 'anthropic.claude-opus-5-5',
      sesFromEmail = '',
    } = props;

    const apiHostname = `${subdomain}.${domainName}`;

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId,
      zoneName: domainName,
    });

    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

    // ─── Storage ────────────────────────────────────────────────────

    const conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // The handler treats an empty ADMIN_TOKEN as "no auth required", which
    // would leave /chat/correction and /chat/conversation/{id} — every visitor
    // transcript — open to anyone. So the token is always generated, never
    // blank, and never checked into the repo. Read it with:
    //   aws secretsmanager get-secret-value --secret-id <AdminTokenSecretName>
    const adminTokenSecret = new secretsmanager.Secret(this, 'AdminToken', {
      description: `Bearer token for the ${apiHostname} admin endpoints (/admin page)`,
      generateSecretString: {
        passwordLength: 40,
        excludePunctuation: true,
        includeSpace: false,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─── Handler ────────────────────────────────────────────────────

    const chatFunction = new NodejsFunction(this, 'ChatFunction', {
      entry: path.join(__dirname, 'lambda/chat/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      // The handler calls Bedrock and waits for the full completion;
      // API Gateway caps us at 29s anyway.
      timeout: cdk.Duration.seconds(29),
      bundling: { target: 'es2022', externalModules: ['@aws-sdk/*'] },
      // An explicit log group, rather than `logRetention`, which is deprecated
      // and would add a custom-resource Lambda plus its role to the stack just
      // to set one retention value.
      logGroup: new logs.LogGroup(this, 'ChatFunctionLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: {
        CONVERSATIONS_TABLE: conversationsTable.tableName,
        BEDROCK_CHAT_MODEL: chatModel,
        ADMIN_TOKEN: adminTokenSecret.secretValue.unsafeUnwrap(),
        SES_FROM_EMAIL: sesFromEmail,
      },
    });

    conversationsTable.grantReadWriteData(chatFunction);

    // The model is reached through the function's own role, so no key is stored
    // anywhere — which is also why the Azure key that used to sit in this
    // function's plaintext environment is simply gone.
    // `bedrock-mantle`, not `bedrock`. The Anthropic SDK's Bedrock client talks to the
    // Messages-API endpoint, which is a separate IAM service with its own action and its
    // own resource shape — a project, not a foundation model. Granting
    // `bedrock:InvokeModel` here looks right, deploys clean and then fails at runtime
    // with `not authorized to perform: bedrock-mantle:CreateInference`, which is how
    // this was found.
    chatFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock-mantle:CreateInference'],
        resources: [
          `arn:aws:bedrock-mantle:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:project/default`,
        ],
      }),
    );

    if (sesFromEmail) {
      chatFunction.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ses:SendEmail', 'ses:SendRawEmail'],
          resources: ['*'],
          conditions: { StringEquals: { 'ses:FromAddress': sesFromEmail } },
        }),
      );
    }

    // ─── API ────────────────────────────────────────────────────────

    // REST (v1), not HTTP (v2): the handler reads `event.path`, which only the
    // 1.0 payload format provides.
    const api = new apigw.RestApi(this, 'ChatApi', {
      restApiName: 'personal-site-chat-api',
      description: `Chat backend for https://${domainName}`,
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 20,
        throttlingBurstLimit: 40,
      },
      defaultCorsPreflightOptions: {
        // The chat is deliberately public and unauthenticated, and the admin
        // routes are bearer-token guarded, so CORS is not the security
        // boundary here. Kept open so white-labelled builds on other domains
        // keep working.
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'GET', 'POST'],
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    });

    const integration = new apigw.LambdaIntegration(chatFunction, { proxy: true });
    const chat = api.root.addResource('chat');
    chat.addResource('start').addMethod('POST', integration);
    chat.addResource('message').addMethod('POST', integration);
    chat.addResource('correction').addMethod('POST', integration);
    chat.addResource('conversation').addResource('{id}').addMethod('GET', integration);

    // REGIONAL, matching every other custom domain in this account, and much
    // faster to deploy than EDGE (which provisions a CloudFront distribution).
    const apiDomain = new apigw.DomainName(this, 'CustomDomain', {
      domainName: apiHostname,
      certificate,
      endpointType: apigw.EndpointType.REGIONAL,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2,
    });

    new apigw.BasePathMapping(this, 'DomainMapping', {
      domainName: apiDomain,
      restApi: api,
      basePath: '',
      stage: api.deploymentStage,
    });

    // Only ever `chatapi.<domain>`. Nothing here writes the apex or www.
    new route53.ARecord(this, 'ARecord', {
      zone: hostedZone,
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    });
    new route53.AaaaRecord(this, 'AaaaRecord', {
      zone: hostedZone,
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    });

    // ─── Outputs ────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'ChatApiBase', {
      value: `https://${apiHostname}/`,
      description: 'Set NEXT_PUBLIC_CHAT_API_BASE in deploy.env to this',
    });
    new cdk.CfnOutput(this, 'ChatApiStageUrl', { value: api.url });
    new cdk.CfnOutput(this, 'ConversationsTableName', { value: conversationsTable.tableName });
    new cdk.CfnOutput(this, 'AdminTokenSecretName', { value: adminTokenSecret.secretName });
  }
}
