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
  Clock,
  Globe,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LANGUAGES = [
  { value: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { value: 'french', label: 'French', flag: '🇫🇷' },
  { value: 'german', label: 'German', flag: '🇩🇪' },
  { value: 'japanese', label: 'Japanese', flag: '🇯🇵' },
  { value: 'mandarin', label: 'Mandarin', flag: '🇨🇳' },
];

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
  const [chatSessionId, setChatSessionId] = useState(() => `chat-${sessionId}-${Date.now()}`);
  
  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const introCalledRef = useRef(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(`${API}/sessions/${sessionId}`);
        setSession(response.data);
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    
    // Add user message to chat
    if (!isIntro) {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      setChatInput('');
    }
    
    setIsChatting(true);
    
    try {
      const response = await axios.post(`${API}/chat-voice`, {
        message: message,
        session_id: chatSessionId
      }, { timeout: 30000 });
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      
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
  }, [isChatting, chatSessionId, playAudioFromBase64]);

  // Trigger intro message when session loads
  useEffect(() => {
    if (!session || introCalledRef.current) return;
    introCalledRef.current = true;
    
    const language = LANGUAGES.find(l => l.value === session.language)?.label || session.language;
    const introMessage = `Start a ${session.level} level ${language} learning session about "${session.title}". Introduce yourself briefly and begin the lesson.`;
    
    sendMessage(introMessage, true);
  }, [session, sendMessage]);

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

  // Get language info
  const getLanguageInfo = (languageValue) => {
    return LANGUAGES.find(l => l.value === languageValue) || { label: languageValue, flag: '🌐' };
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

  const language = getLanguageInfo(session?.language);

  return (
    <MeshGradientBackground>
      <div className="min-h-screen flex flex-col">
        {/* Hidden audio element */}
        <audio ref={audioRef} />
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <nav className="max-w-4xl mx-auto flex items-center justify-between">
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
                  <h1 className="text-white font-medium text-sm">{session?.title}</h1>
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <span>{language.flag} {language.label}</span>
                    <span>•</span>
                    <span className="capitalize">{session?.level}</span>
                  </div>
                </div>
              </div>
            </div>
            
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
          </nav>
        </header>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col pt-24 pb-32">
          <div className="flex-1 max-w-3xl mx-auto w-full px-6 overflow-y-auto">
            {/* Orb and initial state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <LiquidOrb isSpeaking={isSpeaking || isListening} />
                <div className="mt-6 text-center">
                  {isChatting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <p className="text-white/40">Starting your session...</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Messages */}
            {messages.length > 0 && (
              <div className="space-y-6 py-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-5 py-4 rounded-2xl ${
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
                
                {/* Typing indicator */}
                {isChatting && messages.length > 0 && (
                  <div className="flex justify-start">
                    <div
                      className="px-5 py-4 rounded-2xl rounded-bl-md"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input Area - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-3xl mx-auto">
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
        </div>
      </div>
    </MeshGradientBackground>
  );
};

export default ChatPage;
