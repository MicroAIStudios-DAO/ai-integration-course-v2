import React from 'react';
import AnimatedAvatar from './AnimatedAvatar';

const HeroCTA: React.FC = () => {
  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center text-center px-6">
      {/* Animated Avatar (formerly AnimatedLogo) */}
      <AnimatedAvatar />

      {/* Headline */}
      <h1 className="text-4xl md:text-5xl font-extrabold mt-8 leading-tight max-w-3xl">
        Build your first working AI Agent in 14 days.
      </h1>

      {/* Subheadline */}
      <p className="text-lg md:text-xl mt-6 max-w-2xl text-gray-300">
        Learn practical AI automation with implementation-first lessons, guided projects, and a build path designed for business owners and developers.
        Start with the curriculum and move toward a real deployed workflow.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-col md:flex-row gap-4">
        <a
          href="/signup"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg transition"
        >
          Start Building Now
        </a>
        <a
          href="#free-lesson"
          className="text-blue-400 hover:text-blue-500 underline text-lg mt-2 md:mt-0"
        >
          Explore Free Lesson
        </a>
      </div>
    </section>
  );
};

export default HeroCTA;
