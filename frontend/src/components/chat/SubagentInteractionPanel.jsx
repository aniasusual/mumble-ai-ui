import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PlanningAgentRenderer from './subagents/PlanningAgentRenderer';
import ConversationAgentRenderer from './subagents/ConversationAgentRenderer';
import DefaultSubagentRenderer from './subagents/DefaultSubagentRenderer';
import VoiceInput from './VoiceInput';

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

  const status = agent?.status || 'running';
  const statusLabel = status === 'running' ? 'Live' : 'Complete';
  const isPlanningAgent =
    agent?.agent_id === 'planning-agent' ||
    (agent?.agent_name || '').toLowerCase().includes('planning');
  const isConversationAgent =
    agent?.agent_id === 'conversation-agent' ||
    (agent?.agent_name || '').toLowerCase().includes('conversation');

  const handleSubmit = (message) => {
    if (message.trim()) {
      onSend(message);
    }
  };

  if (!agent) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="flex-1" />
          <div className="pointer-events-auto">
            <motion.div
              className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-t-3xl bg-[#0b0d12] shadow-[0_-20px_80px_rgba(0,0,0,0.6)]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute w-[520px] h-[520px] rounded-full opacity-24 blur-[120px]"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(125, 211, 252, 0.55) 0%, rgba(125, 211, 252, 0.18) 45%, transparent 70%)',
                    top: '-25%',
                    right: '-15%',
                    animation: 'sheetMesh1 22s ease-in-out infinite',
                  }}
                />
                <div
                  className="absolute w-[560px] h-[560px] rounded-full opacity-2 blur-[120px]"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(248, 180, 160, 0.5) 0%, rgba(248, 180, 160, 0.16) 45%, transparent 70%)',
                    bottom: '-25%',
                    left: '-15%',
                    animation: 'sheetMesh2 26s ease-in-out infinite',
                  }}
                />
                <div
                  className="absolute w-[420px] h-[420px] rounded-full opacity-18 blur-[110px]"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(94, 234, 212, 0.45) 0%, rgba(94, 234, 212, 0.15) 50%, transparent 70%)',
                    top: '35%',
                    left: '30%',
                    animation: 'sheetMesh3 20s ease-in-out infinite',
                  }}
                />
              </div>
              <style>{`
                @keyframes sheetMesh1 {
                  0%, 100% { transform: translate(0, 0) scale(1); }
                  25% { transform: translate(-40px, 30px) scale(1.08); }
                  50% { transform: translate(30px, -20px) scale(0.96); }
                  75% { transform: translate(-20px, 25px) scale(1.04); }
                }
                @keyframes sheetMesh2 {
                  0%, 100% { transform: translate(0, 0) scale(1); }
                  30% { transform: translate(35px, -25px) scale(1.12); }
                  60% { transform: translate(-25px, 20px) scale(0.95); }
                }
                @keyframes sheetMesh3 {
                  0%, 100% { transform: translate(0, 0) scale(1); }
                  40% { transform: translate(20px, -25px) scale(1.06); }
                  70% { transform: translate(-15px, 20px) scale(0.98); }
                }
              `}</style>
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium text-white/90">{title}</div>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-white/60">
                      <span className={`h-1.5 w-1.5 rounded-full ${status === 'running' ? 'bg-emerald-400' : 'bg-white/40'}`} />
                      {statusLabel}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="text-white/50 hover:text-white/70">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[calc(100vh-14.5rem)] overflow-y-auto px-6 py-5 space-y-5 relative z-10">
                {(messages || []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
                    No messages yet. This subagent will stream responses here as soon as it starts running.
                  </div>
                )}

                {(messages || []).map((message, index) => {
                  const isUser = message.role === 'user';
                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {isUser ? (
                        <div className="max-w-[80%] rounded-2xl bg-[#1e3a5f] px-4 py-3 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                          <p className="text-sm leading-relaxed text-white">{message.content}</p>
                        </div>
                      ) : (
                        <div className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm leading-loose text-white/85">
                          {isPlanningAgent ? (
                            <PlanningAgentRenderer message={message} />
                          ) : isConversationAgent ? (
                            <ConversationAgentRenderer message={message} />
                          ) : (
                            <DefaultSubagentRenderer message={message} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/10 px-6 py-4">
                <VoiceInput
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSubmit}
                  disabled={isSending}
                  placeholder="Ask a follow-up..."
                  variant="sheet"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubagentInteractionPanel;
