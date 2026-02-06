import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import {
  ArrowLeft,
  Send,
  Mic,
  Loader2,
  Sparkles,
  BookOpenText,
  PenLine,
  Headphones,
  Speech,
  CheckCircle2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { sendMessageToAgent } from '../services/agentService';
import { ConversationAgentPanel, ConversationInviteCard } from '../components/subagents';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRACTICE_MODULES = {
  writing: {
    name: 'Writing Lab',
    type: 'writing',
    focus: 'Structure and clarity',
    icon: PenLine,
  },
  pronunciation: {
    name: 'Pronunciation Studio',
    type: 'pronunciation',
    focus: 'Sounds, stress, rhythm',
    icon: Headphones,
  },
  reading: {
    name: 'Reading Flow',
    type: 'reading',
    focus: 'Pacing and intonation',
    icon: BookOpenText,
  },
  speaking: {
    name: 'Speaking Sprint',
    type: 'speaking',
    focus: 'Fluency and confidence',
    icon: Speech,
  },
  vocabulary: {
    name: 'Vocabulary Boost',
    type: 'vocabulary',
    focus: 'New words in context',
    icon: Sparkles,
  },
  grammar: {
    name: 'Grammar Focus',
    type: 'grammar',
    focus: 'Accuracy and corrections',
    icon: CheckCircle2,
  },
};

const detectPracticeModule = (text) => {
  if (!text) return null;
  const lowered = text.toLowerCase();
  if (lowered.includes('pronunciation') || lowered.includes('pronounce')) return 'pronunciation';
  if (lowered.includes('writing') || lowered.includes('write')) return 'writing';
  if (lowered.includes('reading') || lowered.includes('read')) return 'reading';
  if (lowered.includes('vocabulary') || lowered.includes('vocab') || lowered.includes('word')) return 'vocabulary';
  if (lowered.includes('grammar')) return 'grammar';
  return null;
};

// Detect if main agent wants to start conversation practice
const detectConversationInvite = (text) => {
  if (!text) return null;
  const lowered = text.toLowerCase();
  // Look for conversation practice triggers
  if (
    (lowered.includes('conversation') && (lowered.includes('practice') || lowered.includes('let\'s'))) ||
    (lowered.includes('speaking') && lowered.includes('practice')) ||
    lowered.includes('free conversation') ||
    lowered.includes('let\'s talk') ||
    lowered.includes('start a conversation') ||
    lowered.includes('practice speaking')
  ) {
    return {
      topic: 'Free conversation practice',
      description: 'Practice natural conversation with real-time voice interaction',
    };
  }
  return null;
};

const ChatPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Job data
  const [job, setJob] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [agentJobId, setAgentJobId] = useState(null);

  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const introCalledRef = useRef(false);
  const chatEndRef = useRef(null);

  const [activeModule, setActiveModule] = useState(null);
  
  // Conversation agent state
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(false);
  const [conversationContext, setConversationContext] = useState({});

  // Fetch job data
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`${API}/jobs/${jobId}`);
        setJob(response.data);

        // Restore AgentOS job ID if it exists (fallback to jobId)
        setAgentJobId(response.data.agent_job_id || jobId);

        // Load existing chat history if available
        if (response.data.chat_history) {
          setMessages(response.data.chat_history);
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
  }, [jobId, navigate]);

  // Save chat history to job
  const saveChatHistory = useCallback(async (newMessages, agentIdOverride = null) => {
    try {
      const updateData = {
        chat_history: newMessages,
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

    let updatedMessages = [...messages];

    // Add user message to chat
    if (!isIntro) {
      updatedMessages = [...messages, { role: 'user', content: message }];
      setMessages(updatedMessages);
      setChatInput('');
    }

    setIsChatting(true);

    try {
      // Call Main Agent through AgentOS with user context for base_language
      const result = await sendMessageToAgent(message, agentJobId || jobId, user);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Store AgentOS job ID for continuity
      let newAgentJobId = agentJobId || jobId;
      if (result.jobId && !agentJobId) {
        newAgentJobId = result.jobId;
        setAgentJobId(result.jobId);
      }

      let allNewMessages = [...updatedMessages];

      // Add subagent responses if any (before main agent response)
      if (result.memberResponses && result.memberResponses.length > 0) {
        for (const memberResponse of result.memberResponses) {
          allNewMessages.push({
            role: 'assistant',
            content: memberResponse.content,
            agentName: memberResponse.agent_name || 'Agent',
            agentId: memberResponse.agent_id,
            isSubagent: true,
          });
        }
      }

      // Add Main Agent response
      allNewMessages.push({
        role: 'assistant',
        content: result.content,
        agentName: 'Main Coach',
        isSubagent: false,
      });

      setMessages(allNewMessages);

      // Save to backend job storage (include agent job ID if it was just set)
      saveChatHistory(allNewMessages, !agentJobId && newAgentJobId ? newAgentJobId : null);

    } catch (error) {
      console.error('Chat error:', error);
      if (!isIntro) {
        toast.error('Failed to send message. Try again.');
      }
    } finally {
      setIsChatting(false);
    }
  }, [isChatting, agentJobId, jobId, messages, saveChatHistory, user]);

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
  }, [messages, isChatting]);

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

  const renderPracticeModule = (module) => {
    if (!module) return null;

    switch (module.type) {
      case 'writing':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Writing prompt</p>
              <p className="mt-2 text-white/90">Describe a memorable meal you had recently. Focus on details and sequence.</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <textarea
                  rows={6}
                  placeholder="Write your response here..."
                  className="w-full bg-transparent text-white/90 placeholder:text-white/30 focus:outline-none"
                />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button className="px-4 py-2 rounded-full text-sm text-[#8FEC78] border border-[#8FEC78]/40 bg-[#8FEC78]/10">
                  Submit writing
                </button>
                <span className="text-xs text-white/40">You can edit before submitting.</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Coach checklist</p>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>Clear beginning, middle, end.</li>
                <li>At least 3 descriptive adjectives.</li>
                <li>Use past tense consistently.</li>
              </ul>
            </div>
          </div>
        );
      case 'pronunciation':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Target phrase</p>
              <p className="mt-2 text-white text-lg">"Could you repeat that more slowly?"</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="px-4 py-2 rounded-full text-sm text-[#8FEC78] border border-[#8FEC78]/40 bg-[#8FEC78]/10">
                  Record attempt
                </button>
                <button className="px-4 py-2 rounded-full text-sm text-white/60 border border-white/10 bg-white/5">
                  Hear model
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Feedback focus</p>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>Stress on "repeat" and "slowly".</li>
                <li>Link "repeat that" smoothly.</li>
                <li>Soften the "t" in "that".</li>
              </ul>
            </div>
          </div>
        );
      case 'reading':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Reading passage</p>
              <p className="mt-2 text-white/90">"When the train finally arrived, the platform had gone quiet. Everyone leaned forward, eager to see where it would take them."</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="px-4 py-2 rounded-full text-sm text-[#8FEC78] border border-[#8FEC78]/40 bg-[#8FEC78]/10">
                  Start reading
                </button>
                <button className="px-4 py-2 rounded-full text-sm text-white/60 border border-white/10 bg-white/5">
                  Hear coach read
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Reading goals</p>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>Pause briefly after commas.</li>
                <li>Lift intonation on "eager".</li>
                <li>Keep a steady pace.</li>
              </ul>
            </div>
          </div>
        );
      case 'speaking':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Speaking prompt</p>
              <p className="mt-2 text-white/90">Explain your weekend plans in under one minute. Include one detail about time and location.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="px-4 py-2 rounded-full text-sm text-[#8FEC78] border border-[#8FEC78]/40 bg-[#8FEC78]/10">
                  Begin speaking
                </button>
                <button className="px-4 py-2 rounded-full text-sm text-white/60 border border-white/10 bg-white/5">
                  Practice outline
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Coach notes</p>
              <p className="mt-2 text-white/70 text-sm">Aim for 3-4 sentences. Focus on smooth linking words.</p>
            </div>
          </div>
        );
      case 'vocabulary':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">New words</p>
              <div className="mt-3 grid gap-3">
                {['negotiate', 'improvise', 'persuade'].map((word) => (
                  <div key={word} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-white font-medium">{word}</p>
                    <p className="text-white/60 text-sm">Use it in a sentence about today.</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Your sentence</p>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white/90 placeholder:text-white/30 focus:outline-none"
                placeholder="Type one sentence using a new word..."
              />
            </div>
          </div>
        );
      case 'grammar':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Fix the sentence</p>
              <p className="mt-2 text-white/90">"I am agree with you because it make sense."</p>
              <input
                className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white/90 placeholder:text-white/30 focus:outline-none"
                placeholder="Rewrite it correctly..."
              />
              <div className="mt-4">
                <button className="px-4 py-2 rounded-full text-sm text-[#8FEC78] border border-[#8FEC78]/40 bg-[#8FEC78]/10">
                  Check answer
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Coach hint</p>
              <p className="mt-2 text-white/70 text-sm">Drop "am" before adjectives like "agree".</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const activeModuleMeta = useMemo(() => {
    if (!activeModule) return null;
    return PRACTICE_MODULES[activeModule] || null;
  }, [activeModule]);

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
              {messages.length === 0 && !isChatting && (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-white/50">
                    Your coach will guide you step-by-step and open practice modules as needed.
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const practiceType = msg.role === 'assistant' && !msg.isSubagent
                    ? detectPracticeModule(msg.content)
                    : null;
                  const moduleMeta = practiceType ? PRACTICE_MODULES[practiceType] : null;
                  const ModuleIcon = moduleMeta?.icon || Sparkles;
                  
                  // Check for conversation practice invite
                  const conversationInvite = msg.role === 'assistant' && !msg.isSubagent
                    ? detectConversationInvite(msg.content)
                    : null;

                  if (msg.role === 'user') {
                    return (
                      <div key={idx} className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl bg-[#1e3a5f] px-4 py-3 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                          <p className="text-sm uppercase tracking-[0.2em] text-[#60a5fa]">You</p>
                          <p className="mt-2 text-base leading-relaxed text-white">{msg.content}</p>
                        </div>
                      </div>
                    );
                  }

                  if (msg.role === 'tool') {
                    return (
                      <div key={idx} className="flex justify-center">
                        <div className="w-full rounded-2xl bg-[#1f2937] px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Coach tool</p>
                          <p className="mt-2 text-sm text-[#d1d5db]">{msg.content}</p>
                        </div>
                      </div>
                    );
                  }

                  if (msg.isSubagent) {
                    return (
                      <div key={idx} className="flex justify-start">
                        <div className="w-full rounded-2xl bg-[#831843] px-4 py-4 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] text-[#f9a8d4]">Specialist feedback</p>
                              <p className="text-lg font-semibold text-white mt-1">{msg.agentName || 'Specialist'}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[#fce7f3]">{msg.content}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-start">
                        <div className="w-full px-1 py-2">
                          <p className="text-base leading-relaxed text-white/90">{msg.content}</p>
                        </div>
                      </div>
                      
                      {/* Conversation Practice Invite */}
                      {conversationInvite && (
                        <ConversationInviteCard
                          topic={conversationInvite.topic}
                          description={conversationInvite.description}
                          targetLanguage={user?.target_language}
                          level={user?.level}
                          onClick={() => {
                            setConversationContext({
                              topic: conversationInvite.topic,
                              targetLanguage: user?.target_language,
                              level: user?.level,
                            });
                            setIsConversationPanelOpen(true);
                          }}
                        />
                      )}
                      
                      {/* Other practice modules */}
                      {moduleMeta && !conversationInvite && (
                        <div className="flex justify-start">
                          <div className="w-full rounded-2xl border border-white/10 bg-[#161b22] px-4 py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center text-white/70">
                                  <ModuleIcon size={18} />
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Practice module</p>
                                  <p className="text-lg font-semibold text-white mt-1">{moduleMeta.name}</p>
                                  <p className="text-xs text-white/50 mt-1">{moduleMeta.focus}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setActiveModule(moduleMeta.type)}
                                className="px-4 py-2 rounded-full text-sm text-[#8FEC78] border border-[#8FEC78]/40 bg-[#8FEC78]/10 hover:bg-[#8FEC78]/20 transition"
                              >
                                Open practice
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {isChatting && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
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
          </div>
        </main>

        {activeModuleMeta && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center px-6 py-16">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveModule(null)}
            />
            <div className="relative w-full max-w-4xl rounded-[32px] border border-white/10 bg-[#0b0b0b]/80 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8FEC78]/80">Practice module</p>
                  <h3 className="text-2xl font-semibold text-white mt-2">{activeModuleMeta.name}</h3>
                  <p className="text-sm text-white/60 mt-1">{activeModuleMeta.focus}</p>
                </div>
                <button
                  onClick={() => setActiveModule(null)}
                  className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                <div>
                  {renderPracticeModule(activeModuleMeta)}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">Coach intent</p>
                    <p className="mt-2 text-white/80 text-sm">This module appears when your tutor decides it is the right next step.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-white/70">After you finish</p>
                    <div className="mt-3 space-y-2 text-sm text-white/80">
                      <p>We will highlight your strengths.</p>
                      <p>We will track what to revisit later.</p>
                      <p>The main coach resumes the conversation.</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-3 rounded-2xl bg-[#8FEC78]/15 border border-[#8FEC78]/30 text-[#8FEC78] text-sm">
                    Mark as complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Conversation Agent Panel */}
        <ConversationAgentPanel
          isOpen={isConversationPanelOpen}
          onClose={() => setIsConversationPanelOpen(false)}
          jobId={agentJobId || jobId}
          user={user}
          context={conversationContext}
        />
      </div>
    </MeshGradientBackground>
  );
};

export default ChatPage;
