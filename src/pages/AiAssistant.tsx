/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  ExternalLink,
  HelpCircle,
  Info,
  Lightbulb,
  Send,
  Shield,
  Sparkles,
  User,
  Zap
} from 'lucide-react';
import { NASA_SCIENTIFIC_LIBRARY } from '../data/nasa_references';
import { api } from '../services/api';
import { Astronaut, ChatMessage } from '../types';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

interface AiAssistantProps {
  astronauts: Astronaut[];
  selectedAstroId: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  astronauts,
  selectedAstroId,
}) => {
  const [currentAstroId, setCurrentAstroId] = useState<string>(selectedAstroId);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content: `Greetings Flight Team. I am **ASTRA Intelligence**, the conversational biomedical monitoring assistant for Expedition 74.

I am grounded in real-time habitability telemetry, active crew physiological records, and authentic **NASA Human Research Program (HRP)** evidence literature.

How may I assist with crew biomedical monitoring or anomaly assessment today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [
        {
          title: "NASA Space Flight Human-System Standard: Vol 1, Crew Health",
          docId: "NASA-STD-3001-VOL-1B",
          excerpt: "Physiological reference ranges, environmental monitoring limits, and clinical thresholds for spaceflight missions.",
        }
      ],
      isFallback: false,
    }
  ]);

  const selectedAstronaut = astronauts.find(a => a.id === currentAstroId) || astronauts[0];

  const suggestedQuestions = [
    `What changed in ${selectedAstronaut?.name}'s health indicators over the last 24 hours?`,
    `Why was CDR Elena Rostova's SpO2 anomaly flagged?`,
    `How does microgravity cephalad fluid shift affect arterial blood pressure?`,
    `Which physiological indicators require heightened monitoring this mission sol?`,
    `Summarize NASA-STD-3001 core body temperature and 'space fever' limits.`,
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.sendAssistantMessage(textToSend, currentAstroId);

      const botMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
        relevantVitals: response.relevantVitals,
        isFallback: response.isFallback,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `**Biomedical Query Engine Advisory**: Telemetry pipeline encountered an error: ${err.message || 'Unknown network error'}. Please verify system connectivity.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & NASA Document Grounding Context */}
      <LiquidGlassCard className="p-6" accent="cyan">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase mb-1">
              <Zap className="w-4 h-4" />
              <span>GEMINI AEROSPACE MEDICAL INTELLIGENCE</span>
            </div>
            <h1 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              AI HEALTH ASSISTANT & SCIENTIFIC REFERENCE RETRIEVAL
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Provides conversational clinical insight grounded in active crew telemetry, detected anomaly records, and authentic NASA Human Research Program literature.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 uppercase">FOCUSED CREW:</span>
            <select
              value={currentAstroId}
              onChange={e => setCurrentAstroId(e.target.value)}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {astronauts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NASA Scientific Reference Library Ribbon */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
          <span className="text-slate-500">KNOWLEDGE BASE:</span>
          {NASA_SCIENTIFIC_LIBRARY.map(doc => (
            <span
              key={doc.id}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
              title={doc.title}
            >
              {doc.code}
            </span>
          ))}
        </div>
      </LiquidGlassCard>

      {/* Suggested Quick Questions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>RECOMMENDED AEROSPACE MEDICAL INQUIRIES:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-left px-3 py-1.5 rounded bg-[#0b0f19] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-mono transition-colors disabled:opacity-50"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Viewport */}
      <LiquidGlassCard className="flex flex-col h-[540px] p-0 overflow-hidden" accent="blue">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shrink-0 mt-0.5">
                  Δ
                </div>
              )}

              <div
                className={`max-w-2xl rounded-lg p-4 space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-cyan-950/40 border border-cyan-800/60 text-slate-100'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800/60">
                  <span className="font-semibold text-slate-300">
                    {msg.sender === 'user' ? 'FLIGHT SURGEON / OPERATOR' : 'ASTRA BIOMEDICAL INTELLIGENCE'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <div className="text-xs leading-relaxed space-y-2 whitespace-pre-line font-sans">
                  {msg.content}
                </div>

                {/* Relevant Telemetry Tag */}
                {msg.relevantVitals && (
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] flex items-center justify-between text-slate-400">
                    <span>EVALUATED TELEMETRY:</span>
                    <span className="text-cyan-400 font-semibold">
                      {msg.relevantVitals.astronaut} · {msg.relevantVitals.indicator}: {msg.relevantVitals.value}
                    </span>
                  </div>
                )}

                {/* NASA Research Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="text-cyan-400 flex items-center gap-1.5 font-semibold">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>SCIENTIFIC LITERATURE CITATIONS:</span>
                    </div>
                    {msg.citations.map((cite, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-slate-400">
                        <div className="text-slate-200 font-semibold">{cite.title} ({cite.docId})</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{cite.excerpt}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback Label if applicable */}
                {msg.isFallback && (
                  <div className="text-[10px] font-mono text-amber-400/80 pt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>PROCESSED VIA DETERMINISTIC AEROSPACE MEDICAL ENGINE (OFFLINE MODE)</span>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                Δ
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Evaluating telemetry stream & cross-referencing NASA HRP evidence literature...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Query astronaut health status, ask about an anomaly etiology, or reference NASA standards..."
              className="flex-1 px-4 py-2.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span>Transmit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>ASTRA DECISION SUPPORT — NOT AN AUTOMATED CLINICAL DIAGNOSIS TOOL</span>
            <span>NASA SPACE APPS CHALLENGE 2026</span>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
};
