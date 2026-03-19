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
}

export class HostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    const { domainName, hostedZoneId, uploadsBucketName } = props;

    // Route53 hosted zone (already exists)
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId,
      zoneName: domainName,
    });

    // ACM certificate (must be us-east-1 for CloudFront)
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // S3 bucket for static assets (/_next/static)
    const staticBucket = new s3.Bucket(this, 'StaticAssets', {
      bucketName: `mntech-internal-static-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ECR repository for the Next.js Docker image
    const ecrRepo = new ecr.Repository(this, 'WebAppRepo', {
      repositoryName: 'mntech-internal-web',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{ maxImageCount: 5, description: 'Keep only 5 images' }],
    });

    // Check for pre-built image URI from CI
    const ssrImageUri = process.env.SSR_IMAGE_URI;

    // Lambda function: Next.js SSR via Docker + Lambda Web Adapter
    const ssrFunction = new lambda.DockerImageFunction(this, 'SSRFunction', {
      functionName: 'mntech-internal-ssr',
      code: ssrImageUri
        ? lambda.DockerImageCode.fromEcr(
            ecr.Repository.fromRepositoryName(this, 'SSRRepo', 'mntech-internal-ssr'),
            { tagOrDigest: ssrImageUri.split(':').pop() },
          )
        : lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../..'), {
            file: 'Dockerfile',
          }),
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024,
      ephemeralStorageSize: cdk.Size.mebibytes(1024),
      environment: {
        NODE_ENV: 'production',
        PORT: '8080',
        AWS_LWA_INVOKE_MODE: 'buffered',
        AUTH_TRUST_HOST: 'true',
        NEXTAUTH_URL: `https://${domainName}`,
        UPLOADS_BUCKET: uploadsBucketName,
      },
    });

    // Grant S3 access for audio uploads
    ssrFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`arn:aws:s3:::${uploadsBucketName}/*`],
      }),
    );

    // Lambda Function URL (BUFFERED mode for correct redirect handling)
    const functionUrl = ssrFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.BUFFERED,
    });

    // CloudFront distribution
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
      additionalBehaviors: {
        '/_next/static/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(staticBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      domainNames: [domainName],
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // DNS: A and AAAA records for michaelnusair.tech → CloudFront
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

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, 'StaticBucketName', {
      value: staticBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'SSRFunctionUrl', {
      value: functionUrl.url,
    });
    new cdk.CfnOutput(this, 'SSRFunctionName', {
      value: ssrFunction.functionName,
    });
    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: ecrRepo.repositoryUri,
    });
  }
}
