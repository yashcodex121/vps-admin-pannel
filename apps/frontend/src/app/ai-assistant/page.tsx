'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';
import { IAiMessage, IAiActionRequest } from '@nexus/types';

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<IAiMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `👋 **Welcome to NEXUS AI Co-pilot!**\n\nI am connected to your Ubuntu VPS servers and cloud providers. You can ask me commands in **English or Hinglish**:\n\n- *"Mera Quiz Bot restart karo"*\n- *"Show CPU and RAM usage"*\n- *"Check all running Telegram bots"*\n- *"Show why my API crashed"*\n- *"Analyze today's server logs"*\n\nHow can I assist your infrastructure today?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'groq' | 'gemini' | 'openai'>('groq');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: IAiMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    const res = await api.post('/ai/chat', {
      message: textToSend,
      provider,
    });

    if (res.success && res.data) {
      const assistantMsg: IAiMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date().toISOString(),
        actionConfirmationRequired: res.data.actionConfirmation,
        actionResult: res.data.actionResult,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error processing AI request: ${res.error || 'Server error'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
  };

  const handleConfirmAction = async (actionId: string, confirmed: boolean) => {
    setActionLoading(actionId);
    const res = await api.post('/ai/confirm', { actionId, confirmed });
    if (res.success && res.data) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_res_${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
          timestamp: new Date().toISOString(),
          actionResult: res.data.actionResult,
        },
      ]);
    }
    setActionLoading(null);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4">
      {/* Header Bar & AI Provider Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827]/80 p-3 rounded-xl border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              NEXUS Natural Language Co-pilot
              <Badge variant="purple">Multi-Model</Badge>
            </h2>
            <p className="text-[10px] text-gray-400">Strict sandboxed action confirmation protocol enabled</p>
          </div>
        </div>

        {/* Provider Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 text-[11px]">Provider:</span>
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setProvider('groq')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                provider === 'groq' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              Groq (Llama 3.1)
            </button>
            <button
              onClick={() => setProvider('gemini')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                provider === 'gemini' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              Google Gemini
            </button>
            <button
              onClick={() => setProvider('openai')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                provider === 'openai' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              OpenAI
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <GlassCard className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                  isUser ? 'bg-gradient-to-tr from-blue-600 to-indigo-600' : 'bg-gradient-to-tr from-cyan-500 to-purple-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10'
                      : 'bg-[#1a2234] border border-white/10 text-gray-200 rounded-tl-none shadow-glass'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Sensitive Action Confirmation Card */}
                {msg.actionConfirmationRequired && (
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 backdrop-blur-md space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-purple-300 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-purple-400" />
                      <span>Approval Required for Execution</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 font-mono text-[11px] space-y-1 text-gray-300">
                      <p>• Action: <span className="text-cyan-400 uppercase font-semibold">{msg.actionConfirmationRequired.actionType.replace('_', ' ')}</span></p>
                      <p>• Target Server: <span className="text-gray-100">{msg.actionConfirmationRequired.targetServerName}</span></p>
                      <p>• Target Service: <span className="text-purple-300">{msg.actionConfirmationRequired.targetServiceName}</span></p>
                      <p>• Reason: {msg.actionConfirmationRequired.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="gradient"
                        size="sm"
                        icon={CheckCircle2}
                        loading={actionLoading === msg.actionConfirmationRequired.id}
                        onClick={() => handleConfirmAction(msg.actionConfirmationRequired!.id, true)}
                      >
                        Confirm & Execute
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfirmAction(msg.actionConfirmationRequired!.id, false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-gray-400 text-xs italic">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-spin">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
            <span>NEXUS AI is analyzing infrastructure state and intent...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </GlassCard>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-gray-500 text-[11px] whitespace-nowrap">Suggested:</span>
        <button
          onClick={() => sendMessage('Mera Quiz Bot restart karo')}
          className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 text-[11px] whitespace-nowrap transition-colors"
        >
          &quot;Mera Quiz Bot restart karo&quot;
        </button>
        <button
          onClick={() => sendMessage('Show CPU and RAM usage')}
          className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 text-[11px] whitespace-nowrap transition-colors"
        >
          &quot;Show CPU and RAM usage&quot;
        </button>
        <button
          onClick={() => sendMessage('Check all running Telegram bots')}
          className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 text-[11px] whitespace-nowrap transition-colors"
        >
          &quot;Check all running Telegram bots&quot;
        </button>
        <button
          onClick={() => sendMessage('Show why my API crashed')}
          className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 text-[11px] whitespace-nowrap transition-colors"
        >
          &quot;Show why my API crashed&quot;
        </button>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2 bg-[#111827] p-2 rounded-xl border border-white/10 shadow-glass focus-within:border-cyan-500/50 transition-all"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in English or Hinglish: e.g. 'Mera Quiz Bot restart karo' or 'Show server logs'..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
        />
        <Button
          type="submit"
          variant="gradient"
          size="sm"
          icon={Send}
          disabled={!input.trim() || loading}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
