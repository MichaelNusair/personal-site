/* eslint-disable */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
import { randomUUID } from "crypto";
import { SERVER_CONTEXT } from "./context";
import { STRIKE_LABS_CONTEXT } from "./strike-labs-context";

export type ChatPersona = "personal" | "strike_labs";

const dynamoClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(dynamoClient);
const ses = new SESClient({});

const TABLE = process.env.CONVERSATIONS_TABLE as string;
const CHAT_MODEL = process.env.BEDROCK_CHAT_MODEL || "anthropic.claude-opus-5-5";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || "";

const loge = (...args: any[]) => {
  console.error(...args, {
    TABLE,
    CHAT_MODEL,
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

const anthropic = new AnthropicBedrockMantle({
  awsRegion: process.env.AWS_REGION || "us-east-1",
});

/**
 * Claude on Bedrock. This was Azure OpenAI (`gpt-51` on
 * all-strike.openai.azure.com) until 2026-10-23, when the Azure estate was shut
 * down. Three differences matter, and all three are silent if missed:
 *
 *  - The model id is the bare `anthropic.` one. This client speaks to Bedrock's
 *    Messages-API endpoint, where the `us.anthropic.*` inference-profile id that
 *    `bedrock-runtime:InvokeModel` requires returns a 404 instead.
 *  - The system prompt is a separate parameter, not a `system` role inside the
 *    array, and the array must open on a user turn and alternate. The callers
 *    here build history with the system prompt first, so it is split back out.
 *  - No `temperature` or `top_p`: the previous payload sent 0.3/0.9 and any
 *    sampling parameter is rejected with a 400. `effort` replaces them.
 *
 * There is also no key any more — the function's own role is the credential, so
 * nothing secret is in the Lambda's environment.
 */
async function callClaude(messages: ChatMessage[]): Promise<string> {
  const systemParts: string[] = [];
  const turns: { role: "user" | "assistant"; content: string }[] = [];

  for (const m of messages) {
    if (!m.content) continue;
    if (m.role === "system") {
      systemParts.push(m.content);
      continue;
    }
    if (turns.length === 0 && m.role === "assistant") continue;
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) {
      last.content += `\n\n${m.content}`;
      continue;
    }
    turns.push({ role: m.role, content: m.content });
  }

  if (turns.length === 0) {
    return "I'm not sure what to answer — could you say that again?";
  }

  try {
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      ...(systemParts.length ? { system: systemParts.join("\n\n") } : {}),
      messages: turns,
    });

    return response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
  } catch (err) {
    loge("Bedrock error", err);
    return "Sorry, I couldn't generate a response right now.";
  }
}

function normalizePersona(raw: unknown): ChatPersona {
  if (raw === "strike_labs") return "strike_labs";
  return "personal";
}

function systemPromptPersonal(ownerName = "Michael") {
  return `You are an AI assistant for ${ownerName}'s personal site. Conduct a concise, friendly, interview-style conversation.
You have the following static context about ${ownerName}:
${SERVER_CONTEXT}
Rules:
- Ask one clear question at a time unless explicitly asked multiple.
- Keep answers brief and helpful (2-5 short sentences), and propose a follow-up question when appropriate.
- If unsure, say so and offer to follow up later.
- Never fabricate private facts; prefer general guidance.
- If the user shares contact info, acknowledge it and continue.
- Compensation policy: Never reveal exact salary numbers. If an offer is provided, only classify it as "in range" or "below range" based on internal guidance from context. If below range, politely ask the user to make another offer until it's in range. If asked for a number, request their compensation band first and confirm alignment—do not state a number.
`;
}

function systemPromptStrikeLabs() {
  return `You are an AI assistant for Strike Labs, a software and social agency. Conduct a concise, friendly, consultative conversation—like a knowledgeable team member, not a pushy salesperson.
You have the following static context:
${STRIKE_LABS_CONTEXT}
Rules:
- Ask one clear question at a time unless the user asks for multiple.
- Keep answers brief and helpful (2–6 short sentences), and propose a follow-up when appropriate.
- If unsure, say so and offer to continue via email or a call.
- Never fabricate case studies, client names, or metrics; prefer general capabilities.
- If the user shares contact info, acknowledge it and continue.
`;
}

function buildSystemPrompt(persona: ChatPersona): string {
  return persona === "strike_labs"
    ? systemPromptStrikeLabs()
    : systemPromptPersonal();
}

function startCopy(persona: ChatPersona): {
  disclaimer: string;
  assistantIntro: string;
} {
  if (persona === "strike_labs") {
    return {
      disclaimer:
        "Disclaimer: This AI may be inaccurate. Conversations are recorded so the Strike Labs team can review and send corrections. If you share your email, you may receive corrections or follow-up.",
      assistantIntro:
        "Hi! I'm Strike Labs' AI assistant. What are you building or exploring, and how can we help?",
    };
  }
  return {
    disclaimer:
      "Disclaimer: This AI may be inaccurate. Conversations are recorded so Michael can review and send corrections. If you share your email, you may receive corrections or follow-up.",
    assistantIntro:
      "Hi! I'm the AI assistant. What would you like to know about Michael or his experience?",
  };
}

async function handleStart(body: any) {
  const { userEmail = "" } = body || {};
  const persona = normalizePersona(body?.persona);
  const conversationId = randomUUID();

  const { disclaimer, assistantIntro } = startCopy(persona);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(persona),
      timestamp: nowIso(),
    },
    {
      role: "assistant",
      content: `${disclaimer}\n\n${assistantIntro}`,
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
        persona,
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

  const assistantText = await callClaude(history);
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
    const isStrike = convo.persona === "strike_labs";
    const subject = isStrike
      ? "Correction from Strike Labs"
      : "Correction from Michael";
    const bodyText = isStrike
      ? `Hi,\n\nThe Strike Labs team reviewed your AI conversation and has a correction or follow-up:\n\n${correction}\n\nThanks for reaching out!`
      : `Hi,\n\nMichael reviewed your AI conversation and has a correction or follow-up:\n\n${correction}\n\nThanks for reaching out!`;
    try {
      await ses.send(
        new SendEmailCommand({
          Destination: { ToAddresses: [convo.userEmail] },
          Source: SES_FROM_EMAIL,
          Message: {
            Subject: { Data: subject },
            Body: {
              Text: {
                Data: bodyText,
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
