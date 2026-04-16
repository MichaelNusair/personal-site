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
  resourcePrefix: 'mntech-internal',
  siteProfile: 'personal',
});

new HostingStack(app, 'StrikeLabsSite', {
  env: awsEnv,
  hostedZoneId: process.env.STRIKELABS_HOSTED_ZONE_ID || '',
  domainName: 'strikelabs.tech',
  uploadsBucketName: 'getvl-uploads-676206907471-us-east-1',
  resourcePrefix: 'strikelabs',
  siteProfile: 'strike_labs',
  siteUrl: 'https://strikelabs.tech',
  chatApiBase: 'https://chatapi.michaelnusair.tech/',
  deployChatApi: false,
});

app.synth();
