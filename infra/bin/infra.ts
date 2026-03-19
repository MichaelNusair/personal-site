#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { HostingStack } from '../lib/hosting-stack';

const app = new cdk.App();

const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '676206907471',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new HostingStack(app, 'PersonalSite', {
  env: awsEnv,
  hostedZoneId: 'Z08723561FBMHGS7V62TS',
  domainName: 'michaelnusair.tech',
  uploadsBucketName: 'getvl-uploads-676206907471-us-east-1',
});

app.synth();
