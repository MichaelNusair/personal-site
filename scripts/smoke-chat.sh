#!/usr/bin/env bash
#
# End-to-end check of the chat backend: start a conversation, ask a question
# that only the real context can answer, print what came back.
#
#   ./scripts/smoke-chat.sh ["your question"]
#
# Exercises the public path (custom domain, CORS, Azure OpenAI, DynamoDB), so a
# pass means the "Ask my AI" button works for a visitor, not just that the
# Lambda is alive.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
# shellcheck disable=SC1091
source ./deploy.env

BASE="${NEXT_PUBLIC_CHAT_API_BASE%/}"
QUESTION="${1:-What is Michael working on right now, and which ventures does he run?}"

echo "==> POST ${BASE}/chat/start"
START="$(curl -sS --max-time 60 -X POST "${BASE}/chat/start" \
  -H 'content-type: application/json' -d '{}')"

CONV_ID="$(printf '%s' "$START" | python3 -I -c 'import json,sys; print(json.load(sys.stdin)["conversationId"])')"
echo "    conversationId: $CONV_ID"
printf '%s' "$START" | python3 -I -c '
import json, sys, textwrap
d = json.load(sys.stdin)
print(textwrap.indent(textwrap.fill(d["message"]["content"], 76), "    "))
'

echo
echo "==> POST ${BASE}/chat/message"
echo "    asking: $QUESTION"
BODY="$(python3 -I -c '
import json, sys
print(json.dumps({"conversationId": sys.argv[1], "message": sys.argv[2]}))
' "$CONV_ID" "$QUESTION")"

printf '%s' "$BODY" | curl -sS --max-time 90 -X POST "${BASE}/chat/message" \
  -H 'content-type: application/json' --data-binary @- \
  | python3 -I -c '
import json, sys, textwrap
d = json.load(sys.stdin)
if "message" not in d:
    print("    FAILED:", json.dumps(d)[:400]); sys.exit(1)
print(textwrap.indent(textwrap.fill(d["message"]["content"], 76), "    "))
'

echo
echo "==> OK"
