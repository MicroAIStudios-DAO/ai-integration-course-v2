import React, { useState } from 'react';
import MarkdownPage from '../components/MarkdownPage';

const AIChatTutorPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');

  const askTutor = async () => {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const { response } = await res.json();
    setReply(response);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Chat Tutor</h1>
      <MarkdownPage src="/md/ai_chat_tutor_design.md" />
      <textarea
        className="w-full p-2 border rounded"
        rows={4}
        placeholder="Ask your tutor…"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />
      <button
        onClick={askTutor}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Ask Tutor
      </button>
      {reply && (
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Tutor says:</h2>
          <p>{reply}</p>
        </div>
      )}
    </div>
  );
};

export default AIChatTutorPage;
