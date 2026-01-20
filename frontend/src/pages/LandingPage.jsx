import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import LiquidOrb from '../components/LiquidOrb';
import MumbleLogo from '../components/MumbleLogo';
import { welcomeConfig, appInfo } from '../data/mock';
import { ArrowRight, Volume2, VolumeX, Check } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  // Fallback to Web Speech API
  const speakWithWebSpeech = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (femaleVoice) utterance.voice = femaleVoice;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setHasPlayed(true);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setHasPlayed(true);
      };
      
      window.speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  }, []);

  // Generate speech using backend TTS API with fallback
  const generateSpeech = useCallback(async (text) => {
    try {
      setAudioLoading(true);
      const response = await axios.post(`${API}/tts`, {
        text: text,
        voice: welcomeConfig.voice,
        speed: welcomeConfig.speed
      }, {
        responseType: 'blob',
        timeout: 10000 // 10 second timeout
      });
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } catch (error) {
      console.log('TTS API unavailable, using fallback');
      return null;
    } finally {
      setAudioLoading(false);
    }
  }, []);

  // Play welcome audio
  const playWelcome = useCallback(async () => {
    if (hasPlayed || isMuted || audioLoading) return;
    
    const audioUrl = await generateSpeech(welcomeConfig.introMessage);
    
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        setHasPlayed(true);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        // Fallback to Web Speech
        speakWithWebSpeech(welcomeConfig.introMessage);
      };
      
      try {
        await audioRef.current.play();
      } catch (e) {
        // Autoplay blocked - try Web Speech as it may work on user gesture
        console.log('Autoplay blocked');
      }
    } else {
      // Fallback to Web Speech API
      speakWithWebSpeech(welcomeConfig.introMessage);
    }
  }, [hasPlayed, isMuted, audioLoading, generateSpeech, speakWithWebSpeech]);

  // Initialize page
  useEffect(() => {
    setIsLoaded(true);
    
    // Load voices for fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    
    const timer = setTimeout(() => {
      playWelcome();
    }, welcomeConfig.delay);
    
    return () => {
      clearTimeout(timer);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [playWelcome]);

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsMuted(!isMuted);
  };

  // Replay welcome
  const replayWelcome = async () => {
    if (isMuted || audioLoading) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setHasPlayed(false);
    
    const audioUrl = await generateSpeech(welcomeConfig.introMessage);
    
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        speakWithWebSpeech(welcomeConfig.introMessage);
      };
      
      try {
        await audioRef.current.play();
      } catch (e) {
        speakWithWebSpeech(welcomeConfig.introMessage);
      }
    } else {
      speakWithWebSpeech(welcomeConfig.introMessage);
    }
  };

  // Handle waitlist submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await axios.post(`${API}/waitlist`, { email });
      setIsSubmitted(true);
      toast.success("You're in. We'll reach out soon.");
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info("You're already on the list.");
      } else {
        toast.error('Something went wrong. Try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`min-h-screen flex flex-col transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: '#000000' }}
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
        </nav>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16">
        {/* Liquid Orb */}
        <div 
          className="mb-12 cursor-pointer"
          onClick={replayWelcome}
          title="Click to hear Mia"
        >
          <LiquidOrb isSpeaking={isSpeaking} />
        </div>

        {/* Minimal Text */}
        <div className="text-center max-w-md mx-auto mb-12">
          <h1 
            className="font-semibold mb-3"
            style={{ 
              color: '#ffffff',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              lineHeight: '1.15',
              letterSpacing: '-0.03em',
            }}
          >
            {appInfo.tagline}
          </h1>
          <p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
              lineHeight: '1.5',
            }}
          >
            {appInfo.description}
          </p>
        </div>

        {/* Waitlist Form */}
        <div className="w-full max-w-sm">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="h-12 px-5 rounded-full text-white placeholder:text-white/30 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Join waitlist
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <div 
              className="flex items-center justify-center gap-3 py-4 px-6 rounded-full"
              style={{
                background: 'rgba(143, 236, 120, 0.1)',
                border: '1px solid rgba(143, 236, 120, 0.2)',
              }}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#8FEC78' }}
              >
                <Check size={14} color="#000" />
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
                You're in. We'll be in touch.
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 px-6 text-center">
        <p 
          className="text-xs"
          style={{ color: 'rgba(255, 255, 255, 0.2)' }}
        >
          © {new Date().getFullYear()} mumble
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
