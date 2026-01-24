import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import LiquidOrb from '../components/LiquidOrb';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  ArrowLeft,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  MessageSquare,
  X,
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
  
  // Chat history modal
  const [showHistory, setShowHistory] = useState(false);
  
  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const introCalledRef = useRef(false);
  const historyEndRef = useRef(null);

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

  // Scroll to bottom of history
  useEffect(() => {
    if (showHistory) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showHistory, messages]);

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
              {/* Chat History Button */}
              {messages.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:bg-white/10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
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
            <form onSubmit={handleChatSubmit} className="flex gap-3">
              {/* Microphone Button */}
              <button
                type="button"
                onClick={isListening ? handleVoiceSend : toggleListening}
                disabled={isChatting}
                className="h-14 w-14 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30"
                style={{
                  background: isListening 
                    ? 'linear-gradient(135deg, rgba(143, 236, 120, 0.3) 0%, rgba(90, 201, 75, 0.3) 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: isListening
                    ? '1px solid rgba(143, 236, 120, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                }}
                title={isListening ? 'Send voice message' : 'Start voice input'}
              >
                {isListening ? (
                  <Send size={20} className="text-[#8FEC78]" />
                ) : (
                  <Mic size={20} className="text-white/50" />
                )}
              </button>
              
              {/* Text Input */}
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder={isListening ? "Listening..." : "Type your message..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatting || isListening}
                  className="h-14 pl-5 pr-14 rounded-2xl text-white placeholder:text-white/25 transition-all border-0 focus-visible:ring-1 focus-visible:ring-[#8FEC78]/50"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                  }}
                />
                <button
                  type="submit"
                  disabled={isChatting || !chatInput.trim() || isListening}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all hover:bg-white/10 disabled:opacity-30"
                >
                  {isChatting ? (
                    <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
                  ) : (
                    <Send size={20} className="text-white/50" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Chat History Modal */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent
            className="sm:max-w-2xl max-h-[80vh] border-0 p-0 overflow-hidden"
            style={{
              background: 'transparent',
            }}
          >
            <div 
              className="flex flex-col h-full max-h-[80vh]"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(40px)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white">
                    Chat History
                  </DialogTitle>
                </DialogHeader>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'rounded-br-md'
                          : 'rounded-bl-md'
                      }`}
                      style={{
                        background: message.role === 'user'
                          ? 'linear-gradient(135deg, rgba(143, 236, 120, 0.15) 0%, rgba(90, 201, 75, 0.15) 100%)'
                          : 'rgba(255, 255, 255, 0.06)',
                        border: message.role === 'user'
                          ? '1px solid rgba(143, 236, 120, 0.2)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <p className={`text-sm leading-relaxed ${
                        message.role === 'user' ? 'text-[#8FEC78]' : 'text-white/80'
                      }`}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={historyEndRef} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MeshGradientBackground>
  );
};

export default ChatPage;
