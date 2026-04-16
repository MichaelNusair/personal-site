import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

interface HostingStackProps extends cdk.StackProps {
  hostedZoneId: string;
  domainName: string;
  uploadsBucketName: string;
  /** Prefix for resource names (ECR, Lambda function name, S3 bucket). Avoids collisions when multiple stacks share an account. */
  resourcePrefix?: string;
  /** White-label: site profile baked into the Docker image at build time. */
  siteProfile?: 'personal' | 'strike_labs';
  /** URL of the public site (defaults to https://<domainName>) */
  siteUrl?: string;
  /** Chat API base URL (defaults to https://chatapi.<domainName>/) */
  chatApiBase?: string;
  /** GetVL funnel overrides */
  getvlStartIdeaUrl?: string;
  getvlUploadRfqUrl?: string;
  /** Set to false to skip deploying chat API resources (DynamoDB, Lambda, API GW). Useful when the site shares a chat API from another stack. */
  deployChatApi?: boolean;
}

export class HostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    const { domainName, hostedZoneId, uploadsBucketName } = props;
    const prefix = props.resourcePrefix || 'mntech-internal';
    const siteProfile = props.siteProfile || 'personal';
    const siteUrl = props.siteUrl || `https://${domainName}`;
    const chatApiBase = props.chatApiBase || `https://chatapi.${domainName}/`;
    const deployChatApi = props.deployChatApi !== false;

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId,
      zoneName: domainName,
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // ─── Next.js SSR (Docker Lambda + CloudFront) ───────────────

    const staticBucket = new s3.Bucket(this, 'StaticAssets', {
      bucketName: `${prefix}-static-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const ecrRepo = new ecr.Repository(this, 'WebAppRepo', {
      repositoryName: `${prefix}-web`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{ maxImageCount: 5, description: 'Keep only 5 images' }],
    });

    const ssrImageUri = process.env.SSR_IMAGE_URI;

    const ssrFunction = new lambda.DockerImageFunction(this, 'SSRFunction', {
      functionName: `${prefix}-ssr`,
      architecture: lambda.Architecture.X86_64,
      code: ssrImageUri
        ? lambda.DockerImageCode.fromEcr(
            ecr.Repository.fromRepositoryName(this, 'SSRRepo', `${prefix}-web`),
            { tagOrDigest: ssrImageUri.split(':').pop() },
          )
        : lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../..'), {
            file: 'Dockerfile',
            buildArgs: {
              NEXT_PUBLIC_SITE_PROFILE: siteProfile,
              NEXT_PUBLIC_SITE_URL: siteUrl,
              NEXT_PUBLIC_CHAT_API_BASE: chatApiBase,
              ...(props.getvlStartIdeaUrl ? { NEXT_PUBLIC_GETVL_START_IDEA_URL: props.getvlStartIdeaUrl } : {}),
              ...(props.getvlUploadRfqUrl ? { NEXT_PUBLIC_GETVL_UPLOAD_RFQ_URL: props.getvlUploadRfqUrl } : {}),
            },
          }),
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024,
      ephemeralStorageSize: cdk.Size.mebibytes(1024),
      environment: {
        NODE_ENV: 'production',
        PORT: '8080',
        AWS_LWA_INVOKE_MODE: 'buffered',
        NEXTAUTH_URL: `https://${domainName}`,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
        UPLOADS_BUCKET: uploadsBucketName,
      },
    });

    ssrFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`arn:aws:s3:::${uploadsBucketName}/*`],
      }),
    );

    const functionUrl = ssrFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.BUFFERED,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(
          cdk.Fn.select(2, cdk.Fn.split('/', functionUrl.url)),
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      domainNames: [domainName, `www.${domainName}`],
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });
    new route53.AaaaRecord(this, 'AliasRecordV6', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });
    new route53.ARecord(this, 'WwwAliasRecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });
    new route53.AaaaRecord(this, 'WwwAliasRecordV6', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // MX records for ImprovMX email forwarding
    new route53.MxRecord(this, 'MxRecord', {
      zone: hostedZone,
      recordName: '',
      values: [
        { hostName: 'mx1.improvmx.com', priority: 10 },
        { hostName: 'mx2.improvmx.com', priority: 20 },
      ],
      ttl: cdk.Duration.hours(1),
    });
    new route53.TxtRecord(this, 'SpfRecord', {
      zone: hostedZone,
      recordName: '',
      values: ['v=spf1 include:spf.improvmx.com ~all'],
      ttl: cdk.Duration.hours(1),
    });

    // ─── Chat API (DynamoDB + Lambda + API Gateway) ─────────────

    if (deployChatApi) {

    const conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const azureOpenAiKeySecretName =
      (this.node.tryGetContext('azureOpenAiApiKeySecretName') as string) ||
      process.env.AZURE_OPENAI_API_KEY_SECRET_NAME || '';
    const adminTokenSecretName =
      (this.node.tryGetContext('adminTokenSecretName') as string) ||
      process.env.ADMIN_TOKEN_SECRET_NAME || '';

    const azureKeySecret = azureOpenAiKeySecretName
      ? secretsmanager.Secret.fromSecretNameV2(this, 'AzureOpenAIKeySecret', azureOpenAiKeySecretName)
      : undefined;
    const adminTokenSecret = adminTokenSecretName
      ? secretsmanager.Secret.fromSecretNameV2(this, 'AdminTokenSecret', adminTokenSecretName)
      : undefined;

    const azureOpenAiEndpoint =
      (this.node.tryGetContext('azureOpenAiEndpoint') as string) ||
      process.env.AZURE_OPENAI_ENDPOINT || '';
    const azureOpenAiDeployment =
      (this.node.tryGetContext('azureOpenAiDeployment') as string) ||
      process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.1';
    const azureOpenAiApiVersion =
      (this.node.tryGetContext('azureOpenAiApiVersion') as string) ||
      process.env.AZURE_OPENAI_API_VERSION || '2025-03-01-preview';
    const sesFromEmail =
      (this.node.tryGetContext('sesFromEmail') as string) ||
      process.env.SES_FROM_EMAIL || '';

    const azureOpenAiApiKey =
      (this.node.tryGetContext('azureOpenAiApiKey') as string) ||
      process.env.AZURE_OPENAI_API_KEY || '';
    const adminToken =
      (this.node.tryGetContext('adminToken') as string) ||
      process.env.ADMIN_TOKEN || '';

    const chatEnv: { [key: string]: string } = {
      CONVERSATIONS_TABLE: conversationsTable.tableName,
      AZURE_OPENAI_ENDPOINT: azureOpenAiEndpoint,
      AZURE_OPENAI_DEPLOYMENT: azureOpenAiDeployment,
      AZURE_OPENAI_API_VERSION: azureOpenAiApiVersion,
      SES_FROM_EMAIL: sesFromEmail,
      AZURE_OPENAI_API_KEY: azureKeySecret
        ? azureKeySecret.secretValue.toString()
        : azureOpenAiApiKey,
      ADMIN_TOKEN: adminTokenSecret
        ? adminTokenSecret.secretValue.toString()
        : adminToken,
    };

    const chatFunction = new NodejsFunction(this, 'ChatFunction', {
      entry: path.join(__dirname, 'lambda/chat/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(20),
      bundling: { target: 'es2021', externalModules: ['aws-sdk'] },
      environment: chatEnv,
    });

    conversationsTable.grantReadWriteData(chatFunction);
    chatFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    );

    const api = new apigw.RestApi(this, 'ChatApi', {
      restApiName: 'InterviewChatApi',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'GET', 'POST'],
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    });

    const chatResource = api.root.addResource('chat');
    const lambdaIntegration = new apigw.LambdaIntegration(chatFunction, { proxy: true });
    chatResource.addResource('start').addMethod('POST', lambdaIntegration);
    chatResource.addResource('message').addMethod('POST', lambdaIntegration);
    chatResource.addResource('correction').addMethod('POST', lambdaIntegration);
    chatResource.addResource('conversation').addResource('{id}').addMethod('GET', lambdaIntegration);

    const apiDomainNameStr = `chatapi.${domainName}`;
    const apiDomain = new apigw.DomainName(this, 'ChatApiCustomDomain', {
      domainName: apiDomainNameStr,
      certificate,
      endpointType: apigw.EndpointType.EDGE,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2,
    });

    new apigw.BasePathMapping(this, 'ChatApiDomainMapping', {
      domainName: apiDomain,
      restApi: api,
      basePath: '',
      stage: api.deploymentStage,
    });

    new route53.ARecord(this, 'ChatApiARecord', {
      zone: hostedZone,
      recordName: 'chatapi',
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    });
    new route53.AaaaRecord(this, 'ChatApiAAAARecord', {
      zone: hostedZone,
      recordName: 'chatapi',
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    });

    // ─── Outputs ────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'ChatApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'ChatApiCustomDomainUrl', { value: `https://${apiDomainNameStr}/` });

    } // end deployChatApi

    new cdk.CfnOutput(this, 'DistributionDomainName', { value: distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'StaticBucketName', { value: staticBucket.bucketName });
    new cdk.CfnOutput(this, 'SSRFunctionUrl', { value: functionUrl.url });
    new cdk.CfnOutput(this, 'SSRFunctionName', { value: ssrFunction.functionName });
    new cdk.CfnOutput(this, 'ECRRepositoryUri', { value: ecrRepo.repositoryUri });

  }
}
