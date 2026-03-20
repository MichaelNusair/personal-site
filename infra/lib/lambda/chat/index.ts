/* eslint-disable */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "crypto";

const dynamoClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(dynamoClient);
const ses = new SESClient({});

const TABLE = process.env.CONVERSATIONS_TABLE as string;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT as string;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY as string;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT as string;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION as string;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || "";

const loge = (...args: any[]) => {
  console.error(...args, {
    TABLE,
    AZURE_OPENAI_ENDPOINT: AZURE_OPENAI_ENDPOINT ? '[set]' : '[missing]',
    AZURE_OPENAI_API_KEY: AZURE_OPENAI_API_KEY ? '[set]' : '[missing]',
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION,
    ADMIN_TOKEN: ADMIN_TOKEN ? '[set]' : '[missing]',
    SES_FROM_EMAIL: SES_FROM_EMAIL || '[missing]',
  });
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
  "Content-Type": "application/json",
};

const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

const nowIso = () => new Date().toISOString();

async function callAzureOpenAI(messages: ChatMessage[]): Promise<string> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    loge(
      "Azure OpenAI configuration error: Missing endpoint or API key",
      {
        AZURE_OPENAI_ENDPOINT: AZURE_OPENAI_ENDPOINT ? '[set]' : '[missing]',
        AZURE_OPENAI_API_KEY: AZURE_OPENAI_API_KEY ? '[set]' : '[missing]',
        AZURE_OPENAI_DEPLOYMENT,
        AZURE_OPENAI_API_VERSION,
      }
    );
    return "I'm not configured yet. Please try again later.";
  }

  const base = AZURE_OPENAI_ENDPOINT.replace(/\/+$/, '');
  const url = `${base}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
  const payload = {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 600,
  } as const;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    loge("Azure OpenAI error", res.status, txt);
    return "Sorry, I couldn't generate a response right now.";
  }
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return content;
}

function systemPrompt(ownerName = "Michael", staticContext?: string) {
  return `You are an AI assistant for ${ownerName}'s personal site. Conduct a concise, friendly, interview-style conversation.
You have the following static context about ${ownerName}:
${staticContext || "(no static context provided)"}
Rules:
- Ask one clear question at a time unless explicitly asked multiple.
- Keep answers brief and helpful (2-5 short sentences), and propose a follow-up question when appropriate.
- If unsure, say so and offer to follow up later.
- Never fabricate private facts; prefer general guidance.
- If the user shares contact info, acknowledge it and continue.
- Compensation policy: Never reveal exact salary numbers. If an offer is provided, only classify it as "in range" or "below range" based on internal guidance from context. If below range, politely ask the user to make another offer until it's in range. If asked for a number, request their compensation band first and confirm alignment—do not state a number.
`;
}

async function handleStart(body: any) {
  const { userEmail = "", ownerName = "Michael", staticContext } = body || {};
  const conversationId = randomUUID();

  const disclaimer =
    "Disclaimer: This AI may be inaccurate. Conversations are recorded so Michael can review and send corrections. If you share your email, you may receive corrections or follow-up.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt(ownerName, staticContext),
      timestamp: nowIso(),
    },
    {
      role: "assistant",
      content: `${disclaimer}\n\nHi! I'm the AI assistant. What would you like to know about Michael or his experience?`,
      timestamp: nowIso(),
    },
  ];

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        conversationId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        userEmail,
        ownerName,
        messages,
        corrections: [],
      },
      ConditionExpression: "attribute_not_exists(conversationId)",
    })
  );

  return buildResponse(200, { conversationId, message: messages[1] });
}

async function loadConversation(conversationId: string) {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { conversationId } })
  );
  return res.Item as any;
}

