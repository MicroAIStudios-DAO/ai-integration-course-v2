'use client'
import { useState } from 'react'

export default function ProUpsellBar({ lessonNumber, lessonTitle }: { lessonNumber: number; lessonTitle?: string }) {
  const [dismissed, setDismissed] = useState(false)
  
  if (dismissed) return null
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-white font-semibold">
            Great work on Lesson {lessonNumber}! {lessonTitle ? `: ${lessonTitle}` : ''}
          </p>
          <p className="text-zinc-400 text-sm">
            Pro users get your personal AI tutor that knows this lesson + 50+ more advanced workflows, unlimited queries, and live Q&amp;A.
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/pricing?ref=lesson-' + lessonNumber}
          className="bg-white hover:bg-emerald-100 text-black px-6 py-3 rounded-2xl font-semibold transition whitespace-nowrap"
        >
          Upgrade to Pro — $19.99/mo
        </button>
        <button 
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-zinc-300 text-xl leading-none pt-1"
        >
          ×
        </button>
      </div>
    </div>
  )
}
