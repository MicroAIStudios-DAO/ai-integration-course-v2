import React, { Suspense, lazy, useEffect, useState } from 'react';

// Code-split the markdown rendering stack so react-markdown/remark-gfm only
// download when a markdown-backed page actually renders.
const LazyMarkdown = lazy(() => import('./common/LazyMarkdown'));

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
        <Suspense fallback={<p>Loading…</p>}>
          <LazyMarkdown>{content}</LazyMarkdown>
        </Suspense>
      ) : (
        <p>Loading…</p>
      )}
    </article>
  );
};

export default MarkdownPage;
