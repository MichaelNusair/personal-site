#!/usr/bin/env bash
#
# Deploy the site: build the image, push it to ECR, point the Lambda at it,
# verify the live URL actually changed.
#
#   ./scripts/deploy.sh              # deploy HEAD
#   ./scripts/deploy.sh --dry-run    # build and push, do not touch the Lambda
#   ALLOW_DIRTY=1 ./scripts/deploy.sh
#
# This is the only thing that changes the live site. CI does not deploy (its AWS
# credentials are dead — see README.md "Deploying"), so this script is run by
# hand from a machine with the `mntech1` profile.
#
# Everything configurable lives in deploy.env, next to this script's parent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

# shellcheck disable=SC1091
source ./deploy.env

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
die()  { printf '\n\033[1;31mFAILED: %s\033[0m\n' "$*" >&2; exit 1; }

# An empty AWS_PROFILE_NAME means "credentials are already in the environment",
# which is how CI calls this.
if [[ -n "${AWS_PROFILE_NAME}" ]]; then
  AWS="aws --profile ${AWS_PROFILE_NAME} --region ${AWS_REGION}"
  WHOAMI="profile ${AWS_PROFILE_NAME}"
else
  AWS="aws --region ${AWS_REGION}"
  WHOAMI="ambient credentials"
fi

# ─── 1. Preflight ───────────────────────────────────────────────────
step "Preflight"

command -v git >/dev/null || die "git not found"

if [[ -n "$(git status --porcelain)" ]]; then
  if [[ "${ALLOW_DIRTY:-0}" != "1" ]]; then
    git status --short
    die "working tree is dirty. Commit first so the image tag identifies what shipped, or re-run with ALLOW_DIRTY=1."
  fi
  info "working tree is dirty and ALLOW_DIRTY=1 — tagging as -dirty"
  GIT_SHA="$(git rev-parse HEAD)-dirty"
else
  GIT_SHA="$(git rev-parse HEAD)"
fi
info "commit:  $GIT_SHA"

# Several Claude sessions share this checkout (see /workspace/projects/CLAUDE.md).
# A build picks up whatever is on disk, so say what is on disk.
info "branch:  $(git rev-parse --abbrev-ref HEAD)"

ACCOUNT_ID="$($AWS sts get-caller-identity --query Account --output text 2>/dev/null)" \
  || die "${WHOAMI} cannot call sts:GetCallerIdentity"
info "account: $ACCOUNT_ID (${WHOAMI})"

REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE="${REGISTRY}/${ECR_REPO}"

# `coder` is not in the docker group on this box, so fall back to sudo rather
# than failing with a bare "permission denied".
DOCKER="docker"
if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1; then
    DOCKER="sudo docker"
    info "docker:  via sudo (user is not in the docker group)"
  else
    die "cannot talk to the docker daemon, with or without sudo"
  fi
fi

# Architecture is explicit (TARGET_ARCH in deploy.env) rather than inherited
# from whatever the function happens to be, and the image and the function are
# always set together in the release step below. Mismatching them is the classic
# failure here: Lambda rejects an image whose architecture is not its own, and
# the error arrives at update time, after the whole build.
LIVE_ARCH="$($AWS lambda get-function --function-name "$LAMBDA_FUNCTION" \
  --query 'Configuration.Architectures[0]' --output text 2>/dev/null)" \
  || die "Lambda '${LAMBDA_FUNCTION}' not found in ${ACCOUNT_ID}/${AWS_REGION}"

case "$TARGET_ARCH" in
  x86_64) PLATFORM=linux/amd64 ;;
  arm64)  PLATFORM=linux/arm64 ;;
  *)      die "TARGET_ARCH must be arm64 or x86_64, got '$TARGET_ARCH'" ;;
esac

case "$(uname -m)" in
  aarch64|arm64) HOST_ARCH=arm64 ;;
  x86_64|amd64)  HOST_ARCH=x86_64 ;;
  *)             HOST_ARCH="$(uname -m)" ;;
esac

if [[ "$TARGET_ARCH" == "$LIVE_ARCH" ]]; then
  info "arch:    $TARGET_ARCH (function already $LIVE_ARCH)"
else
  info "arch:    $TARGET_ARCH — this deploy SWITCHES the function from $LIVE_ARCH"
fi

if [[ "$HOST_ARCH" != "$TARGET_ARCH" ]]; then
  info "NOTE: host is $HOST_ARCH, so this cross-builds $TARGET_ARCH under QEMU."
  info "      Expect 45+ minutes, and expect \`npm ci\` to be the flaky part:"
  info "      emulated TLS is slow enough that the registry resets the socket."
fi

# Remember what is live so a rollback is a copy-paste away.
PREV_IMAGE="$($AWS lambda get-function --function-name "$LAMBDA_FUNCTION" \
  --query 'Code.ImageUri' --output text)"
info "currently live: $PREV_IMAGE"

# If the function is on a tag rather than a digest, pin it now. This script
# moves `latest`, so by the time it prints a rollback command that tag would
# already point at the image being deployed — a "rollback" to the new build.
PREV_ROLLBACK="$PREV_IMAGE"
if [[ "$PREV_IMAGE" != *"@sha256:"* ]]; then
  PREV_DIGEST="$($AWS ecr describe-images --repository-name "$ECR_REPO" \
    --image-ids "imageTag=${PREV_IMAGE##*:}" \
    --query 'imageDetails[0].imageDigest' --output text 2>/dev/null || true)"
  if [[ -n "$PREV_DIGEST" && "$PREV_DIGEST" != "None" ]]; then
    PREV_ROLLBACK="${IMAGE}@${PREV_DIGEST}"
    info "pinned for rollback: $PREV_ROLLBACK"
  else
    info "WARNING: could not pin ${PREV_IMAGE} to a digest; rollback target may move"
  fi
