import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedAvatar from '../components/layout/AnimatedAvatar';

const NewLandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);
    // Placeholder for email submission logic
    setTimeout(() => {
      alert("Thank you for subscribing! Check your email for your free AI strategy guide.");
      setEmail('');
      setIsSubmitted(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent)]"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-pink-400/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center p-6 md:p-8">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          AI Integration Course
        </div>
        <div className="hidden md:flex space-x-6">
          <Link to="/courses" className="hover:text-cyan-400 transition-colors">Courses</Link>
          <Link to="/login" className="hover:text-cyan-400 transition-colors">Login</Link>
          <Link to="/signup" className="bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 md:py-20">
        {/* Animated Avatar */}
        <div className="mb-8">
          <AnimatedAvatar size={120} />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Accelerate Your Future Skills Now
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl lg:text-2xl max-w-3xl text-slate-300 mb-4 leading-relaxed">
          AI built, AI powered. From overwhelm to action, we cut the noise.
        </p>
        <p className="text-md md:text-lg max-w-2xl text-slate-400 mb-8">
          Your roadmap, your outcomes, no BS — everything's guided, simplified, and built to execute.
        </p>

        {/* Key Value Props */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold mb-2">AI-Enhanced Learning</h3>
            <p className="text-sm text-slate-400">Experience AI as your coach, not just a tool. Interactive lessons that think with you.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Immediate Value</h3>
            <p className="text-sm text-slate-400">Skip the overwhelm. Get skills, strategies, and mindsets that create results today.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Built for Action</h3>
            <p className="text-sm text-slate-400">Guided by humans, built 100% by AI for AI era learners. Every lesson pushes you toward mastery.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            to="/signup"
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            Start 7-Day Free Trial
          </Link>
          <Link
            to="/courses"
            className="border-2 border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl text-lg font-semibold backdrop-blur-sm transition-all hover:bg-white/5"
          >
            Explore Courses
          </Link>
        </div>

        {/* Email Capture */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-3 text-center">Get Your Free AI Strategy Guide</h3>
          <p className="text-sm text-slate-300 mb-4 text-center">
            Join thousands shaping the future of AI. Get instant access to our exclusive guide.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-slate-400 backdrop-blur-sm"
              required
              disabled={isSubmitted}
            />
            <button
              type="submit"
              disabled={isSubmitted}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitted ? 'Sending...' : 'Get Free Guide'}
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-3 text-center">
            No spam. Unsubscribe anytime. Your data is secure.
          </p>
        </div>
      </div>

      {/* Floating AI Element */}
      <div className="absolute bottom-10 right-10 w-24 h-24 md:w-32 md:h-32 animate-bounce">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 opacity-80 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-2xl">
          AI
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} AI Integration Course. Guided by humans, built by AI.</p>
      </div>
    </div>
  );
};

export default NewLandingPage;

