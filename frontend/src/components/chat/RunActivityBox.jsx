import React from 'react';
import { Loader2 } from 'lucide-react';
import SubagentCard from './SubagentCard';

const RunActivityBox = ({ runItem, isExpanded, onToggle, onSelectSubagent }) => {
  if (!runItem) return null;

  const hasRunning =
    runItem.status === 'running' ||
    (runItem.tools || []).some((tool) => tool.status === 'running') ||
    (runItem.agents || []).some((agent) => agent.status === 'running');

  return (
    <div className="w-full rounded-2xl border border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">Run activity</div>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs text-white/50 hover:text-white/70"
        >
          {isExpanded ? 'Hide events' : 'Show events'}
        </button>
      </div>

      {hasRunning && (
        <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
          <span>Running…</span>
        </div>
      )}

      {(runItem.tools || []).length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-white/40 uppercase tracking-[0.2em]">Tools</div>
          {runItem.tools.map((tool) => (
            <div key={tool.id} className="text-sm text-white/80">
              <span className="text-white/50">{tool.status}</span>
              {tool.tool_name ? ` · ${tool.tool_name}` : ''}
              {tool.agent_name ? ` · ${tool.agent_name}` : ''}
            </div>
          ))}
        </div>
      )}

      {(runItem.agents || []).length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-white/40 uppercase tracking-[0.2em]">Subagents</div>
          <div className="space-y-2">
            {runItem.agents.map((agent) => (
              <SubagentCard
                key={agent.id}
                agent={agent}
                onClick={() => onSelectSubagent(agent)}
              />
            ))}
          </div>
        </div>
      )}

      {isExpanded && (runItem.events || []).length > 0 && (
        <pre className="mt-3 whitespace-pre-wrap text-xs text-white/50">
          {JSON.stringify(runItem.events, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default RunActivityBox;
