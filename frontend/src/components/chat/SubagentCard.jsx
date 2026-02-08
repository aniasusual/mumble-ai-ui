import React from 'react';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';

const SubagentCard = ({ agent, onClick }) => {
  if (!agent) return null;

  const status = agent.status || 'running';
  const title = agent.agent_name || agent.agent_id || 'Subagent';
  const hasContent = !!agent.content;
  const statusLabel = status === 'running' ? 'Running' : 'Complete';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 transition hover:border-white/20"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/90">{title}</div>
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          {status === 'running' && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
          )}
          <span className="rounded-full border border-white/10 px-2 py-0.5 uppercase tracking-[0.2em]">
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs text-white/60 flex items-center gap-2">
        {hasContent ? (
          <MessageSquare className="h-3.5 w-3.5" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        <span>{hasContent ? 'Open conversation' : 'View live stream'}</span>
      </div>
    </button>
  );
};

export default SubagentCard;
