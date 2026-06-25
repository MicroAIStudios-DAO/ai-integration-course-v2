import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownPre } from './CopyableCodeBlock';

interface LazyMarkdownProps {
  children: string;
}

/**
 * Single boundary for the markdown rendering stack (react-markdown + remark-gfm
 * and their micromark/mdast dependency tree). Consumers load this via
 * React.lazy so those libraries are code-split into an async chunk and never
 * ship in the initial bundle for visitors who land on marketing pages.
 */
const LazyMarkdown: React.FC<LazyMarkdownProps> = ({ children }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: MarkdownPre }}>
    {children}
  </ReactMarkdown>
);

export default LazyMarkdown;
