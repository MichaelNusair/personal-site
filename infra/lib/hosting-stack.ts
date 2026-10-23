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
}

export class HostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    const { domainName, hostedZoneId, uploadsBucketName } = props;
    const prefix = props.resourcePrefix || 'mntech-internal';
    const siteProfile = props.siteProfile || 'personal';
    const siteUrl = props.siteUrl || `https://${domainName}`;
    const chatApiBase = props.chatApiBase || `https://chatapi.${domainName}/`;

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

    // ─── Chat API ───────────────────────────────────────────────
    //
    // Moved out to ChatApiStack (infra/lib/chat-api-stack.ts) and deployed
    // separately. It is all-new, additive resources and owns only its own
    // subdomain, so unlike this stack it is actually deployable.


    new cdk.CfnOutput(this, 'DistributionDomainName', { value: distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'StaticBucketName', { value: staticBucket.bucketName });
    new cdk.CfnOutput(this, 'SSRFunctionUrl', { value: functionUrl.url });
    new cdk.CfnOutput(this, 'SSRFunctionName', { value: ssrFunction.functionName });
    new cdk.CfnOutput(this, 'ECRRepositoryUri', { value: ecrRepo.repositoryUri });

  }
}
