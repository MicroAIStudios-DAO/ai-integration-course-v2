import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, userHasPaidAccess } from "../firebaseService";
import { UserProfile } from "../types/course";
import { openBetaFeedback } from "../components/UserJotWidget";

const DISCORD_URL = process.env.REACT_APP_FOUNDING_DISCORD_URL || "";

const activeScripts = [
  {
    title: "Content Architect v1.1",
    description:
      "Turn raw transcripts into a 30-day distribution engine. Optimized for Gemini 1.5 Pro.",
    cta: "Launch Script Environment",
    href: "/courses/course_01_id/modules/module_01_id/lessons/lesson_founders_01_content_architect",
    accent: "cyan",
  },
  {
    title: "The Informed Architect",
    description:
      "Real-time 2026 web-access module. Ground your AI in today’s facts.",
    cta: "Access Module 2 Build",
    href: "/courses/course_01_id/modules/module_02_id/lessons/lesson_founders_02_informed_architect",
    accent: "emerald",
  },
];

const intelPipeline = [
  {
    title: "01 | Foundation & Environment",
    copy: "Setting up your high-performance environment on Windows and Mac.",
    status: "Live",
  },
  {
    title: "02 | The Informed Architect",
    copy: "Integrating Serper.dev for real-time web awareness.",
    status: "Beta",
  },
  {
    title: "03 | Persistent Memory",
    copy: "Connecting your agents to vector databases for long-term recall.",
    status: "Coming Soon",
  },
];

const systemPulse = [
  { label: "API Health", value: "Optimal", state: "online" },
  { label: "Next Live Build Log", value: "Thursday, 10:00 AM PST", state: "neutral" },
  { label: "Member Count", value: "20/20 Cohort Full", state: "accent" },
];

const accentClassMap: Record<string, string> = {
  cyan: "from-cyan-500/20 via-cyan-400/10 to-transparent border-cyan-400/25 shadow-cyan-500/10",
  emerald: "from-emerald-500/20 via-emerald-400/10 to-transparent border-emerald-400/25 shadow-emerald-500/10",
};

const statusClassMap: Record<string, string> = {
  Live: "bg-cyan-400/15 text-cyan-200 border-cyan-400/30",
  Beta: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
  "Coming Soon": "bg-white/10 text-slate-300 border-white/15",
};

