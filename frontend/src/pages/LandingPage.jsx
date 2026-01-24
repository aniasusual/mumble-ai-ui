import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import LiquidOrb from '../components/LiquidOrb';
import MumbleLogo from '../components/MumbleLogo';
import MeshGradientBackground from '../components/MeshGradientBackground';
import { useAuth } from '../context/AuthContext';
import { miaConfig, appInfo, suggestedQuestions } from '../data/mock';
import { ArrowRight, Send, Mic, Volume2, VolumeX, Play, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  
  // Entry gate state - user must click to enable audio
  const [hasEntered, setHasEntered] = useState(false);
  
  // Chat states
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}`);
  const [currentResponse, setCurrentResponse] = useState('');
  
  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const introCalledRef = useRef(false);

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
          toast.error('Microphone access denied. Please allow microphone access.');
        } else if (event.error !== 'aborted') {
          toast.error('Voice input error. Try again.');
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

  // Send message to Mia and get voice response
  const sendMessage = useCallback(async (message, isIntro = false) => {
    if (!message.trim() || isChatting) return;
    
    setIsChatting(true);
    setCurrentResponse('');
    if (!isIntro) setChatInput('');
    
    try {
      const response = await axios.post(`${API}/chat-voice`, {
        message: message,
        session_id: sessionId
      }, { timeout: 30000 });
      
      setCurrentResponse(response.data.response);
      setSessionId(response.data.session_id);
      
      if (response.data.audio) {
        playAudioFromBase64(response.data.audio);
      }
    } catch (error) {
      console.error('Chat error:', error);
      if (!isIntro) {
        toast.error('Mia is thinking... try again!');
      }
    } finally {
      setIsChatting(false);
    }
  }, [isChatting, sessionId, playAudioFromBase64]);

  // Trigger intro after user clicks "Enter" button
  useEffect(() => {
    if (!hasEntered) return;
    
    // Prevent double call in strict mode
    if (introCalledRef.current) return;
    introCalledRef.current = true;
    
    const introduceAI = async () => {
      console.log('Starting AI intro...');
      setIsChatting(true);
      
      try {
        const response = await axios.post(`${API}/chat-voice`, {
          message: "Introduce yourself briefly as Mia, the AI language tutor for Mumble",
          session_id: sessionId
        }, { timeout: 30000 });
        
        console.log('AI intro response received:', response.data.response);
        setCurrentResponse(response.data.response);
        setSessionId(response.data.session_id);
        
        // Play intro audio - will work because user already interacted
        if (response.data.audio && audioRef.current) {
          const audioSrc = `data:audio/mpeg;base64,${response.data.audio}`;
          audioRef.current.src = audioSrc;
          audioRef.current.onplay = () => setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onerror = () => setIsSpeaking(false);
          
          try {
            await audioRef.current.play();
          } catch (e) {
            console.log('Audio play error:', e.message);
          }
        }
      } catch (error) {
        console.error('Intro error:', error);
      } finally {
        setIsChatting(false);
      }
    };
    
    // Start intro after a small delay to ensure smooth transition
    setTimeout(introduceAI, 300);
  }, [hasEntered, sessionId]);

  // Set loaded state
  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

  // Send message when user stops speaking
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

  // Handle suggested question click
  const handleSuggestionClick = (question) => {
    sendMessage(question);
  };

  // Handle entering the experience
  const handleEnter = () => {
    setHasEntered(true);
  };

  // Entry Gate Screen - minimal and elegant
  if (!hasEntered) {
    return (
      <MeshGradientBackground>
        <div 
          className={`min-h-screen flex flex-col items-center justify-center transition-opacity duration-1000 px-6 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Logo and brand */}
          <div className="flex items-center gap-3 mb-8">
            <MumbleLogo size={48} color="#ffffff" />
            <span 
              className="font-medium text-2xl tracking-tight"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {appInfo.name}
            </span>
          </div>
          
          {/* Tagline */}
          <h1 
            className="text-center mb-3 font-semibold"
            style={{ 
              color: '#ffffff',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              lineHeight: '1.2',
              letterSpacing: '-0.02em',
            }}
          >
            {appInfo.tagline}
          </h1>
          
          <p 
            className="text-center mb-10 max-w-md"
            style={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '1rem',
            }}
          >
            Meet Mia, your AI language tutor
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Enter button - to try the demo */}
            <div className="relative">
              {/* Subtle pulsing glow behind button */}
              <div 
                className="absolute inset-0 rounded-full opacity-60"
                style={{
                  background: 'radial-gradient(circle, rgba(143, 236, 120, 0.3) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  animation: 'pulse 2.5s ease-in-out infinite',
                }}
              />
              <button
                onClick={handleEnter}
                className="relative flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                  color: '#000',
                  boxShadow: '0 0 20px rgba(143, 236, 120, 0.3)',
                }}
              >
                <Play size={16} fill="#000" />
                <span>Try Demo</span>
              </button>
            </div>
            
            {/* Sign In / Go to Sessions button */}
            {isAuthenticated ? (
              <Link
                to="/sessions"
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <span>Go to Sessions</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to="/signin"
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
          
          <p 
            className="mt-6 text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.25)' }}
          >
            tap "Try Demo" to enable audio experience
          </p>
        </div>
        
        {/* CSS Animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.1); }
          }
        `}</style>
      </MeshGradientBackground>
    );
  }

  return (
    <MeshGradientBackground>
      <div 
        className={`min-h-screen flex flex-col transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Hidden audio element */}
        <audio ref={audioRef} />
        
        {/* Minimal Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
          <nav className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <MumbleLogo size={32} color="#ffffff" isAnimating={isSpeaking} />
              <span 
                className="font-medium text-base tracking-tight"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                {appInfo.name}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full transition-all hover:bg-white/5"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX size={18} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                ) : (
                  <Volume2 size={18} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                )}
              </button>
              
              {isAuthenticated ? (
                <Link
                  to="/sessions"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Sessions
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                    color: '#000',
                  }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-8">
          {/* Liquid Orb */}
          <div className="mb-6">
            <LiquidOrb isSpeaking={isSpeaking || isListening} />
          </div>

          {/* Response Display */}
          <div className="text-center max-w-md mx-auto mb-6 min-h-[60px]">
            {isListening ? (
              <p 
                className="text-base leading-relaxed animate-pulse"
                style={{ color: 'rgba(143, 236, 120, 0.8)' }}
              >
                {chatInput || "Listening..."}
              </p>
            ) : currentResponse ? (
              <p 
                className="text-base leading-relaxed"
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
              <>
                <h1 
                  className="font-semibold mb-2"
                  style={{ 
                    color: '#ffffff',
                    fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                    lineHeight: '1.2',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {appInfo.tagline}
                </h1>
                <p 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.95rem',
                  }}
                >
                  {appInfo.description}
                </p>
              </>
            )}
          </div>

          {/* Chat Input with Mic Button */}
          <div className="w-full max-w-md mb-6">
            <form onSubmit={handleChatSubmit} className="relative flex gap-2">
              {/* Microphone Button */}
              <button
                type="button"
                onClick={isListening ? handleVoiceSend : toggleListening}
                disabled={isChatting}
                className={`h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'hover:bg-white/10'
                } disabled:opacity-30`}
                style={{
                  background: isListening ? '#8FEC78' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                title={isListening ? 'Send voice message' : 'Start voice input'}
              >
                {isListening ? (
                  <Send size={18} style={{ color: '#000' }} />
                ) : (
                  <Mic size={18} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                )}
              </button>
              
              {/* Text Input */}
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder={isListening ? "Listening..." : "Ask Mia anything..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatting || isListening}
                  className="h-12 pl-5 pr-12 rounded-full text-white placeholder:text-white/30 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: isListening 
                      ? '1px solid rgba(143, 236, 120, 0.5)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
                <button
                  type="submit"
                  disabled={isChatting || !chatInput.trim() || isListening}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all hover:bg-white/10 disabled:opacity-30"
                >
                  {isChatting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  )}
                </button>
              </div>
            </form>
            
            {/* Suggested Questions */}
            <div className="w-full mt-3 max-w-lg mx-auto">
              <p 
                className="text-center text-xs mb-3"
                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                Ask Mia
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    disabled={isChatting || isListening}
                    className="px-3 py-1.5 text-xs rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30"
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section - Sign In/Up or Go to Sessions */}
          <div className="w-full max-w-md">
            <div 
              className="relative p-6 rounded-2xl text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {isAuthenticated ? (
                <>
                  <p className="text-white/70 mb-4">
                    Ready to continue your learning journey?
                  </p>
                  <Link
                    to="/sessions"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                      color: '#000',
                    }}
                  >
                    Go to Sessions
                    <ArrowRight size={18} />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-white/70 mb-4">
                    Ready to start your language learning journey?
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/signup"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                        color: '#000',
                      }}
                    >
                      Get Started
                      <ArrowRight size={18} />
                    </Link>
                    <Link
                      to="/signin"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:bg-white/10"
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      Sign In
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="py-4 px-6 text-center">
          <p 
            className="text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            © {new Date().getFullYear()} mumble
          </p>
        </footer>
      </div>
    </MeshGradientBackground>
  );
};

export default LandingPage;
