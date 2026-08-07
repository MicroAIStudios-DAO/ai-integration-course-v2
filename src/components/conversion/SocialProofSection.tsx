import React from 'react';
import { credentials, proofStats, testimonials } from '../../content/socialProof';

/**
 * Social proof section — renders NOTHING until src/content/socialProof.ts
 * holds real, permissioned data (see the hard rules in that file). Mounted
 * on the pricing page and homepage so proof appears everywhere the moment
 * real quotes/stats are added, with zero further wiring.
 *
 * Deliberately schema-free: no Review or aggregateRating structured data,
 * per the site owner's standing constraint.
 */
const SocialProofSection: React.FC<{ theme?: 'dark' | 'light' }> = ({ theme = 'dark' }) => {
  const hasContent =
    testimonials.length > 0 || proofStats.length > 0 || credentials.length > 0;
  if (!hasContent) return null;

  const text = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const heading = theme === 'dark' ? 'text-white' : 'text-slate-950';
  const card =
    theme === 'dark'
      ? 'bg-slate-800/50 border border-slate-700/50'
      : 'bg-white border border-slate-200';

  return (
    <section className="mt-20 max-w-4xl mx-auto" aria-label="Student results and credentials">
      {proofStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {proofStats.map((stat) => (
            <div key={stat.label} className={`rounded-xl p-4 text-center ${card}`}>
              <p className={`text-2xl font-bold ${heading}`}>{stat.value}</p>
              <p className={`text-xs mt-1 ${text}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {testimonials.length > 0 && (
        <div className="space-y-6">
          <h2 className={`text-3xl font-bold text-center mb-8 ${heading}`}>
            What students say
          </h2>
          {testimonials.map((t) => (
            <figure key={t.name + t.quote.slice(0, 24)} className={`rounded-xl p-6 ${card}`}>
              <blockquote className={`leading-relaxed ${text}`}>“{t.quote}”</blockquote>
              <figcaption className={`mt-3 text-sm font-semibold ${heading}`}>
                {t.name} <span className={`font-normal ${text}`}>— {t.attribution}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {credentials.length > 0 && (
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {credentials.map((c) => (
            <span key={c.name} className={`rounded-full px-4 py-1.5 text-xs ${card} ${text}`}>
              {c.name} · {c.issuer}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export default SocialProofSection;
