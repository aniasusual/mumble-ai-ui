import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import LiquidOrb from '../components/LiquidOrb';
import MumbleLogo from '../components/MumbleLogo';
import { welcomeConfig, mockWaitlistData, appInfo } from '../data/mock';
import { ArrowRight, Volume2, VolumeX, Check } from 'lucide-react';
import { toast } from 'sonner';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Speak welcome message using Web Speech API
  const speakWelcome = useCallback(() => {
    if ('speechSynthesis' in window && !hasPlayed && !isMuted) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(welcomeConfig.message);
      utterance.rate = welcomeConfig.rate;
      utterance.pitch = welcomeConfig.pitch;
      
      // Find a good voice (prefer English voices)
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
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
    }
  }, [hasPlayed, isMuted]);

  // Load voices and trigger welcome on mount
  useEffect(() => {
    setIsLoaded(true);
    
    // Voices may not be immediately available
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Play welcome after a brief delay
    const timer = setTimeout(() => {
      speakWelcome();
    }, welcomeConfig.delay);
    
    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [speakWelcome]);

  // Toggle mute
  const toggleMute = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  // Replay welcome message
  const replayWelcome = () => {
    if (!isMuted) {
      setHasPlayed(false);
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(welcomeConfig.message);
        utterance.rate = welcomeConfig.rate;
        utterance.pitch = welcomeConfig.pitch;
        
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  };

  // Handle waitlist submission (mock)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if email already exists (mock)
    if (mockWaitlistData.checkEmail(email)) {
      toast.info("You're already on the waitlist!");
      setIsSubmitting(false);
      return;
    }
    
    // Add to mock waitlist
    mockWaitlistData.addToWaitlist(email);
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("You're on the list! We'll be in touch soon.");
  };

  return (
    <div 
      className={`min-h-screen flex flex-col transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: `
          radial-gradient(at 20% 80%, rgba(143, 236, 120, 0.08) 0px, transparent 50%),
          radial-gradient(at 80% 20%, rgba(74, 144, 217, 0.06) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(34, 211, 238, 0.03) 0px, transparent 60%),
          #FFFFFF
        `
      }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 md:mx-6 mt-4 md:mt-6">
          <nav 
            className="flex items-center justify-between px-4 md:px-6 py-3 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '0.5px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="flex items-center gap-2">
              <MumbleLogo size={36} color="#8FEC78" />
              <span 
                className="font-semibold text-lg"
                style={{ color: 'rgb(0, 55, 32)' }}
              >
                Mumble AI
              </span>
            </div>
            
            <button
              onClick={toggleMute}
              className="p-2 rounded-full transition-all hover:bg-black/5"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX size={20} style={{ color: 'rgb(131, 146, 140)' }} />
              ) : (
                <Volume2 size={20} style={{ color: 'rgb(0, 55, 32)' }} />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        {/* Liquid Orb */}
        <div 
          className="mb-8 cursor-pointer"
          onClick={replayWelcome}
          title="Click to hear welcome message"
        >
          <LiquidOrb isSpeaking={isSpeaking} />
        </div>

        {/* Text Content */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <h1 
            className="font-bold mb-4"
            style={{ 
              color: 'rgb(0, 55, 32)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
            }}
          >
            {appInfo.tagline}
          </h1>
          <p 
            className="mb-2"
            style={{ 
              color: 'rgb(131, 146, 140)',
              fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
              lineHeight: '1.5',
            }}
          >
            {appInfo.subtitle}
          </p>
          <p 
            className="text-sm"
            style={{ 
              color: 'rgb(175, 183, 180)',
              maxWidth: '400px',
              margin: '0 auto',
            }}
          >
            {appInfo.description}
          </p>
        </div>

        {/* Waitlist Form */}
        <div className="w-full max-w-md">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 h-12 px-5 rounded-full border-gray-200 focus:border-green-300 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 rounded-full font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(to bottom right, #8FEC78, #81DD67)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Join Waitlist
                    <ArrowRight size={18} />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <div 
              className="flex items-center justify-center gap-3 py-4 px-6 rounded-full"
              style={{
                background: 'rgba(143, 236, 120, 0.1)',
                border: '1px solid rgba(143, 236, 120, 0.3)',
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#8FEC78' }}
              >
                <Check size={18} color="white" />
              </div>
              <span style={{ color: 'rgb(0, 55, 32)', fontWeight: 500 }}>
                You're on the list! We'll be in touch.
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center">
        <p 
          className="text-sm"
          style={{ color: 'rgb(175, 183, 180)' }}
        >
          © {new Date().getFullYear()} Mumble AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
