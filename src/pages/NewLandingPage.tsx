import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedAvatar from '../components/layout/AnimatedAvatar';
import FeedbackDrawer from '../components/feedback/FeedbackDrawer';
import LeadMagnetForm from '../components/lead-magnet/LeadMagnetForm';
import ExitIntentLeadMagnet from '../components/lead-magnet/ExitIntentLeadMagnet';
import { topWorkflowsLeadMagnet } from '../content/leadMagnets';
import { trackFreeStarterOptIn } from '../utils/analytics';
import SEO from '../components/SEO';
import { BRAND } from '../config/brand';

const NewLandingPage: React.FC = () => {
  const handleFreeStarterOptIn = () => {
    trackFreeStarterOptIn('edu_landing_explore_courses', '/courses');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      <SEO
        title="Advanced AI Integration & Systems Engineering"
        description="A project-backed academy for developers, operators, and founders — real technical depth with an accessible on-ramp. Master API-first AI systems engineering, bypass brittle prompting, and earn certified credentials."
        url="/"
        keywords={[
          "AI integration academy",
          "AI systems engineering course",
          "professional AI certification",
          "advanced AI workflows",
          "Blaine Casey AI",
        ]}
        author="Blaine Casey"
      />

      {/* Decorative Grid Overlay & Accent Radial Blurs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 left-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Academic Top Bar Notice */}
      <div className="relative z-30 bg-slate-900 border-b border-white/5 py-2 px-4 text-center text-xs tracking-wider uppercase text-amber-400 font-semibold font-headings">
        <span>🎓 {BRAND.academyName} • Summer 2026 Admissions Open</span>
      </div>

      {/* Modern Navigation Header */}
      <header className="relative z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20">
              SΛ
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-none font-headings uppercase">
                {BRAND.courseName}
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-amber-500 block mt-1 font-semibold">
                {BRAND.academyShortName} · {BRAND.ventureName}
              </span>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-semibold tracking-wide text-slate-300">
            <a href="#who-we-are" className="hover:text-amber-400 transition-colors">Faculty & Bio</a>
            <a href="#advantages" className="hover:text-amber-400 transition-colors">Academic Advantages</a>
            <a href="#curriculum" className="hover:text-amber-400 transition-colors">Syllabus Overview</a>
            <a href="#trust" className="hover:text-amber-400 transition-colors">Institutional Trust</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Student Login
            </Link>
            <Link
              to="/start-trial"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Academic Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28 text-center flex flex-col items-center">
        {/* Animated Avatar / Coach Beacon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-2xl scale-125 animate-pulse" />
          <div className="relative border-4 border-amber-500/30 rounded-full p-1 bg-slate-950">
            <AnimatedAvatar size={110} />
          </div>
          <div className="absolute -bottom-2 right-0 bg-emerald-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
            Online
          </div>
        </div>

        {/* Academic Program Label */}
        <p className="mb-4 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          🎓 Advanced Professional Curriculum & Certification
        </p>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 max-w-5xl leading-[1.08] font-headings text-white">
          The Systems Engineering Approach to{" "}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
            Artificial Intelligence Integration
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl lg:text-2xl max-w-3xl text-slate-300 mb-6 leading-relaxed">
          The hands-on curriculum for developers and technical founders who need to ship <span className="text-white font-semibold">reliable, production-grade AI agents</span> — not brittle prompt demos. Master fault-tolerant agent architectures, production environments, and API-first design.
        </p>
        <p className="text-sm md:text-base max-w-2xl text-slate-400 mb-10">
          No CS degree required, and no copy-paste prompt templates either. Start from your level and complete your first deployable automation in under 15 minutes.
        </p>

        {/* Dual Actions with Low-Friction Entry */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full max-w-md">
          <Link
            to="/start-trial"
            className="flex-1 text-center bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-xl text-md font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Start $1 Trial Now
          </Link>
          <Link
            to="/pricing"
            onClick={handleFreeStarterOptIn}
            className="flex-1 text-center border border-white/20 hover:border-white/40 text-white hover:bg-white/5 px-8 py-4 rounded-xl text-md font-bold backdrop-blur-sm transition-all hover:scale-[1.03]"
          >
            Compare Tuition Plans
          </Link>
        </div>

        {/* Premium Academic Campus Visual */}
        <div className="w-full max-w-5xl mb-24 relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-amber-500/20 to-cyan-500/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
            <img
              src="/assets/hero_background_neural_network.png"
              alt={`${BRAND.academyShortName} Tech Campus Environment Blueprint`}
              className="h-[280px] w-full object-cover object-center md:h-[420px] filter saturate-75 brightness-90 group-hover:scale-[1.01] transition-transform duration-700"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-transparent z-10" />
            <div className="absolute inset-0 z-20 flex flex-col justify-end items-start p-6 md:p-10 text-left">
              <span className="inline-block rounded-full bg-amber-500/25 border border-amber-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 mb-3">
                Live Engineering Sandbox Environment
              </span>
              <h2 className="text-2xl font-black text-white md:text-4xl font-headings tracking-tight leading-none uppercase">
                THE FORGE DEVELOPER CONSOLE
              </h2>
              <p className="mt-3 text-sm text-slate-300 md:text-base max-w-xl">
                Gain immediate hands-on credentials. Execute script workflows, deploy live API servers, and monitor vector search recall in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Who We Are (Academic Faculty & Mission) */}
      <section id="who-we-are" className="relative z-10 border-t border-b border-white/5 bg-slate-900/40 py-20 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold font-headings">Your Instructor</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-white font-headings uppercase tracking-tight">
              Taught by a Practicing Systems Engineer
            </h2>
            <div className="h-1 w-16 bg-amber-500 mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-12 gap-10 items-center">
            {/* Instructor Portrait / Card */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative max-w-[280px] w-full group">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 blur-lg opacity-80" />
                <div className="relative rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-2xl">
                  {/* Styled Avatar Placeholder representation */}
                  <div className="w-full aspect-square rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden mb-4 relative">
                    <span className="text-7xl">🧔</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-headings uppercase">Blaine Casey</h3>
                  <p className="text-xs text-amber-500 uppercase tracking-widest font-semibold mt-1">Lead AI Systems Architect</p>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                    Former automation systems lead and full-stack software architect. Shipped 30+ production AI workflows and integrations.
                  </p>
                </div>
              </div>
            </div>

            {/* Credential Biography & Institution Mission */}
            <div className="md:col-span-7 space-y-6">
              <p className="text-lg text-slate-200 font-medium italic leading-relaxed">
                "We reject the prompt engineering gimmick. AI is not a writing exercise. It is a distributed network design challenge. Our goal is to train AI Architects who can build resilient, production-ready, fault-tolerant automations."
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {BRAND.courseName} is the premier, highly specialized training program of {BRAND.academyName} — the Academy established by practical systems engineers under {BRAND.ventureName} to close the gap that standard tutorial platforms leave open: rate-limiting, context window degradation, error fallbacks, and database integration in production.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 font-bold mt-0.5">✓</span>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">Real-World Case Material</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Curriculums are based strictly on deployed production-grade code that has powered real revenue pipelines.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 font-bold mt-0.5">✓</span>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">Academic Rigor & Certifications</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Earn permanent cryptography-backed completion badges upon passing five rigorous module sandbox builds.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Advantages of Signing Up */}
      <section id="advantages" className="relative z-10 py-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold font-headings">Why {BRAND.academyShortName}</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-white font-headings uppercase tracking-tight">
              A Superior Digital Campus Experience
            </h2>
            <p className="mt-4 text-slate-400 text-sm max-w-xl mx-auto">
              We provide the tools, support, and framework required to bridge the gap between amateur prompt-writing and robust software engineering.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Advantage 1 */}
            <div className="relative group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-950 p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400 font-bold mb-6">
                  🤖
                </div>
                <h3 className="text-xl font-bold text-white font-headings uppercase mb-3">Context-Aware AI Tutor</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-grow">
                  Never get stuck. Our specialized academic AI model is fine-tuned on the syllabus code repository. It reviews your workspace, answers queries, and helps you troubleshoot rate limits instantly.
                </p>
              </div>
            </div>

            {/* Advantage 2 */}
            <div className="relative group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-950 p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xl text-cyan-400 font-bold mb-6">
                  🏗️
                </div>
                <h3 className="text-xl font-bold text-white font-headings uppercase mb-3">5 Deployable Blueprints</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-grow">
                  Build complete end-to-end applications. Learn the structural integration patterns for content orchestration pipelines, real-time query decoders, persistent memories, and certified vector engines.
                </p>
              </div>
            </div>

            {/* Advantage 3 */}
            <div className="relative group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/10 to-cyan-500/10 blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-950 p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400 font-bold mb-6">
                  ⚡
                </div>
                <h3 className="text-xl font-bold text-white font-headings uppercase mb-3">Active Workspace Sandboxing</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-grow">
                  Test and execute script structures within our sandboxed environment directly on our serverless compute cluster. No heavy local setup blocks your engineering momentum.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Brittle Prompting vs Systems Engineering */}
      <section className="relative z-10 py-16 bg-slate-900/30 border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-center text-white font-headings uppercase mb-12">
            The Structural Paradigm Shift
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-950 border border-red-500/15 rounded-2xl p-6">
              <p className="text-red-400 text-xs font-bold uppercase tracking-wider font-headings mb-3">
                🗙 Brittle Prompter Track
              </p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  "Chatting" with models manually in separate chat boxes.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  Brittle copy-paste prompts that fail with mild input variance.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  Prone to rate-limiting and connection interruptions.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  Lack of persistent data storage or memory retention.
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-6">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider font-headings mb-3">
                ✓ Systems Architect Track ({BRAND.academyShortName})
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  API-first automation code executing programmatically.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  Fault-tolerant schemas that handle edge-cases gracefully.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  Dynamic error fallbacks, exponential backoffs, and retries.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  Vector databases and memory layers for permanent recall.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Syllabus Overview & Curriculums */}
      <section id="curriculum" className="relative z-10 py-20 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold font-headings">Syllabus Overview</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-white font-headings uppercase tracking-tight">
              Rigorous Curriculum Architecture
            </h2>
            <p className="mt-4 text-slate-400 text-sm max-w-xl mx-auto">
              Our curriculum consists of 5 modular engineering projects, complete with source files, live test environments, and active diagnostics.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                num: "Module 01",
                title: "Foundation & Serverless Environments",
                description: "Establish your high-performance sandbox workspace. Master core API configurations, rate-limit defenses, and execute your first programmatic workflow script.",
                lessons: "4 Lessons • 1 Hands-On Sandbox Build",
                status: "Live"
              },
              {
                num: "Module 02",
                title: "The Informed Architect & Agentic Decoders",
                description: "Integrate live web awareness modules using Serper.dev and search APIs. Ground your agents dynamically to avoid hallucinations and verify factual timelines.",
                lessons: "6 Lessons • 2 Sandbox Builds",
                status: "Live"
              },
              {
                num: "Module 03",
                title: "Persistent Memory Layers (Vector DBs)",
                description: "Connect your AI engines to vector storage layers (Pinecone / Firestore Embeddings). Structure long-term user profile recall and semantic document querying.",
                lessons: "8 Lessons • 1 Advanced System Deploy",
                status: "Beta"
              },
              {
                num: "Module 04",
                title: "Autonomous Workflow Orchestration",
                description: "Design multi-agent orchestrator systems that communicate asynchronously. Build agent fallback schemas, conditional routing, and diagnostic monitoring pipelines.",
                lessons: "5 Lessons • 1 Production Deploy",
                status: "Coming Soon"
              }
            ].map((module) => (
              <div key={module.num} className="border border-white/10 rounded-2xl bg-slate-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500/20 transition-colors">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-headings">{module.num}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span className="text-xs text-slate-400">{module.lessons}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-headings uppercase mt-2">{module.title}</h3>
                  <p className="text-slate-400 text-xs md:text-sm mt-2 leading-relaxed max-w-2xl">{module.description}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border ${
                    module.status === "Live"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : module.status === "Beta"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/5 text-slate-400"
                  }`}>
                    {module.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Institutional Trust Metrics */}
      <section id="trust" className="relative z-10 py-20 bg-slate-900/20 border-t border-b border-white/5 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Institutional Trust Badges & Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-16">
            <div className="p-6 border border-white/5 rounded-2xl bg-slate-950/50">
              <p className="text-4xl md:text-5xl font-extrabold text-amber-500 font-headings">100%</p>
              <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Practical Implementation</p>
            </div>
            <div className="p-6 border border-white/5 rounded-2xl bg-slate-950/50">
              <p className="text-4xl md:text-5xl font-extrabold text-amber-500 font-headings">5</p>
              <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Core Free Modules</p>
            </div>
            <div className="p-6 border border-white/5 rounded-2xl bg-slate-950/50">
              <p className="text-4xl md:text-5xl font-extrabold text-amber-500 font-headings">14 Days</p>
              <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Build Guarantee</p>
            </div>
            <div className="p-6 border border-white/5 rounded-2xl bg-slate-950/50">
              <p className="text-4xl md:text-5xl font-extrabold text-amber-500 font-headings">24/7</p>
              <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Contextual Workspace Help</p>
            </div>
          </div>

          {/* Illustrative outcome — representative of what builders ship in the program (not a specific endorsement) */}
          <div className="bg-slate-950 border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <span className="inline-block rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300 mb-4">
              Illustrative outcome
            </span>
            <div className="absolute top-4 right-6 text-7xl text-white/5 font-serif font-bold">“</div>
            <p className="text-slate-300 text-sm md:text-lg italic leading-relaxed relative z-10 max-w-3xl">
              "The program skips the superficial prompting guides and goes straight to systems. A representative build: a search-grounded content compiler that syncs to a CRM — replacing a recurring manual task that previously took several hours of engineering time each week."
            </p>
            <div className="mt-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold border border-white/10">
                ⚙
              </div>
              <div>
                <span className="block text-sm font-bold text-white uppercase font-headings">Representative Cohort Build</span>
                <span className="block text-[11px] text-amber-500 uppercase tracking-widest font-semibold">Example project · not a specific endorsement</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tuition Plans & Funnel Section */}
      <section className="relative z-10 py-20 px-6 md:px-8 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 font-headings uppercase text-white tracking-tight">
          Admissions Are Now Open
        </h2>
        <p className="text-slate-300 mb-8 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Create a free student profile to immediately begin five baseline automation modules. When you are ready to master advanced multi-agent structures, transition to our premium tuition tiers.
        </p>

        {/* Dynamic Tuition Matric Container card */}
        <div className="border border-amber-500/25 rounded-3xl bg-slate-950 p-8 md:p-10 max-w-2xl mx-auto shadow-2xl relative mb-12">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest">
            Recommended Track
          </div>
          <span className="text-xs text-amber-400 uppercase tracking-widest font-bold">Standard Enrollment</span>
          <h3 className="text-3xl font-extrabold text-white mt-2 font-headings uppercase">PIONEER COHORT</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto">
            Full curriculum unlock, continuous workspace computations, contextual AI tutoring and verified cryptography credentials.
          </p>
          <div className="h-px bg-white/10 my-6" />
          <div className="flex justify-center items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black text-white font-headings">$19.99</span>
            <span className="text-slate-400 text-sm">/ month (Annual)</span>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Standard monthly is available at $29.99/mo. Start with a $1 seven-day trial — backed by our 14-Day Build Guarantee.
          </p>

          <div className="mt-8 flex flex-col gap-3 justify-center">
            <Link
              to="/start-trial"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-xl font-bold uppercase text-sm tracking-wider shadow shadow-amber-500/20 hover:scale-[1.01] transition-transform"
            >
              Start $1 Trial Now
            </Link>
            <Link
              to="/pricing"
              className="text-slate-400 hover:text-white text-xs underline mt-2 font-semibold"
            >
              Or compare all tuition plans
            </Link>
          </div>
        </div>

        {/* Lead Magnet Capture Form */}
        <div className="max-w-md mx-auto bg-slate-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur">
          <h4 className="text-lg font-bold text-white uppercase font-headings mb-1">{topWorkflowsLeadMagnet.title}</h4>
          <p className="text-slate-400 text-xs mb-4">{topWorkflowsLeadMagnet.description}</p>
          <LeadMagnetForm source="edu_landing_inline" theme="dark" />
          <p className="text-[10px] text-slate-500 mt-2">Zero spam guarantee. Securely unsubscribe in one click.</p>
        </div>
      </section>

      {/* Modern Academic Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-12 text-center text-slate-500 text-xs">
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <Link to="/pricing" className="hover:text-slate-300 transition-colors">Pricing & Tuition</Link>
          <Link to="/about" className="hover:text-slate-300 transition-colors">About Faculty</Link>
          <Link to="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Use</Link>
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
        </div>
        <p className="max-w-2xl mx-auto leading-relaxed">
          {BRAND.copyright} {BRAND.courseName} is offered by {BRAND.academyName}, a {BRAND.ventureName} venture.
        </p>
      </footer>

      <FeedbackDrawer />
      <ExitIntentLeadMagnet source="edu_landing_exit_intent" />
    </div>
  );
};

export default NewLandingPage;
