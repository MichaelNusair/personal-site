'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getChatApiBase, getSiteConfig } from '@/lib/site-config';
import { getChatPersonaForProfile, getSiteProfile } from '@/lib/site-profile';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  timestamp?: string;
};

export default function ChatPage() {
  const API_BASE = getChatApiBase();
  const profile = getSiteProfile();
  const { chatDisclaimerShort } = getSiteConfig(profile);
  const chatPersona = getChatPersonaForProfile(profile);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages]);

  async function start() {
    if (!API_BASE) {
      setMessages([{ role: 'assistant', content: 'Chat backend not configured.' }]);
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`${API_BASE}chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email || undefined,
          persona: chatPersona,
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
      setStarting(false);
    }
  }

  async function send() {
    if (!API_BASE || !conversationId) return;
    const text = input.trim();
    if (!text) return;
    setSending(true);
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
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow border p-4">
        <div className="text-sm text-gray-500 mb-3">Disclaimer: {chatDisclaimerShort}</div>
        {!conversationId ? (
          <div className="space-y-3">
            <Input
              placeholder="Your email (optional, for corrections)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={start} disabled={starting} className="w-full">
              {starting ? 'Starting...' : 'Start Chat'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-[70vh]">
            <div ref={scrollerRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'inline-block bg-blue-600 text-white px-3 py-2 rounded-lg'
                        : 'inline-block bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-left'
                    }
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
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
              <Button onClick={send} disabled={sending || input.trim().length === 0}>
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
