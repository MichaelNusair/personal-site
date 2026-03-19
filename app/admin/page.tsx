'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const API_BASE = 'https://chatapi.michaelnusair.tech/';

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [conversation, setConversation] = useState<any | null>(null);
  const [correction, setCorrection] = useState('');
  const [status, setStatus] = useState<string>('');

  async function fetchConversation() {
    if (!API_BASE || !conversationId) return;
    setStatus('Loading...');
    try {
      const res = await fetch(`${API_BASE}chat/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConversation(data.conversation);
        setStatus('Loaded');
      } else {
        setConversation(null);
        setStatus(data?.error || 'Error');
      }
    } catch (e) {
      setStatus('Network error');
    }
  }

  async function sendCorrection() {
    if (!API_BASE || !conversationId || !correction) return;
    setStatus('Sending...');
    try {
      const res = await fetch(`${API_BASE}chat/correction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ conversationId, correction, notifyUser: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Sent');
        setCorrection('');
      } else {
        setStatus(data?.error || 'Error');
      }
    } catch (e) {
      setStatus('Network error');
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Chat Admin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <label className="text-sm text-gray-600">Admin token</label>
        <Input className="sm:col-span-2" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} />
        <label className="text-sm text-gray-600">Conversation ID</label>
        <div className="sm:col-span-2 flex gap-2">
          <Input
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            placeholder="enter conversation id"
          />
          <Button onClick={fetchConversation}>Fetch</Button>
        </div>
      </div>

      {conversation && (
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Messages:</div>
          <div className="border rounded p-3 max-h-80 overflow-y-auto text-sm space-y-2">
            {conversation.messages?.map((m: any, i: number) => (
              <div key={i}>
                <span className="font-semibold">{m.role}:</span> {m.content}
                <span className="text-gray-400 ml-2">{m.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          value={correction}
          placeholder="Correction to send to the user"
          onChange={(e) => setCorrection(e.target.value)}
        />
        <Button onClick={sendCorrection}>Send Correction</Button>
      </div>

      <div className="text-sm text-gray-500">{status}</div>
    </div>
  );
}
