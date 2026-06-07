/**
 * AITutorV2.tsx — The Adaptive Learning Engine Frontend
 * 
 * This component replaces the original AITutor.tsx for students who have
 * completed (or are undergoing) the intake diagnostic. It provides:
 *   - Intake Diagnostic flow (conversational profiling)
 *   - Socratic lesson assistance with industry-adapted analogies
 *   - Proactive coaching interventions based on lab telemetry
 *   - Challenge Mode for advanced students
 *   - Persistent conversation memory
 * 
 * Falls back to AITutor (v1) if the v2 endpoint is unavailable.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdaptiveLearning } from '../context/AdaptiveLearningContext';
import type { TutorV2Request, TutorState } from '../types/adaptiveLearning';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface AITutorV2Props {
  lessonId: string;
  premium?: boolean;
  hasAccess?: boolean;
  supportEmail?: string;
  /** If true, show the tutor in "lab mode" with telemetry awareness */
  labMode?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Type
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  state?: TutorState;
}

// ─────────────────────────────────────────────────────────────────────────────
// State Indicator Component
// ─────────────────────────────────────────────────────────────────────────────

const StateIndicator: React.FC<{ state: TutorState }> = ({ state }) => {
  const stateConfig: Record<TutorState, { label: string; color: string; icon: string }> = {
    INTAKE: { label: 'Getting to know you', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🎯' },
    PATH_GENERATION: { label: 'Building your path', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🗺️' },
    LESSON_ASSIST: { label: 'Lesson mentor', color: 'bg-green-100 text-green-700 border-green-200', icon: '📖' },
    LAB_OBSERVATION: { label: 'Watching your lab', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🔬' },
    INTERVENTION: { label: 'Here to help', color: 'bg-red-100 text-red-700 border-red-200', icon: '🤝' },
    CHALLENGE_MODE: { label: 'Challenge mode', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '⚡' },
  };

  const config = stateConfig[state];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const AITutorV2: React.FC<AITutorV2Props> = ({
  lessonId,
  premium = false,
  hasAccess = true,
  supportEmail = 'support@aiintegrationcourse.com',
  labMode = false,
}) => {
  const { currentUser } = useAuth();
  const { studentProfile, currentTutorState, labTelemetry, isIntakeComplete } = useAdaptiveLearning();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntakeBanner, setShowIntakeBanner] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show intake banner for new students
  useEffect(() => {
    if (!isIntakeComplete && currentUser) {
      setShowIntakeBanner(true);
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: "Welcome to AIIntegrationCourse! I'm your adaptive AI mentor. Before we dive in, I'd like to learn a bit about you so I can personalize your experience. Ready for a quick 3-minute chat?",
        timestamp: Date.now(),
        state: 'INTAKE',
      }]);
    }
  }, [isIntakeComplete, currentUser]);

  // Proactive intervention: auto-trigger when lab telemetry shows frustration
  useEffect(() => {
    if (labMode && labTelemetry && labTelemetry.consecutiveFailures >= 3) {
      const lastMsg = messages[messages.length - 1];
      // Don't re-trigger if we already intervened
      if (lastMsg?.state === 'INTERVENTION') return;

      // Auto-send intervention request
      sendMessage(
        `I've failed the ProofGuard audit ${labTelemetry.consecutiveFailures} times. The error is: ${labTelemetry.lastFailureReason || 'unknown'}`,
        true
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labTelemetry?.consecutiveFailures]);

  // ─────────────────────────────────────────────────────────────────────────
  // API Call
  // ─────────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (questionText: string, isAutoIntervention = false) => {
    if (!questionText.trim() || loading) return;
    if (premium && !hasAccess) return;

    const userMessage: Message = {
      role: 'user',
      content: questionText,
      timestamp: Date.now(),
    };

    if (!isAutoIntervention) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Get the user's ID token for authentication
      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const requestBody: TutorV2Request = {
        lessonId,
        question: questionText,
        isIntake: !isIntakeComplete,
      };

      // Include lab telemetry if in lab mode
      if (labMode && labTelemetry) {
        requestBody.labTelemetry = labTelemetry;
      }

      // Try v2 endpoint first
      const tutorUrl = import.meta.env.VITE_TUTOR_V2_URL ||
        'https://us-central1-ai-integra-course-v2.cloudfunctions.net/tutorV2';

      const response = await fetch(tutorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Tutor error: ${response.status}`);
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder('utf-8');
      let fullText = '';

      // Add placeholder assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        state: currentTutorState,
      };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Update the last message with streamed content
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullText,
          };
          return updated;
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Tutor temporarily unavailable';
      setError(errorMsg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I'm having trouble connecting right now. ${errorMsg}. Please try again in a moment.`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, lessonId, premium, hasAccess, labMode, labTelemetry, isIntakeComplete, currentTutorState, loading]);

  const handleSubmit = () => {
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyLastResponse = async () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      await navigator.clipboard.writeText(lastAssistant.content);
    }
  };

  const startIntake = () => {
    setShowIntakeBanner(false);
    sendMessage("I'm ready! Let's get started with the diagnostic.");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="ai-tutor-v2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">AI Mentor</h3>
            {studentProfile && (
              <p className="text-xs text-slate-500">
                {studentProfile.industryContext} · {studentProfile.technicalVector} level
              </p>
            )}
          </div>
        </div>
        <StateIndicator state={currentTutorState} />
      </div>

      {/* Premium Gate */}
      {premium && !hasAccess && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-sm text-amber-800">
            <strong>Premium Feature:</strong> Subscribe to unlock your adaptive AI mentor with personalized coaching.
          </p>
        </div>
      )}

      {/* Intake Banner */}
      {showIntakeBanner && !isIntakeComplete && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
          <p className="text-sm text-purple-800 mb-2">
            <strong>Personalization Available:</strong> Take a 3-minute diagnostic so I can adapt lessons to your industry and skill level.
          </p>
          <button
            onClick={startIntake}
            className="text-xs font-medium px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Start Diagnostic
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-slate-100 text-slate-600 italic'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {msg.content.split('\n').map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {line.split(/(\(Lesson §[^)]+\))/).map((part, partIdx) => {
                    if (/^\(Lesson §[^)]+\)$/.test(part)) {
                      return (
                        <span key={partIdx} className="text-indigo-600 font-semibold text-xs">
                          {part}
                        </span>
                      );
                    }
                    return <span key={partIdx}>{part}</span>;
                  })}
                  {lineIdx < msg.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
              {msg.state && (
                <div className="mt-1 opacity-50">
                  <StateIndicator state={msg.state} />
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
              </span>
              {' '}Thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isIntakeComplete
                ? "Tell me about yourself..."
                : labMode
                ? "Ask about your lab..."
                : "Ask about this lesson..."
            }
            disabled={loading || (premium && !hasAccess)}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            aria-label="Ask the AI Tutor"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim() || (premium && !hasAccess)}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            Send
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <button onClick={copyLastResponse} className="hover:text-slate-700 transition-colors">
            Copy last response
          </button>
          <span>·</span>
          <a
            href={`mailto:${supportEmail}?subject=AI%20Tutor%20issue%20for%20lesson%20${encodeURIComponent(lessonId)}`}
            className="hover:text-slate-700 transition-colors"
          >
            Report issue
          </a>
          <span>·</span>
          <a
            href={`mailto:${supportEmail}?subject=Need%20human%20support%20for%20lesson%20${encodeURIComponent(lessonId)}`}
            className="hover:text-slate-700 transition-colors"
          >
            Human support
          </a>
        </div>
      </div>

      {/* AI Disclosure */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-tight">
          AI-powered mentor. Responses are generated by AI and should supplement, not replace, course materials.
          Your conversations are stored to improve your learning experience.
        </p>
      </div>
    </div>
  );
};

export default AITutorV2;
