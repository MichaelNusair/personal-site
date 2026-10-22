#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { HostingStack } from '../lib/hosting-stack';

const app = new cdk.App();

const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '481432042359',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new HostingStack(app, 'PersonalSite', {
  env: awsEnv,
  hostedZoneId: 'Z03747202R7DEBN0UT29F',
  domainName: 'michaelnusair.site',
  uploadsBucketName: 'getvl-uploads-676206907471-us-east-1',
  resourcePrefix: 'mntech-internal',
  siteProfile: 'personal',
});

app.synth();
