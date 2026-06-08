/**
 * AITutorChat.tsx — Lab-embedded AI Tutor Chat interface
 * 
 * This is the proactive coaching interface that runs inside the GovernanceLab.
 * It receives the student's profile, current lab state, and audit feedback
 * to provide contextual, Socratic guidance.
 * 
 * Communicates with the tutorV2 backend at /api/tutor-v2 with labTelemetry context.
 */

import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile } from '../../types/adaptiveLearning';

interface AITutorChatProps {
  studentProfile: StudentProfile | null;
  currentLabState: 'building' | 'auditing' | 'passed' | 'failed';
  auditFeedback: any;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export function AITutorChat({ studentProfile, currentLabState, auditFeedback }: AITutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Proactive intervention when lab state changes
  useEffect(() => {
    if (currentLabState === 'failed' && auditFeedback) {
      const intervention: ChatMessage = {
        role: 'assistant',
        content: `I noticed your agent didn't pass the compliance check. The main issue: **${auditFeedback?.vulnerabilities?.[0]?.description || 'a configuration gap'}**. Let me help you fix this — what part of your Flowise flow handles the input parsing?`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, intervention]);
    } else if (currentLabState === 'passed') {
      const praise: ChatMessage = {
        role: 'assistant',
        content: `Excellent work! Your agent passed with a CQS score of **${auditFeedback?.cqsScore || '90+'}**. You've demonstrated mastery of this governance pattern. Ready for the next challenge?`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, praise]);
    }
  }, [currentLabState, auditFeedback]);

  // Initial greeting
  useEffect(() => {
    const greeting: ChatMessage = {
      role: 'assistant',
      content: `Welcome to the Governance Lab! I'm your AI Mentor, and I'll be watching your progress as you build. ${studentProfile?.industryContext ? `Since you're focused on **${studentProfile.industryContext}**, I'll tailor my guidance to your domain.` : ''} Start building your agent in the Flowise workspace, and run the ProofGuard audit when you're ready.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([greeting]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/tutor-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          labTelemetry: {
            currentLabState,
            auditFeedback,
          },
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...assistantMessage, content: assistantContent };
          return updated;
        });
      }
    } catch (error) {
      console.error('Tutor chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an issue connecting. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600/20 border border-indigo-500/30 ml-4'
                : 'bg-slate-800 border border-slate-700 mr-4'
            }`}
          >
            <p className="text-xs font-medium text-slate-400 mb-1">
              {msg.role === 'user' ? 'You' : 'AI Mentor'}
            </p>
            <p className="text-slate-200 whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs ml-2">
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 pt-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your agent architecture..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
