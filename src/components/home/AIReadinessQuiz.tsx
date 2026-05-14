import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type Question = {
  id: string;
  prompt: string;
  options: Array<{
    label: string;
    score: number;
  }>;
};

const questions: Question[] = [
  {
    id: 'repetition',
    prompt: 'How much repetitive admin or follow-up work hits your team every week?',
    options: [
      { label: 'A little', score: 0 },
      { label: 'A noticeable amount', score: 1 },
      { label: 'A lot, and it slows us down', score: 2 }
    ]
  },
  {
    id: 'systems',
    prompt: 'How connected are your current tools like inbox, CRM, docs, and spreadsheets?',
    options: [
      { label: 'Mostly disconnected', score: 0 },
      { label: 'Partially connected', score: 1 },
      { label: 'We already have a working stack', score: 2 }
    ]
  },
  {
    id: 'team',
    prompt: 'How comfortable is your team with prompts, APIs, or automation tools?',
    options: [
      { label: 'Very early', score: 0 },
      { label: 'Some experience', score: 1 },
      { label: 'Comfortable shipping workflows', score: 2 }
    ]
  },
  {
    id: 'urgency',
    prompt: 'How quickly do you want an AI workflow in production?',
    options: [
      { label: 'We are still exploring', score: 0 },
      { label: 'This quarter', score: 1 },
      { label: 'Immediately', score: 2 }
    ]
  }
];

const resolveRecommendation = (score: number) => {
  if (score <= 2) {
    return {
      title: 'Foundation Track',
      description:
        'Start with the free curriculum and the glossary pages first. Your biggest win will come from choosing one workflow and understanding the inputs, outputs, and review steps before buying more tools.',
      primaryCta: { label: 'View Curriculum', to: '/courses' },
      secondaryCta: { label: 'Read the Library', to: '/library' }
    };
  }

  if (score <= 5) {
    return {
      title: 'Operator Track',
      description:
        'You are ready for a guided automation sprint. Focus on a single production workflow like inbox triage, support routing, or reporting automation and use the course to define your rollout checklist.',
      primaryCta: { label: 'See Pricing', to: '/pricing' },
      secondaryCta: { label: 'Explore Industry Pages', to: '/solutions' }
    };
  }

    return {
      title: 'Deployment Track',
      description:
        'Your team is close to implementation. Use the course to pressure-test tool calling, retrieval, guardrails, and review rules so the first launch is stable instead of brittle.',
      primaryCta: { label: 'See Pricing', to: '/pricing' },
      secondaryCta: { label: 'Read the Gemini Guide', to: '/library/function-calling-with-gemini-1-5-pro' }
    };
  };

const AIReadinessQuiz: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const answeredCount = Object.keys(answers).length;
  const score = Object.values(answers).reduce((sum, value) => sum + value, 0);
  const recommendation = useMemo(() => {
    if (answeredCount !== questions.length) return null;
    return resolveRecommendation(score);
  }, [answeredCount, score]);

  return (
    <section className="w-full max-w-5xl mt-16 text-left">
      <div className="rounded-3xl border border-white/20 bg-slate-950/50 p-8 shadow-2xl backdrop-blur-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">AI Readiness Quiz</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white">Is your business ready for AI automation?</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Answer four questions and get a recommendation for where to start: free learning, guided implementation, or a direct deployment sprint.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {questions.map((question, questionIndex) => (
            <div key={question.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Question {questionIndex + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{question.prompt}</h3>
              <div className="mt-4 flex flex-col gap-3">
                {question.options.map((option) => {
                  const isActive = answers[question.id] === option.score;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.score }))}
                      className={
                        isActive
                          ? 'rounded-xl border border-cyan-300 bg-cyan-400/10 px-4 py-3 text-left text-white'
                          : 'rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-left text-slate-300 hover:border-white/20 hover:text-white'
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6">
          {recommendation ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Your Result</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{recommendation.title}</h3>
              <p className="mt-3 max-w-3xl text-slate-200 leading-relaxed">{recommendation.description}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={recommendation.primaryCta.to}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  {recommendation.primaryCta.label}
                </Link>
                <Link
                  to={recommendation.secondaryCta.to}
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5"
                >
                  {recommendation.secondaryCta.label}
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-white">Complete the quiz to get your recommendation</h3>
              <p className="mt-2 text-slate-300">
                Progress: {answeredCount}/{questions.length} answered.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIReadinessQuiz;
