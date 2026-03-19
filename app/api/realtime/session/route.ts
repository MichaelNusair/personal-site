import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, REALTIME_ALLOWED_EMAILS } from '@/lib/auth';
import { STORE_NAME, STORE_KNOWLEDGE } from '@/lib/realtime/mock-store';

const AZURE_REALTIME_ENDPOINT = 'https://azure-mlcgltsu-eastus2.openai.azure.com';
const AZURE_REALTIME_DEPLOYMENT = 'gpt-realtime-1.5';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const OPENING_MESSAGE = 'Hi! Welcome to the TalkPilot Demo Store. How can I help you today?';

function buildSystemPrompt(): string {
  return `You are a friendly and professional voice shopping assistant for "${STORE_NAME}".

## Core Rules
- You are a VOICE-ONLY assistant. Keep responses concise and conversational.
- ONLY answer based on the store information provided below. NEVER invent or hallucinate facts.
- If you don't have the information, say "I don't have that information" and offer to connect the visitor with a human representative.
- NEVER discuss competitors or products outside this store.
- NEVER offer coupon codes or discounts.
- NEVER add items to the cart on behalf of the user.
- When suggesting a different product page, you MUST ask for explicit verbal confirmation before navigating.
- Respond in the same language as the visitor.

## Opening
When the conversation starts, greet with: "${OPENING_MESSAGE}"

## Current Visitor Context
- Current page: https://demo.talkpilot.com (playground)
- This is a demo/playground session for testing TalkPilot features.

## Store Knowledge
${STORE_KNOWLEDGE}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase();

    if (!email || !REALTIME_ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = requireEnv('AZURE_OPENAI_REALTIME_API_KEY');

    const instructions = buildSystemPrompt();

    const sessionConfig = {
      session: {
        type: 'realtime',
        model: AZURE_REALTIME_DEPLOYMENT,
        instructions,
        audio: {
          output: {
            voice: 'alloy',
          },
        },
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${AZURE_REALTIME_ENDPOINT}/openai/v1/realtime/client_secrets`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Azure OpenAI session creation failed', {
        status: response.status,
        body: errBody,
      });
      let message = 'Failed to create realtime session';
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) message = parsed.error.message;
        else if (parsed.message) message = parsed.message;
      } catch {
        if (errBody.length < 200) message = errBody;
      }
      return NextResponse.json(
        { error: message },
        { status: 502 },
      );
    }

    const data = await response.json();
    const ephemeralToken = data.value || data.client_secret?.value;

    if (!ephemeralToken) {
      console.error('No ephemeral token in response:', data);
      return NextResponse.json(
        { error: 'No ephemeral token available' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ephemeralKey: ephemeralToken,
      azureEndpoint: AZURE_REALTIME_ENDPOINT,
    });
  } catch (error) {
    console.error('Realtime session error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
