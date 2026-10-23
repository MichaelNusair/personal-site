# michaelnusair.site

Michael Nusair's personal site, plus a few internal tools, in one Next.js app.
It is white-labelled: the same image can be built as the personal site or as the
Strike Labs site by changing one build arg (`lib/site-profile.ts`).

| Route | What it is | Works in production? |
|---|---|---|
| `/` | Resume / landing page. The thing people actually visit. | yes |
| `/chat`, the "Ask my AI" button | Chat about Michael, answered by a separate chat API (`chatapi.michaelnusair.site`) | yes |
| `/fun` | Easter eggs | yes |
| `/admin` | Review chat transcripts, send corrections | needs `ADMIN_TOKEN` on the chat API |
| `/f` | Upload audio/video, transcribe via Azure Whisper | **no** — see "Production configuration gap" |
| `/realtime` | Voice AI demo on the Azure Realtime API | **no** — same reason |

## Development

```sh
npm install
npx prisma generate --schema=packages/database/prisma/schema.prisma
npm run dev          # http://localhost:3001
```

Copy `.env.example` to `.env` first if you are working on `/f`, `/realtime` or
auth; the landing page and chat need nothing.

## Deploying

One command, from a machine with the `mntech1` AWS profile:

```sh
./scripts/deploy.sh
```

That builds the image, pushes it to ECR, points the Lambda at it by digest,
waits for the update, then fetches the live page and fails if it is not serving
this build. It prints a copy-pasteable rollback command at the end.

```sh
./scripts/deploy.sh --dry-run        # build and push, leave the Lambda alone
ALLOW_DIRTY=1 ./scripts/deploy.sh    # deploy uncommitted work (tags the image -dirty)
```

Everything configurable — account, ECR repo, function name, the `NEXT_PUBLIC_*`
values baked into the build, the URL the deploy smoke-tests — lives in
[deploy.env](deploy.env). CI runs the same script rather than keeping its own
copy of the logic.

Three things that are easy to get wrong and that the script now handles for you:

- **Architecture.** Lambda rejects an image built for the other instruction
  set, and it says so only at release time, after the whole build. The function
  runs `arm64` (`TARGET_ARCH` in `deploy.env`) to match the aarch64 box it is
  deployed from, so the build is native and takes a few minutes. The script
  sends `--architectures` in the same call as `--image-uri`, so the two can
  never disagree, and it tells you when a deploy is about to change the
  architecture. Flipping `TARGET_ARCH` back to `x86_64` works, but then an
  aarch64 host cross-builds under QEMU, which takes about an hour and tends to
  fail in `npm ci` with `ECONNRESET` — emulated TLS is slow enough that the
  registry hangs up. That is why this is arm64.
- **Buildx attestations.** `docker buildx build --push` adds provenance/SBOM by
  default, which makes the push an OCI image *index*. Lambda rejects those
  ("the image manifest, config or layer media type ... is not supported"). The
  script passes `--provenance=false --sbom=false`.
- **Updating the Lambda is the entire deploy.** Static assets ship inside the
  image and are served by Next's standalone server, so there is no
  asset-upload step to forget and no window where the HTML and its chunks
  disagree.

### CI does not deploy right now

The repo's `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets are rejected by
STS, so [the deploy job](.github/workflows/ci.yml) validates the commit, then
writes a "deploy skipped" warning to the run summary instead of failing. Rotate
those two secrets and it resumes deploying on its own. Until then, pushing to
main does **not** change the live site — run `./scripts/deploy.sh`.

## Infrastructure

Read this before running anything in `infra/`.

The resources serving the site today were created by hand and are **not managed
by CloudFormation**:

```
michaelnusair.site      ─A/AAAA─▶ API Gateway HTTP API viyra070qf (personal-ssr-api)
www.michaelnusair.site                └─▶ Lambda mntech-internal-ssr (x86_64, container)
                                              └─▶ ECR mntech-internal-web
```

There is no `PersonalSite` stack in account 481432042359, and the Lambda carries
no `aws:cloudformation:*` tags. `infra/lib/hosting-stack.ts` describes a
*different, intended* architecture (CloudFront in front of a Lambda function
URL), so deploying it would try to create resources whose names are already
taken — and on the way in it UPSERTs the apex and `www` A records, then deletes
them when the failed stack rolls back. That takes the site's DNS down.

To stop that happening by accident, the stack refuses to synthesize unless you
pass an explicit opt-in:

```sh
cd infra && npx cdk deploy PersonalSite -c iUnderstandThisWillReplaceLiveDns=true
```

The real fix is to adopt the live resources (`cdk import PersonalSite`) so the
stack matches reality, and only then deploy. That has not been done.

What *is* CloudFormation-managed, because it was created new and additively:

- **`PersonalSiteChatApi`** (`infra/lib/chat-api-stack.ts`) — the chat backend
  behind the "Ask my AI" button: DynamoDB table, Lambda, REST API, and the
  `chatapi.michaelnusair.site` custom domain. It only ever creates its own
  subdomain record, so it cannot affect the apex. Deploy it with:

  ```sh
  cd infra && npm install && npx cdk deploy PersonalSiteChatApi
  ```

  Its Azure OpenAI key is read at deploy time from the `getvl/app-secrets`
  secret, not stored in this repo.

  Check it end to end — real request, real Azure call, real DynamoDB write:

  ```sh
  ./scripts/smoke-chat.sh                      # default question
  ./scripts/smoke-chat.sh "Where is he based?" # or ask your own
  ```

  The `/admin` page wants the bearer token the stack generated. Read it with:

  ```sh
  aws --profile mntech1 secretsmanager get-secret-value \
    --secret-id AdminToken38B307E8-Sfj53644ltsJ --query SecretString --output text
  ```

## Production configuration gap

The SSR Lambda has **no environment variables set at all**. The landing page and
the chat widget do not need any, which is why the site looks fine — but it means
`DATABASE_URL`, the Azure Whisper credentials, the S3 uploads bucket and the
NextAuth secrets are all absent, so `/f`, `/realtime` and Google sign-in cannot
work in production regardless of what the code does. `/realtime` currently
answers 500, and the log says why:

```
[next-auth][error][NO_SECRET] Please define a `secret` in production.
```

`.env.example` lists what those routes would need, and the values exist in the
`getvl/app-secrets` secret. Setting them is deliberately **not** part of
deploying: the function is not in a CloudFormation stack, so anything set on it
by hand is untracked state that the next person cannot see. Worth doing
properly — adopt the function into IaC first (see above), then set its
environment there.

## Architecture notes

- **Next.js** (app router, `output: 'standalone'`) in a container on Lambda,
  fronted by the AWS Lambda Web Adapter.
- **PostgreSQL** via Prisma (`packages/database`) for the transcription models.
  The client is generated, not committed, so `prisma generate` runs before any
  typecheck or build.
- **S3** for uploads, **SQS** + a worker for chunked transcription.
- `mntech-internal-static-481432042359-us-east-1` is left over from an earlier
  design and serves nothing. Nothing writes to it any more.
