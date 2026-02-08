import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PlanningAgentRenderer = ({ message }) => {
  if (!message) return null;

  return (
    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
    </div>
  );
};

export default PlanningAgentRenderer;
