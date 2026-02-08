import React from 'react';
import { Mic, Activity } from 'lucide-react';

const ConversationAgentRenderer = ({ message }) => {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/50">
        <Activity className="h-3.5 w-3.5" />
        Voice Session
      </div>
      <div className="mt-3 text-sm text-white/80">{message.content}</div>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-white/60 hover:text-white"
        >
          <Mic className="h-3 w-3" />
          Start Voice Reply
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-white/60 hover:text-white"
        >
          Show Prompts
        </button>
      </div>
    </div>
  );
};

export default ConversationAgentRenderer;
