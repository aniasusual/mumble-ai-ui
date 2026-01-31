import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import LiquidOrb from '../components/LiquidOrb';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import {
  ArrowLeft,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { sendMessageToAgent } from '../services/agentService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const introCalledRef = useRef(false);

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
        chat_history: newMessages
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
            isSubagent: true
          });
        }
      }

      // Add Main Agent response
      allNewMessages.push({
        role: 'assistant',
        content: result.content,
        agentName: 'Main Coach',
        isSubagent: false
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
  }, [isChatting, agentJobId, jobId, messages, saveChatHistory]);

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

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

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
      <div className="min-h-screen flex flex-col">
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
            
            <div className="flex items-center gap-2">
              {/* Chat History Link */}
              {messages.length > 0 && (
                <Link
                  to={`/jobs/${jobId}/history`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:bg-white/10"
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </Link>
              )}
              
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-full transition-all hover:bg-white/10"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX size={20} className="text-white/40" />
                ) : (
                  <Volume2 size={20} className="text-white/70" />
                )}
              </button>
            </div>
          </nav>
        </header>

        {/* Main Content - Landing Page Style */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-32">
          {/* Liquid Orb - Large size for chat page */}
          <div className="mb-8">
            <LiquidOrb isSpeaking={isSpeaking || isListening} size="large" />
          </div>

          {/* Response Display - Like Landing Page */}
          <div className="text-center max-w-2xl mx-auto mb-8 min-h-[80px] space-y-6">
            {isListening ? (
              <p
                className="text-lg leading-relaxed animate-pulse"
                style={{ color: 'rgba(143, 236, 120, 0.8)' }}
              >
                {chatInput || "Listening..."}
              </p>
            ) : isChatting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : messages.length > 0 ? (
              // Show last few messages with agent indicators
              <>
                {messages.slice(-3).filter(m => m.role === 'assistant').map((msg, idx) => (
                  <div key={idx} className="space-y-2">
                    {msg.isSubagent && (
                      <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'rgba(143, 236, 120, 0.7)' }}>
                        <div className="w-2 h-2 rounded-full bg-[#8FEC78]"></div>
                        <span>{msg.agentName}</span>
                      </div>
                    )}
                    <p
                      className="text-lg leading-relaxed"
                      style={{
                        color: msg.isSubagent ? 'rgba(143, 236, 120, 0.9)' : 'rgba(255, 255, 255, 0.8)',
                        fontStyle: msg.isSubagent ? 'italic' : 'normal'
                      }}
                    >
                      "{msg.content}"
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-white/40">
                Start a conversation with your coach
              </p>
            )}
          </div>

          {/* Input Area */}
          <div className="w-full max-w-lg">
            <form onSubmit={handleChatSubmit} className="flex gap-3 items-center">
              {/* Microphone Button - Full width when listening, small button when input focused */}
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
              
              {/* Text Input - Small button when listening, expands when focused */}
              <div 
                className="relative transition-all duration-500 ease-out"
                style={{
                  flex: isListening ? '0 0 56px' : '1 1 auto',
                  width: isListening ? '56px' : 'auto',
                }}
              >
                {isListening ? (
                  // Show as a simple button when mic is active
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
                  // Normal input when not listening
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
        </main>
      </div>
    </MeshGradientBackground>
  );
};

export default ChatPage;
