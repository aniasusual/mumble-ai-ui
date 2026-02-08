import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { ArrowLeft, Send, Mic, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import {
  sendMessageToAgentStreaming,
  sendMessageToSubagentStreaming,
  getAgentJobHistory,
} from '../services/agentService';
import { RunActivityBox, SubagentInteractionPanel } from '../components/chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`
const TEAM_AGENT_ID = 'mumble-ai-coach';


const ChatPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Job data
  const [job, setJob] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);

  // Chat states
  const [chatItems, setChatItems] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [agentJobId, setAgentJobId] = useState(null);

  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [expandedRunEvents, setExpandedRunEvents] = useState({});
  const [activeSubagent, setActiveSubagent] = useState(null);
  const [subagentSessions, setSubagentSessions] = useState({});
  const [isSubagentSending, setIsSubagentSending] = useState(false);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const introCalledRef = useRef(false);
  const chatEndRef = useRef(null);
  const chatItemsRef = useRef([]);

  const isTeamAssistantMessage = useCallback((message) => {
    if (!message) return false;
    if (message.role && message.role !== 'assistant') return true;
    if (message.type && message.type !== 'assistant') return true;
    const agentId = message.agent_id || message.agentId;
    const agentName = (message.agent_name || message.agentName || '').toLowerCase();
    if (agentId && agentId !== TEAM_AGENT_ID) return false;
    if (agentName && agentName.includes('planning') && agentId !== TEAM_AGENT_ID) return false;
    return true;
  }, []);

  // Fetch job data
  const setChatItemsState = useCallback((updater) => {
    setChatItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      chatItemsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`${API}/jobs/${jobId}`);
        setJob(response.data);

        // Restore AgentOS job ID if it exists (fallback to jobId)
        setAgentJobId(response.data.agent_job_id || jobId);

        // Load existing chat history if available
        if (Array.isArray(response.data.chat_history) && response.data.chat_history.length > 0) {
          const history = response.data.chat_history;
          const hasTypedEntries = history.some((item) => item?.type);
          if (hasTypedEntries) {
            const normalized = history.map((item) => {
              if (item?.type !== 'run') return item;
              const hasCompletedEvent = Array.isArray(item.events)
                ? item.events.some((event) => event?.event === 'TeamRunCompleted')
                : false;
              const toolsDone = Array.isArray(item.tools)
                ? item.tools.every((tool) => tool.status === 'completed')
                : true;
              const agentsDone = Array.isArray(item.agents)
                ? item.agents.every((agent) => agent.status === 'completed')
                : true;
              const nextStatus = hasCompletedEvent || (toolsDone && agentsDone)
                ? 'completed'
                : item.status || 'running';
              return { ...item, status: nextStatus };
            });
            const filtered = normalized.filter((item) => {
              if (!item) return false;
              if (item.type !== 'assistant') return true;
              return isTeamAssistantMessage(item);
            });
            setChatItemsState(filtered);
          } else {
            const restoredItems = history
              .filter((item) => item?.role === 'user' || item?.role === 'assistant')
              .filter((item) => isTeamAssistantMessage(item))
              .map((item) => ({
                type: item.role,
                content: item.content || '',
                agent_id: item.agent_id,
                agent_name: item.agent_name,
              }))
              .filter((item) => item.content);
            setChatItemsState(restoredItems);
          }
        } else {
          const agentSessionId = response.data.agent_job_id || jobId;
          if (agentSessionId) {
            const historyResponse = await getAgentJobHistory(agentSessionId);
            if (historyResponse?.success && Array.isArray(historyResponse.messages)) {
              const restoredItems = historyResponse.messages
                .filter((message) => message?.role === 'user' || message?.role === 'assistant')
                .filter((message) => isTeamAssistantMessage(message))
                .map((message) => ({
                  type: message.role,
                  content: message.content || '',
                  agent_id: message.agent_id,
                  agent_name: message.agent_name,
                }))
                .filter((item) => item.content);

              if (restoredItems.length > 0) {
                setChatItemsState(restoredItems);
                await axios.put(`${API}/jobs/${jobId}`, { chat_history: restoredItems });
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch job:', error);
        toast.error('Job not found');
        navigate('/jobs');
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId, navigate, setChatItemsState]);

  // Save chat history to job
  const saveChatHistory = useCallback(async (_unused, agentIdOverride = null) => {
    try {
      const updateData = {
        chat_history: chatItemsRef.current,
      };

      // Save AgentOS job ID if provided
      if (agentIdOverride) {
        updateData.agent_job_id = agentIdOverride;
      }

      await axios.put(`${API}/jobs/${jobId}`, updateData);
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [jobId]);

  const getSubagentKey = useCallback((agent) => {
    if (!agent) return null;
    return agent.agent_id || agent.agent_name || agent.id;
  }, []);

  const updateSubagentSession = useCallback((agentKey, updater) => {
    if (!agentKey) return;
    setSubagentSessions((prev) => {
      const current = prev[agentKey] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [agentKey]: next };
    });
  }, []);

  const handleSelectSubagent = useCallback((agent) => {
    const agentKey = getSubagentKey(agent);
    if (!agentKey) return;
    setActiveSubagent(agent);
    updateSubagentSession(agentKey, (current) => {
      if (current.length > 0 || !agent?.content) return current;
      return [{ role: 'assistant', content: agent.content }];
    });
  }, [getSubagentKey, updateSubagentSession]);

  const handleSendToSubagent = useCallback(async (message) => {
    if (!activeSubagent?.agent_id) {
      toast.error('This subagent is not available for direct chat yet.');
      return;
    }

    const agentKey = getSubagentKey(activeSubagent);
    if (!agentKey) return;

    setIsSubagentSending(true);
    let assistantIndex = -1;

    updateSubagentSession(agentKey, (current) => {
      const next = [
        ...current,
        { role: 'user', content: message },
        { role: 'assistant', content: '' },
      ];
      assistantIndex = next.length - 1;
      return next;
    });

    const onChunk = (chunk) => {
      if (!chunk) return;
      updateSubagentSession(agentKey, (current) => {
        if (assistantIndex < 0 || assistantIndex >= current.length) return current;
        const next = [...current];
        const target = next[assistantIndex];
        next[assistantIndex] = { ...target, content: `${target.content || ''}${chunk}` };
        return next;
      });
    };

    try {
      await sendMessageToSubagentStreaming(activeSubagent.agent_id, message, null, onChunk);
    } catch (error) {
      console.error('Subagent streaming error:', error);
      toast.error('Failed to reach subagent.');
    } finally {
      setIsSubagentSending(false);
    }
  }, [activeSubagent, getSubagentKey, updateSubagentSession]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        setChatInput(transcript);

        if (event.results[0].isFinal) {
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Send message to Main Agent
  const sendMessage = useCallback(async (message, isIntro = false) => {
    if (!message.trim() || isChatting) return;

    let updatedItems = [...chatItemsRef.current];

    // Add user message to chat
    if (!isIntro) {
      updatedItems = [
        ...updatedItems,
        { type: 'user', content: message },
      ];
      setChatItemsState(updatedItems);
      setChatInput('');
    }

    const runItemId = `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const runItem = {
      type: 'run',
      id: runItemId,
      status: 'running',
      tools: [],
      agents: [],
      events: [],
    };
    updatedItems = [
      ...updatedItems,
      runItem,
      { type: 'assistant', content: '' },
    ];
    setChatItemsState(updatedItems);
    const assistantIndexRef = { current: updatedItems.length - 1 };

    setIsChatting(true);

    try {
      const toolIndexByKey = new Map();
      const agentIndexByKey = new Map();

      const updateRunItem = (update) => {
        setChatItemsState((prev) =>
          prev.map((item) => {
            if (item.type !== 'run' || item.id !== runItemId) return item;
            return update(item);
          })
        );
      };

      const handleStreamEvent = (data) => {
        if (!data?.event) return;
        const summarizedEvent = {
          event: data.event,
          created_at: data.created_at,
          run_id: data.run_id,
          parent_run_id: data.parent_run_id,
          session_id: data.session_id,
          agent_id: data.agent_id,
          agent_name: data.agent_name,
          team_id: data.team_id,
          team_name: data.team_name,
          tool: data.tool ? { tool_name: data.tool.tool_name || data.tool.name } : undefined,
          content: data.content,
        };
        updateRunItem((runItem) => ({
          ...runItem,
          events: [...runItem.events, summarizedEvent],
        }));

        if (data.event === 'TeamRunContent' || data.event === 'TeamRunIntermediateContent') {
          const chunk = data.content || '';
          if (!chunk) return;
          const isMemberResponse =
            (data.team_id && data.agent_id && data.agent_id !== data.team_id) ||
            (data.agent_id && data.agent_id !== 'mumble-ai-coach');
          if (isMemberResponse) return;
          setChatItemsState((prev) => {
            if (assistantIndexRef.current === null || !prev[assistantIndexRef.current]) return prev;
            const next = [...prev];
            const current = next[assistantIndexRef.current];
            const nextContent = (current.content || '') + chunk;
            next[assistantIndexRef.current] = { ...current, content: nextContent };
            return next;
          });
          return;
        }

      if (data.event === 'TeamToolCallStarted' || data.event === 'ToolCallStarted') {
        const toolName = data.tool?.tool_name || data.tool?.name || data.tool_name;
          const key = `${data.run_id || data.created_at || ''}:${toolName || ''}`;
          if (!toolIndexByKey.has(key)) {
            toolIndexByKey.set(key, key);
            updateRunItem((runItem) => ({
              ...runItem,
              tools: [
                ...runItem.tools,
                {
                  id: key,
                  status: 'running',
                  tool_name: toolName,
                  agent_name: data.agent_name || data.team_name,
                },
              ],
            }));
          }
          return;
        }

        if (data.event === 'TeamToolCallCompleted' || data.event === 'ToolCallCompleted') {
        const toolName = data.tool?.tool_name || data.tool?.name || data.tool_name;
          const key = `${data.run_id || data.created_at || ''}:${toolName || ''}`;
          updateRunItem((runItem) => ({
            ...runItem,
            tools: runItem.tools.map((tool) =>
              tool.id === key ? { ...tool, status: 'completed', tool_name: toolName } : tool
            ),
          }));
          return;
        }

        if (data.event === 'RunStarted') {
          const agentKey = data.run_id || data.agent_id || data.agent_name;
          if (!agentKey) return;
          if (!agentIndexByKey.has(agentKey)) {
            agentIndexByKey.set(agentKey, agentKey);
            updateRunItem((runItem) => ({
              ...runItem,
              agents: [
                ...runItem.agents,
                {
                  id: agentKey,
                  status: 'running',
                  agent_name: data.agent_name,
                  agent_id: data.agent_id,
                },
              ],
            }));
          }
          return;
        }

        if (data.event === 'RunCompleted') {
          const agentKey = data.run_id || data.agent_id || data.agent_name;
          const content = data.content || '';
          if (!agentKey) return;
          updateRunItem((runItem) => ({
            ...runItem,
            agents: runItem.agents.map((agent) =>
              agent.id === agentKey ? { ...agent, status: 'completed', content } : agent
            ),
          }));
          return;
        }

        if (data.event === 'TeamRunStarted') {
          updateRunItem((runItem) => ({
            ...runItem,
            status: 'running',
            run_id: data.run_id,
          }));
        }

        if (data.event === 'TeamRunCompleted') {
          updateRunItem((runItem) => ({
            ...runItem,
            status: 'completed',
            run_id: data.run_id || runItem.run_id,
          }));
        }
      };

      // Call Main Agent through AgentOS with user context for base_language
      const result = await sendMessageToAgentStreaming(
        message,
        agentJobId || jobId,
        () => {},
        handleStreamEvent,
        user
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Store AgentOS job ID for continuity
      let newAgentJobId = agentJobId || jobId;
      if (result.jobId && !agentJobId) {
        newAgentJobId = result.jobId;
        setAgentJobId(result.jobId);
      }

      if (result.content) {
        setChatItemsState((prev) => {
          if (assistantIndexRef.current === null || !prev[assistantIndexRef.current]) {
            return [...prev, { type: 'assistant', content: result.content }];
          }
          const next = [...prev];
          next[assistantIndexRef.current] = { ...next[assistantIndexRef.current], content: result.content };
          return next;
        });
      }

      // Backfill run activity subagents from member_responses so subagent box and content are available
      if (Array.isArray(result.memberResponses) && result.memberResponses.length > 0) {
        setChatItemsState((prev) =>
          prev.map((item) => {
            if (item.type !== 'run' || item.id !== runItemId) return item;
            const fromMembers = result.memberResponses.map((mr, idx) => {
              const agentId = mr.agent_id ?? mr.id ?? `member-${idx}`;
              const agentName = mr.agent_name ?? mr.name ?? 'Subagent';
              let content = mr.content;
              if (content == null && Array.isArray(mr.messages)) {
                const assistantMessages = mr.messages.filter((m) => m.role === 'assistant');
                content = assistantMessages.map((m) => m.content ?? '').join('\n').trim() || '';
              }
              if (content == null) content = '';
              return {
                id: agentId,
                agent_id: agentId,
                agent_name: agentName,
                status: 'completed',
                content: String(content),
              };
            });
            const merged = [...(item.agents || [])];
            fromMembers.forEach((agent) => {
              const existing = merged.find((a) => a.id === agent.id || a.agent_id === agent.agent_id);
              if (!existing) {
                merged.push(agent);
              } else if (!existing.content && agent.content) {
                const i = merged.indexOf(existing);
                merged[i] = { ...existing, content: agent.content, status: 'completed' };
              }
            });
            return { ...item, agents: merged };
          })
        );
      }

      // Save to backend job storage (include agent job ID if it was just set)
      saveChatHistory(null, !agentJobId && newAgentJobId ? newAgentJobId : null);
    } catch (error) {
      console.error('Chat error:', error);
      if (!isIntro) {
        toast.error('Failed to send message. Try again.');
      }
    } finally {
      setIsChatting(false);
    }
  }, [isChatting, agentJobId, jobId, saveChatHistory, setChatItemsState, user]);

  // Trigger intro message when job loads (only for new jobs)
  useEffect(() => {
    if (!job || introCalledRef.current || isLoadingJob) return;

    // Only send intro if no chat history exists
    if (job.chat_history && job.chat_history.length > 0) {
      introCalledRef.current = true;
      return;
    }

    introCalledRef.current = true;

    // New job - Agent introduces itself
    const introMessage = "Hello! I'm your language learning coach.";

    sendMessage(introMessage, true);
  }, [job, isLoadingJob, sendMessage]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems, isChatting]);

  // Toggle voice input
  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsSpeaking(false);
      }

      setChatInput('');
      setIsListening(true);

      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setIsListening(false);
      }
    }
  };

  // Handle voice send
  const handleVoiceSend = () => {
    if (chatInput.trim() && !isChatting) {
      sendMessage(chatInput);
    }
  };

  // Handle chat submit
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
    }
  };

  const activeSubagentKey = getSubagentKey(activeSubagent);
  const activeSubagentMessages = activeSubagentKey ? subagentSessions[activeSubagentKey] : [];

  if (isLoadingJob) {
    return (
      <MeshGradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
        </div>
      </MeshGradientBackground>
    );
  }

  return (
    <MeshGradientBackground>
      <div className="h-screen overflow-hidden flex flex-col">
        {/* Hidden audio element */}
        <audio ref={audioRef} />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
          <nav className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/jobs"
                className="p-2 rounded-full transition-all hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </Link>
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <MumbleLogo size={32} color="#ffffff" isAnimating={isSpeaking} />
                <span className="font-medium text-lg text-white hidden sm:block">mumble</span>
              </Link>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pt-24 pb-6 overflow-hidden">
          <div className="max-w-5xl mx-auto flex flex-col gap-6 h-full">
            <div className="space-y-4 overflow-y-auto pr-1 min-h-0 flex-1">
                {chatItems.map((item, idx) => {
                  if (item.type === 'user') {
                    return (
                      <div key={idx} className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl bg-[#1e3a5f] px-4 py-3 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                          <p className="text-base leading-relaxed text-white">{item.content}</p>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'assistant') {
                    return (
                      <div key={idx} className="flex justify-start">
                        <div className="w-full px-1 py-2">
                          <p className="text-base leading-relaxed text-white/90">{item.content}</p>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'run') {
                    const isExpanded = !!expandedRunEvents[item.id];
                    return (
                      <div key={idx} className="flex justify-start">
                        <RunActivityBox
                          runItem={item}
                          isExpanded={isExpanded}
                          onToggle={() =>
                            setExpandedRunEvents((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          onSelectSubagent={handleSelectSubagent}
                        />
                      </div>
                    );
                  }

                  return null;
                })}

                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-1 py-2">
              <form onSubmit={handleChatSubmit} className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={isListening ? handleVoiceSend : toggleListening}
                  disabled={isChatting}
                  className="h-14 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 ease-out disabled:opacity-30 overflow-hidden flex-shrink-0"
                  style={{
                    width: isListening ? 'calc(100% - 68px)' : '56px',
                    flex: isListening ? '1 1 auto' : '0 0 56px',
                    background: isListening
                      ? 'linear-gradient(135deg, rgba(143, 236, 120, 0.15) 0%, rgba(90, 201, 75, 0.15) 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isListening
                      ? '1px solid rgba(143, 236, 120, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isListening ? '0 0 40px rgba(143, 236, 120, 0.15)' : 'none',
                  }}
                  title={isListening ? 'Send voice message' : 'Start voice input'}
                >
                  {isListening ? (
                    <>
                      <Mic size={20} className="text-[#8FEC78]" />
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-[#8FEC78] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-5 bg-[#8FEC78] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-4 bg-[#8FEC78] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                        <span className="w-1 h-6 bg-[#8FEC78] rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                        <span className="w-1 h-3 bg-[#8FEC78] rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                      </div>
                      <span className="text-[#8FEC78] text-sm font-medium ml-2">Tap to send</span>
                      <Send size={18} className="text-[#8FEC78] ml-auto mr-2" />
                    </>
                  ) : (
                    <Mic size={20} className="text-white/50" />
                  )}
                </button>

                <div
                  className="relative transition-all duration-500 ease-out"
                  style={{
                    flex: isListening ? '0 0 56px' : '1 1 auto',
                    width: isListening ? '56px' : 'auto',
                  }}
                >
                  {isListening ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (recognitionRef.current) {
                          recognitionRef.current.stop();
                        }
                        setIsListening(false);
                      }}
                      className="h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Send size={20} className="text-white/30" />
                    </button>
                  ) : (
                    <>
                      <Input
                        type="text"
                        placeholder="Type your message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isChatting}
                        className="h-14 pl-5 pr-14 rounded-2xl text-white placeholder:text-white/25 transition-all duration-300 border-0 focus-visible:ring-1 focus-visible:ring-[#8FEC78]/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isChatting || !chatInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all hover:bg-white/10 disabled:opacity-30"
                      >
                        {isChatting ? (
                          <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
                        ) : (
                          <Send size={20} className="text-white/50" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            <SubagentInteractionPanel
              isOpen={!!activeSubagent}
              agent={activeSubagent}
              messages={activeSubagentMessages}
              onClose={() => setActiveSubagent(null)}
              onSend={handleSendToSubagent}
              isSending={isSubagentSending}
            />
          </div>
        </main>

      </div>
    </MeshGradientBackground>
  );
};

export default ChatPage;