async function handleMessage(body: any) {
  const { conversationId, message } = body || {};
  if (!conversationId || !message) {
    return buildResponse(400, {
      error: "conversationId and message are required",
    });
  }
  const convo = await loadConversation(conversationId);
  if (!convo) return buildResponse(404, { error: "Conversation not found" });

  const userMsg: ChatMessage = {
    role: "user",
    content: message,
    timestamp: nowIso(),
  };
  const history: ChatMessage[] = [
    ...convo.messages.filter(
      (m: ChatMessage) => m.role !== "assistant" || !!m.content
    ),
    userMsg,
  ];

  const assistantText = await callAzureOpenAI(history);
  const assistantMsg: ChatMessage = {
    role: "assistant",
    content: assistantText,
    timestamp: nowIso(),
  };

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { conversationId },
      UpdateExpression:
        "SET #messages = list_append(#messages, :newMsgs), updatedAt = :now",
      ExpressionAttributeNames: { "#messages": "messages" },
      ExpressionAttributeValues: {
        ":newMsgs": [userMsg, assistantMsg],
        ":now": nowIso(),
      },
    })
  );

  return buildResponse(200, { message: assistantMsg });
}

async function handleCorrection(event: any, body: any) {
  const { conversationId, correction, notifyUser = true } = body || {};
  if (!conversationId || !correction) {
    return buildResponse(400, {
      error: "conversationId and correction are required",
    });
  }
  const auth =
    event.headers?.Authorization || event.headers?.authorization || "";
  if (ADMIN_TOKEN && auth !== `Bearer ${ADMIN_TOKEN}`) {
    return buildResponse(401, { error: "Unauthorized" });
  }
  const convo = await loadConversation(conversationId);
  if (!convo) return buildResponse(404, { error: "Conversation not found" });

  const correctionItem = { text: correction, timestamp: nowIso() };
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { conversationId },
      UpdateExpression:
        "SET #corrections = list_append(if_not_exists(#corrections, :empty), :c), updatedAt = :now",
      ExpressionAttributeNames: { "#corrections": "corrections" },
      ExpressionAttributeValues: {
        ":c": [correctionItem],
        ":empty": [],
        ":now": nowIso(),
      },
    })
  );

  if (notifyUser && convo.userEmail && SES_FROM_EMAIL) {
    try {
      await ses.send(
        new SendEmailCommand({
          Destination: { ToAddresses: [convo.userEmail] },
          Source: SES_FROM_EMAIL,
          Message: {
            Subject: { Data: "Correction from Michael" },
            Body: {
              Text: {
                Data: `Hi,\n\nMichael reviewed your AI conversation and has a correction or follow-up:\n\n${correction}\n\nThanks for reaching out!`,
              },
            },
          },
        })
      );
    } catch (e) {
      loge("SES send error", e);
    }
  }

  return buildResponse(200, { ok: true });
}

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return buildResponse(200, {});
  }
  let body: any = undefined;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return buildResponse(400, { error: "Invalid JSON" });
  }
  const path = (event.path || event.resource || "").toLowerCase();
  const method = (event.httpMethod || "GET").toUpperCase();

  try {
    if (method === "POST" && path.endsWith("/chat/start")) {
      return await handleStart(body);
    }
    if (method === "POST" && path.endsWith("/chat/message")) {
      return await handleMessage(body);
    }
    if (method === "POST" && path.endsWith("/chat/correction")) {
      return await handleCorrection(event, body);
    }
    if (method === "GET" && path.includes("/chat/conversation/")) {
      const id =
        event.pathParameters?.id || path.split("/chat/conversation/")[1];
      if (!id) return buildResponse(400, { error: "id required" });
      const auth =
        event.headers?.Authorization || event.headers?.authorization || "";
      if (ADMIN_TOKEN && auth !== `Bearer ${ADMIN_TOKEN}`) {
        return buildResponse(401, { error: "Unauthorized" });
      }
      const convo = await loadConversation(id);
      if (!convo) return buildResponse(404, { error: "Not Found" });
      return buildResponse(200, { conversation: convo });
    }
    return buildResponse(404, { error: "Not Found" });
  } catch (e: any) {
    loge("Handler error", e);
    return buildResponse(500, { error: "Internal Server Error" });
  }
};
