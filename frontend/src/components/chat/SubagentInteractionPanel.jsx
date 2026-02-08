import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

const SubagentInteractionPanel = ({
  isOpen,
  agent,
  messages,
  onClose,
  onSend,
  isSending,
}) => {
  const [input, setInput] = useState('');

  const title = useMemo(() => {
    if (!agent) return '';
    return agent.agent_name || agent.agent_id || 'Subagent';
  }, [agent]);

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0d10] p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80">{title}</div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white/70">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 max-h-[50vh] overflow-y-auto space-y-3">
          {(messages || []).map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`text-sm ${
                message.role === 'user' ? 'text-white/90' : 'text-white/70'
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() || isSending) return;
            onSend(input.trim());
            setInput('');
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a follow-up…"
            className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white/80 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 hover:text-white disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubagentInteractionPanel;
