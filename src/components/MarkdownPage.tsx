import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPageProps {
  src: string;  // path relative to public/, e.g. "/md/ai_chat_tutor_design.md"
}

const MarkdownPage: React.FC<MarkdownPageProps> = (props: MarkdownPageProps) => {
  const { src } = props;
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    fetch(src)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.text();
      })
      .then(setContent)
      .catch(console.error);
  }, [src]);

  return (
    <article className="prose mx-auto p-6">
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm as any]}>{content}</ReactMarkdown>
      ) : (
        <p>Loading…</p>
      )}
    </article>
  );
};

export default MarkdownPage;
