import React, { useState } from 'react';
import MarkdownPage from '../components/MarkdownPage';

const PersonalizedRecapPage: React.FC = () => {
  const [text, setText] = useState('');
  const [recap, setRecap] = useState('');

  const getRecap = async () => {
    const res = await fetch('/api/recap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const { recap: returned } = await res.json();
    setRecap(returned);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Personalized Recaps</h1>
      <MarkdownPage src="/md/personalized_recaps_design.md" />
      <textarea
        className="w-full p-2 border rounded"
        rows={4}
        placeholder="Paste your notes or progress here…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        onClick={getRecap}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Generate Recap
      </button>
      {recap && (
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Your Recap:</h2>
          <p>{recap}</p>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecapPage;
