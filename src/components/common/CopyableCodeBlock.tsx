import React, { useEffect, useState } from 'react';

type CopyableCodeBlockProps = {
  code: string;
  containerClassName?: string;
  preClassName?: string;
  codeClassName?: string;
  buttonClassName?: string;
};

const readNodeText = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(readNodeText).join('');
  }

  if (React.isValidElement(node)) {
    return readNodeText((node.props as { children?: React.ReactNode }).children);
  }

  return '';
};

export const copyTextToClipboard = async (value: string): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is not available in this environment.');
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

export const CopyableCodeBlock: React.FC<CopyableCodeBlockProps> = ({
  code,
  containerClassName = '',
  preClassName = '',
  codeClassName = '',
  buttonClassName = '',
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(code);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy code snippet', error);
    }
  };

  return (
    <div className={
      ['relative', containerClassName].filter(Boolean).join(' ')
    }>
      <button
        type="button"
        onClick={handleCopy}
        className={[
          'absolute right-3 top-3 z-10 inline-flex items-center rounded-md border border-white/15 bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-800',
          buttonClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="Copy code snippet"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className={preClassName} style={{ paddingTop: '3.5rem' }}>
        <code className={codeClassName}>{code}</code>
      </pre>
    </div>
  );
};

type MarkdownPreProps = React.HTMLAttributes<HTMLPreElement> & {
  children?: React.ReactNode;
};

export const MarkdownPre: React.FC<MarkdownPreProps> = ({ children, className }) => {
  const firstChild = React.Children.toArray(children)[0];
  let codeClassName = '';
  let code = readNodeText(children).replace(/\n$/, '');

  if (React.isValidElement(firstChild) && firstChild.type === 'code') {
    const codeProps = firstChild.props as { children?: React.ReactNode; className?: string };
    codeClassName = codeProps.className || '';
    code = readNodeText(codeProps.children).replace(/\n$/, '');
  }

  return (
    <CopyableCodeBlock
      code={code}
      preClassName={className || ''}
      codeClassName={codeClassName}
      containerClassName="my-6"
    />
  );
};

export default CopyableCodeBlock;
