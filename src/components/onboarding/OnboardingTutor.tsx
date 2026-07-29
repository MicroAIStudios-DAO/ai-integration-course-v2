/**
 * OnboardingTutor.tsx
 * 
 * A scripted AI Tutor-style onboarding guide that appears on the dashboard
 * for new users. Provides friendly, conversational guidance about how the
 * platform works — without requiring the full AI Tutor backend.
 * 
 * This is a static/scripted component (no API calls) that mimics the
 * conversational style of the AI Tutor to create continuity.
 */

import React, { useState } from 'react';

interface OnboardingTutorProps {
  isNewUser: boolean;
}

interface TutorMessage {
  id: string;
  text: string;
  /** Options the user can click to advance the conversation */
  options?: { label: string; nextId: string }[];
}

const TUTOR_MESSAGES: Record<string, TutorMessage> = {
  start: {
    id: 'start',
    text: "Hey! I'm your AI Tutor. I'll be with you throughout every lesson — you can ask me anything about the material. But first, want a quick overview of how this course works?",
    options: [
      { label: "Yes, give me the overview", nextId: 'overview' },
      { label: "No thanks, I'll just start the lesson", nextId: 'skip' },
    ],
  },
  overview: {
    id: 'overview',
    text: "Here's how it works: You go through lessons in order. Each lesson has reading material (and sometimes video). At the bottom, you'll click 'Mark as Complete' when you're done. I'm always in the sidebar if you need help understanding something. Your progress saves automatically — next time you log in, you'll pick up right where you left off.",
    options: [
      { label: "What if I get stuck on something?", nextId: 'stuck' },
      { label: "How long does the course take?", nextId: 'duration' },
      { label: "Got it — I'm ready to start!", nextId: 'ready' },
    ],
  },
  stuck: {
    id: 'stuck',
    text: "That's what I'm here for! In every lesson, you'll see me in the right sidebar. Just type your question and I'll explain it in a way that makes sense for your level. I can give examples, analogies, code walkthroughs — whatever helps. No question is too basic.",
    options: [
      { label: "How long does the course take?", nextId: 'duration' },
      { label: "I'm ready to start!", nextId: 'ready' },
    ],
  },
  duration: {
    id: 'duration',
    text: "The course is self-paced — there's no deadline. Most students spend 15–30 minutes per lesson. Some lessons are shorter (concepts), some are longer (hands-on labs). You can do one lesson a day or binge the whole thing in a weekend. Your call.",
    options: [
      { label: "What if I get stuck on something?", nextId: 'stuck' },
      { label: "I'm ready to start!", nextId: 'ready' },
    ],
  },
  ready: {
    id: 'ready',
    text: "Let's go! Click the 'Start Lesson 1' button above to begin. I'll be waiting for you in the lesson sidebar. Good luck — you're going to build some incredible things.",
    options: [],
  },
  skip: {
    id: 'skip',
    text: "No problem! Just click 'Start Lesson 1' above. I'll be in the sidebar if you need me. Have fun!",
    options: [],
  },
};

const OnboardingTutor: React.FC<OnboardingTutorProps> = ({ isNewUser }) => {
  const [conversationHistory, setConversationHistory] = useState<string[]>(['start']);
  const [dismissed, setDismissed] = useState(false);

  if (!isNewUser || dismissed) return null;

  const currentMessageId = conversationHistory[conversationHistory.length - 1];
  const currentMessage = TUTOR_MESSAGES[currentMessageId];

  if (!currentMessage) return null;

  const handleOption = (nextId: string) => {
    setConversationHistory(prev => [...prev, nextId]);
  };

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-900/20 via-slate-900/40 to-indigo-900/10 p-5 relative">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Dismiss tutor"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Tutor avatar + label */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <span className="text-lg">🧠</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">AI Tutor</p>
          <p className="text-xs text-slate-500">Your personal guide</p>
        </div>
      </div>

      {/* Conversation history */}
      <div className="space-y-3 mb-4">
        {conversationHistory.map((msgId, i) => {
          const msg = TUTOR_MESSAGES[msgId];
          if (!msg) return null;
          const isLatest = i === conversationHistory.length - 1;
          return (
            <div
              key={`${msgId}-${i}`}
              className={`text-sm leading-relaxed transition-opacity ${
                isLatest ? 'text-slate-200' : 'text-slate-400/70'
              }`}
            >
              {msg.text}
            </div>
          );
        })}
      </div>

      {/* Options for current message */}
      {currentMessage.options && currentMessage.options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentMessage.options.map((opt) => (
            <button
              key={opt.nextId}
              onClick={() => handleOption(opt.nextId)}
              className="px-3 py-1.5 text-xs font-medium text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingTutor;
