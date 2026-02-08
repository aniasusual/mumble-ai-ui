import React from 'react';
import { Loader2, MessageSquare } from 'lucide-react';

const SubagentCard = ({ agent, onClick }) => {
  if (!agent) return null;

  const status = agent.status || 'running';
  const title = agent.agent_name || agent.agent_id || 'Subagent';
  const hasContent = !!agent.content;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasContent}
      className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 transition hover:border-white/20 disabled:opacity-60"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/80">{title}</div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          {status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />}
          <span>{status}</span>
        </div>
      </div>
      {hasContent && (
        <div className="mt-2 text-xs text-white/60 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Open conversation</span>
        </div>
      )}
    </button>
  );
};

export default SubagentCard;