const resolveMemberName = (profile: UserProfile | null, email: string | null | undefined) => {
  const explicit =
    profile?.displayName?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Architect";

  return explicit
    .split(/[.\-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const WelcomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!currentUser) {
        setProfile(null);
        return;
      }

      try {
        const nextProfile = await getUserProfile(currentUser.uid);
        if (active) {
          setProfile(nextProfile);
        }
      } catch (error) {
        console.error("Failed to load welcome profile:", error);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const memberName = useMemo(
    () => resolveMemberName(profile, currentUser?.email),
    [profile, currentUser?.email]
  );
  const isPioneerTagged = profile?.isBetaTester === true || profile?.foundingMember === true;
  const isFoundingAccess = profile?.foundingMember === true;
  const hasPaidCohortAccess = useMemo(() => {
    if (!profile) return false;
    if (profile.foundingMember === true) return true;
    return profile.isBetaTester === true && userHasPaidAccess(profile);
  }, [profile]);
  const canUseDirectLine = hasPaidCohortAccess;
  const cohortRateLabel = isFoundingAccess ? 'Founding Access' : '$19.99/mo';

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] text-slate-100">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.08),transparent)] blur-3xl" />

        {isPioneerTagged && !hasPaidCohortAccess && (
          <div className="mb-8 rounded-[1.75rem] border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
            <p className="text-xs font-headings font-semibold uppercase tracking-[0.22em] text-amber-200">
              Cohort Tag Saved
            </p>
            <h2 className="mt-3 text-2xl font-headings font-bold text-white">
              Complete checkout to activate paid beta access.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-amber-50/90">
              Your <code>PIONEER</code> tag is attached to this account, but the paid beta membership is not active yet. Finish the {cohortRateLabel} checkout to unlock the dashboard, direct feedback lane, and launch-week onboarding.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition-colors hover:bg-amber-200"
              >
                Activate Founding Rate
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
              >
                Preview Curriculum
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-8">
            <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-8 shadow-[0_30px_80px_rgba(2,8,23,0.55)] backdrop-blur-xl md:p-10">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.12),transparent_38%,rgba(16,185,129,0.08))]" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-headings font-semibold uppercase tracking-[0.28em] text-cyan-200">
                    Pioneer Cohort Access
                  </span>
                  <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-1 text-xs font-headings font-semibold uppercase tracking-[0.2em] text-amber-200">
                    {isFoundingAccess ? 'Founding Benefits Active' : 'Launch Week | Paid Beta Live'}
                  </span>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
                      Identity Layer
                    </p>
                    <h1 className="mt-4 max-w-4xl text-4xl font-headings font-black uppercase tracking-[0.04em] text-white md:text-6xl">
                      Welcome, {memberName}.
                    </h1>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                      You are inside the builder environment. The free lessons stay open, the first two founder builds are public, and the deeper premium system unlocks when you subscribe.
                      {" "}
                      <span className="text-cyan-200">aiintegrationcourse.com</span>.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Link
                        to="/courses/course_01_id/modules/module_01_id/lessons/lesson_founders_01_content_architect"
                        className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition-colors hover:bg-cyan-400"
                      >
                        {hasPaidCohortAccess ? "Enter The Forge" : "Start Free Founder Build"}
                      </Link>
                      {canUseDirectLine ? (
                        <button
                          type="button"
                          onClick={openBetaFeedback}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100 transition-colors hover:border-cyan-300/35 hover:bg-cyan-400/10"
                        >
                          Open Architect&apos;s Direct Line
                        </button>
                      ) : (
                        <Link
                          to="/pricing"
                          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100 transition-colors hover:border-cyan-300/35 hover:bg-cyan-400/10"
                        >
                          Finish Paid Onboarding
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-headings font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Cohort Access
                    </p>
                    <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                          Pioneer Cohort
                        </p>
                        <p className="mt-2 text-2xl font-headings font-bold text-white">
                          {hasPaidCohortAccess
                            ? `${cohortRateLabel} Active`
                            : `${cohortRateLabel} Reserved`}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Beta Build Credits
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Builder credits reduce the cost of experimentation. The beta itself stays paid so tester behavior mirrors launch users.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Month 2 Credit
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Complete the first 4 modules and a 15-minute feedback call to earn your second month back as a credit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/65 p-8 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-headings font-semibold uppercase tracking-[0.24em] text-cyan-300">
                    The Implementation Lab
                  </p>
                  <h2 className="mt-3 text-3xl font-headings font-black uppercase tracking-[0.06em] text-white">
                    The Forge: Active Scripts
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-400">
                  This is the do zone. Every build here should push a real system, not just theory.
                </p>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {activeScripts.map((card) => (
                  <article
                    key={card.title}
                    className={`rounded-[1.75rem] border bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%)] p-6 shadow-2xl ${accentClassMap[card.accent]}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-headings font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Active Asset
                        </p>
                        <h3 className="mt-3 text-2xl font-headings font-bold text-white">
                          {card.title}
                        </h3>
                      </div>
                      <div className="h-11 w-11 rounded-2xl border border-white/10 bg-slate-950/80" />
                    </div>
                    <p className="mt-5 text-sm leading-7 text-slate-300">
                      {card.description}
                    </p>
                    <Link
                      to={card.href}
                      className="mt-8 inline-flex items-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-white/25 hover:bg-white/10"
                    >
                      {card.cta}
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/65 p-8 backdrop-blur-xl">
              <p className="text-xs font-headings font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Strategic Intel
              </p>
              <h2 className="mt-3 text-3xl font-headings font-black uppercase tracking-[0.06em] text-white">
                Curriculum Pipeline
              </h2>
              <div className="mt-8 grid gap-4">
                {intelPipeline.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 md:flex md:items-center md:justify-between md:gap-8"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-headings font-bold uppercase tracking-[0.04em] text-white">
                          {item.title}
                        </h3>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClassMap[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-400/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(15,23,42,0.72))] p-8 backdrop-blur-xl">
              <p className="text-xs font-headings font-semibold uppercase tracking-[0.24em] text-emerald-300">
                The Pioneer Feedback Loop
              </p>
              <h2 className="mt-3 text-3xl font-headings font-black uppercase tracking-[0.06em] text-white">
                The Architect&apos;s Direct Line
              </h2>

              <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 p-6">
                  <p className="text-xs font-headings font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Co-Build This Course
                  </p>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                    Is there a specific integration you need for your business? A bug in the script? A feature you want to see? Your feedback dictates the Module 4 roadmap.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    {canUseDirectLine ? (
                      <button
                        type="button"
                        onClick={openBetaFeedback}
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition-colors hover:bg-emerald-300"
                      >
                        Submit Feature Request / Bug Report
                      </button>
                    ) : (
                      <Link
                        to="/pricing"
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition-colors hover:bg-emerald-300"
                      >
                        Activate Direct Line
                      </Link>
                    )}
                    {DISCORD_URL ? (
                      <a
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100 transition-colors hover:border-white/25 hover:bg-white/10"
                      >
                        Join #Founding-Cohort on Discord
                      </a>
                    ) : (
                      <div className="inline-flex items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Discord Link Posting Soon
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs font-headings font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Influence Window
                  </p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    PIONEER tags the cohort. Paid beta unlocks the direct feedback lane. Founding code redemption remains separate and is only for access activation.
                  </p>
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="sticky top-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl">
              <p className="text-xs font-headings font-semibold uppercase tracking-[0.24em] text-cyan-300">
                System Pulse
              </p>
              <div className="mt-6 space-y-4">
                {systemPulse.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      {item.state === "online" && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.8)]" />}
                      <p className="text-sm font-medium text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-cyan-400/15 bg-cyan-400/10 p-4">
                <p className="text-xs font-headings font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Status Channel
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {hasPaidCohortAccess
                    ? "Paid access is active on this account. The cohort dashboard and feedback lane are live."
                    : "Free lessons and the first two founder builds are open. Paid checkout activates the full premium curriculum and direct feedback lane."}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
