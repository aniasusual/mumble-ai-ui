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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Session data
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  
  // Chat states
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [chatSessionId, setChatSessionId] = useState(() => `chat-${sessionId}-${Date.now()}`);
  
  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Input focus state
  const [inputFocused, setInputFocused] = useState(false);
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const introCalledRef = useRef(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(`${API}/sessions/${sessionId}`);
        setSession(response.data);
        // Load existing chat history if available
        if (response.data.chat_history) {
          setMessages(response.data.chat_history);
          if (response.data.chat_history.length > 0) {
            const lastAssistantMsg = [...response.data.chat_history].reverse().find(m => m.role === 'assistant');
            if (lastAssistantMsg) {
              setCurrentResponse(lastAssistantMsg.content);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        toast.error('Session not found');
        navigate('/sessions');
      } finally {
        setIsLoadingSession(false);
      }
    };
    
    fetchSession();
  }, [sessionId, navigate]);

  // Save chat history to session
  const saveChatHistory = useCallback(async (newMessages) => {
    try {
      await axios.put(`${API}/sessions/${sessionId}`, {
        chat_history: newMessages
      });
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [sessionId]);

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

  // Play audio from base64
  const playAudioFromBase64 = useCallback((base64Audio) => {
    if (isMuted || !audioRef.current) return;
    
    const audioSrc = `data:audio/mpeg;base64,${base64Audio}`;
    audioRef.current.src = audioSrc;
    audioRef.current.onplay = () => setIsSpeaking(true);
    audioRef.current.onended = () => setIsSpeaking(false);
    audioRef.current.onerror = () => setIsSpeaking(false);
    
    audioRef.current.play().catch(e => {
      console.log('Audio playback failed:', e);
      setIsSpeaking(false);
    });
  }, [isMuted]);

  // Send message to Mia
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
    setCurrentResponse('');
    
    try {
      const response = await axios.post(`${API}/chat-voice`, {
        message: message,
        session_id: chatSessionId
      }, { timeout: 30000 });
      
      // Add AI response
      const newMessages = [...updatedMessages, { role: 'assistant', content: response.data.response }];
      setMessages(newMessages);
      setCurrentResponse(response.data.response);
      
      // Save to session
      saveChatHistory(newMessages);
      
      if (response.data.audio) {
        playAudioFromBase64(response.data.audio);
      }
    } catch (error) {
      console.error('Chat error:', error);
      if (!isIntro) {
        toast.error('Failed to send message. Try again.');
      }
    } finally {
      setIsChatting(false);
    }
  }, [isChatting, chatSessionId, messages, playAudioFromBase64, saveChatHistory]);

  // Trigger intro message when session loads (only for new sessions)
  useEffect(() => {
    if (!session || introCalledRef.current || isLoadingSession) return;
    
    // Only send intro if no chat history exists
    if (session.chat_history && session.chat_history.length > 0) {
      introCalledRef.current = true;
      return;
    }
    
    introCalledRef.current = true;
    
    // New session - Mia asks about language preferences
    const introMessage = `This is a new learning session. Greet the user warmly and ask them which language they would like to learn today. Keep it brief and friendly.`;
    
    sendMessage(introMessage, true);
  }, [session, isLoadingSession, sendMessage]);

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

  if (isLoadingSession) {
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
                to="/sessions"
                className="p-2 rounded-full transition-all hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </Link>
              <div className="flex items-center gap-3">
                <MumbleLogo size={32} color="#ffffff" isAnimating={isSpeaking} />
                <div>
                  <h1 className="text-white font-medium text-sm">
                    {session?.title || 'New Session'}
                  </h1>
                  {session?.language && (
                    <p className="text-white/40 text-xs">
                      {session.language} • {session.level || 'Getting started'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Chat History Link */}
              {messages.length > 0 && (
                <Link
                  to={`/sessions/${sessionId}/history`}
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
          <div className="text-center max-w-lg mx-auto mb-8 min-h-[80px]">
            {isListening ? (
              <p 
                className="text-lg leading-relaxed animate-pulse"
                style={{ color: 'rgba(143, 236, 120, 0.8)' }}
              >
                {chatInput || "Listening..."}
              </p>
            ) : currentResponse ? (
              <p 
                className="text-lg leading-relaxed"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                "{currentResponse}"
              </p>
            ) : isChatting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <p className="text-white/40">
                Start a conversation with Mia
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
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
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
