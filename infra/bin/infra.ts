#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { HostingStack } from '../lib/hosting-stack';
import { ChatApiStack } from '../lib/chat-api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '481432042359',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const DOMAIN_NAME = 'michaelnusair.site';
const HOSTED_ZONE_ID = 'Z03747202R7DEBN0UT29F';
const UPLOADS_BUCKET = 'getvl-uploads-676206907471-us-east-1';

// ─── Safe to deploy ───────────────────────────────────────────────────
// All-new resources, and the only DNS it owns is its own subdomain.
new ChatApiStack(app, 'PersonalSiteChatApi', {
  env,
  domainName: DOMAIN_NAME,
  hostedZoneId: HOSTED_ZONE_ID,
  description: 'Chat backend for michaelnusair.site (chatapi subdomain)',
});

// ─── NOT safe to deploy ───────────────────────────────────────────────
// HostingStack describes an *intended* architecture (CloudFront over a Lambda
// function URL). What actually serves michaelnusair.site is a set of hand-made
// resources — Lambda mntech-internal-ssr, ECR mntech-internal-web, HTTP API
// viyra070qf — that belong to no CloudFormation stack.
//
// Deploying it therefore CREATEs: it collides on those taken names and fails,
// but not before UPSERT-ing the apex and www A/AAAA records to a new
// distribution — which CloudFormation then DELETEs as it rolls back, leaving
// michaelnusair.site with no address at all. A failed deploy here is an outage,
// not a no-op.
//
// So it is not even instantiated unless you say the words. `cdk deploy
// PersonalSite` without the flag fails with "no stack found", which is the
// point. The actual fix is `cdk import PersonalSite` to adopt the live
// resources first; see README.md "Infrastructure".
const DNS_OPT_IN = 'iUnderstandThisWillReplaceLiveDns';
const optIn = app.node.tryGetContext(DNS_OPT_IN);

if (optIn === true || optIn === 'true') {
  new HostingStack(app, 'PersonalSite', {
    env,
    hostedZoneId: HOSTED_ZONE_ID,
    domainName: DOMAIN_NAME,
    uploadsBucketName: UPLOADS_BUCKET,
    resourcePrefix: 'mntech-internal',
    siteProfile: 'personal',
    description: 'michaelnusair.site hosting — NOT the live architecture, read README first',
  });
} else {
  // Visible on every synth so nobody concludes the stack went missing.
  cdk.Annotations.of(app).addInfo(
    `PersonalSite is withheld: it would take michaelnusair.site's DNS down. ` +
      `Pass -c ${DNS_OPT_IN}=true only after importing the live resources.`,
  );
}

app.synth();
