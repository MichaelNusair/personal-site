import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RESUME_CONTEXT } from '@/content/resume-context';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  timestamp?: string;
};

const API_BASE = 'https://chatapi.michaelnusair.tech/';

export function ChatWidget() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const started = !!conversationId;
  const canSend = started && input.trim().length > 0 && !isSending;

  async function start() {
    if (!API_BASE) {
      setMessages([{ role: 'assistant', content: 'Chat backend not configured.' }]);
      return;
    }
    setIsStarting(true);
    try {
      const res = await fetch(`${API_BASE}chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email || undefined,
          staticContext: RESUME_CONTEXT,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConversationId(data.conversationId);
        setMessages([{ role: 'assistant', content: data.message?.content || 'Hello!' }]);
      } else {
        setMessages([{ role: 'assistant', content: data?.error || 'Failed to start' }]);
      }
    } catch (e) {
      setMessages([{ role: 'assistant', content: 'Network error starting chat' }]);
    } finally {
      setIsStarting(false);
    }
  }

  async function send() {
    if (!API_BASE || !conversationId) return;
    const text = input.trim();
    if (!text) return;
    setIsSending(true);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    try {
      const res = await fetch(`${API_BASE}chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: data.message?.content || '' }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data?.error || 'Error' }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Network error' }]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[92vw]">
      <Card className="shadow-xl border border-gray-200">
        <CardHeader>
          <div className="text-sm text-gray-500">
            Disclaimer: AI may be inaccurate. Conversations are recorded so Michael can review and send corrections.
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!started ? (
            <div className="space-y-2">
              <Input
                placeholder="Your email (optional, for corrections)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={start} disabled={isStarting} className="w-full">
                {isStarting ? 'Starting...' : 'Start chat'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-80">
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {messages.map((m, idx) => (
                  <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'inline-block bg-blue-600 text-white px-3 py-2 rounded-lg'
                          : 'inline-block bg-gray-100 text-gray-900 px-3 py-2 rounded-lg'
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your message"
                  className="min-h-[42px] max-h-28"
                />
                <Button onClick={send} disabled={!canSend}>
                  Send
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-[11px] text-gray-500">Interview-style assistant</div>
          {started && <div className="text-[11px] text-gray-500">Conversation ID: {conversationId?.slice(0, 8)}</div>}
        </CardFooter>
      </Card>
    </div>
  );
}

export default ChatWidget;