fi

# ─── 2. ECR ─────────────────────────────────────────────────────────
step "Logging in to ECR"

$AWS ecr describe-repositories --repository-names "$ECR_REPO" >/dev/null 2>&1 \
  || { info "creating repository $ECR_REPO"; \
       $AWS ecr create-repository --repository-name "$ECR_REPO" \
         --image-scanning-configuration scanOnPush=true >/dev/null; }

$AWS ecr get-login-password | $DOCKER login --username AWS --password-stdin "$REGISTRY" >/dev/null
info "logged in to $REGISTRY"

# ─── 3. Build ───────────────────────────────────────────────────────
step "Building image for $PLATFORM"

BUILDER=site-builder
if ! $DOCKER buildx inspect "$BUILDER" >/dev/null 2>&1; then
  info "creating buildx builder '$BUILDER'"
  $DOCKER buildx create --name "$BUILDER" --driver docker-container --bootstrap >/dev/null
fi

# --provenance/--sbom off: buildx would otherwise push an OCI image index, and
# Lambda rejects a manifest list with "source image ... is not supported".
$DOCKER buildx build \
  --builder "$BUILDER" \
  --platform "$PLATFORM" \
  --provenance=false \
  --sbom=false \
  --build-arg "NEXT_PUBLIC_SITE_PROFILE=${NEXT_PUBLIC_SITE_PROFILE}" \
  --build-arg "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}" \
  --build-arg "NEXT_PUBLIC_CHAT_API_BASE=${NEXT_PUBLIC_CHAT_API_BASE}" \
  --cache-from "type=registry,ref=${IMAGE}:buildcache" \
  --cache-to "type=registry,ref=${IMAGE}:buildcache,mode=max,image-manifest=true,oci-mediatypes=true,ignore-error=true" \
  -t "${IMAGE}:${GIT_SHA}" \
  -t "${IMAGE}:latest" \
  --push \
  .

info "pushed ${IMAGE}:${GIT_SHA}"

if [[ "$DRY_RUN" == "1" ]]; then
  step "Dry run — Lambda left on $PREV_IMAGE"
  exit 0
fi

# ─── 4. Release ─────────────────────────────────────────────────────
step "Pointing $LAMBDA_FUNCTION at the new image"

# Deploy by digest: a tag can be moved out from under the function, a digest
# cannot, so what is live stays identifiable after the next push.
DIGEST="$($AWS ecr describe-images --repository-name "$ECR_REPO" \
  --image-ids "imageTag=${GIT_SHA}" \
  --query 'imageDetails[0].imageDigest' --output text)"
info "digest: $DIGEST"

# --architectures goes with --image-uri in the same call, so the function never
# sits in a state where its architecture and its image disagree.
$AWS lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION" \
  --image-uri "${IMAGE}@${DIGEST}" \
  --architectures "$TARGET_ARCH" \
  --no-cli-pager >/dev/null

$AWS lambda wait function-updated --function-name "$LAMBDA_FUNCTION"
info "function updated"

# ─── 5. Verify ──────────────────────────────────────────────────────
step "Verifying $SMOKE_URL"

LIVE_IMAGE="$($AWS lambda get-function --function-name "$LAMBDA_FUNCTION" \
  --query 'Code.ImageUri' --output text)"
[[ "$LIVE_IMAGE" == "${IMAGE}@${DIGEST}" ]] \
  || die "Lambda reports $LIVE_IMAGE, expected ${IMAGE}@${DIGEST}"
info "image in place"

# First request after an image swap cold-starts a ~385 MB image; give it room.
BODY=/tmp/deploy-smoke-$$.html
CODE="$(curl -sS --max-time 90 --retry 3 --retry-delay 5 --retry-all-errors \
  -o "$BODY" -w '%{http_code}' "$SMOKE_URL")" || die "could not reach $SMOKE_URL"
[[ "$CODE" == "200" ]] || { head -c 400 "$BODY" >&2; die "$SMOKE_URL returned HTTP $CODE"; }
info "HTTP 200"

# og:url is built from NEXT_PUBLIC_SITE_URL, so this proves the new build is the
# one answering, not just that something is answering.
if grep -q "og:url\" content=\"${NEXT_PUBLIC_SITE_URL}" "$BODY"; then
  info "og:url is ${NEXT_PUBLIC_SITE_URL} — new build is live"
else
  info "WARNING: og:url does not match ${NEXT_PUBLIC_SITE_URL}:"
  grep -o 'og:url[^>]*' "$BODY" | head -1 | sed 's/^/      /' || info "      (no og:url found)"
  die "the live page does not look like this build"
fi
rm -f "$BODY"

step "Deployed"
cat <<EOF
    commit    $GIT_SHA
    image     ${IMAGE}@${DIGEST}
    live      $SMOKE_URL

    Roll back with:
      ${AWS} lambda update-function-code \\
        --function-name ${LAMBDA_FUNCTION} --image-uri ${PREV_ROLLBACK} \\
        --architectures ${LIVE_ARCH} --no-cli-pager
EOF
