import React, { useEffect, useRef, useState } from 'react';
import { Mic, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../ui/input';

const VARIANTS = {
  main: {
    buttonHeight: 'h-14',
    buttonWidth: '56px',
    expandedWidth: 'calc(100% - 68px)',
    iconSize: 20,
    sendSize: 20,
    inputHeight: 'h-14',
    inputPadding: 'pl-5 pr-14',
    pulseBars: 5,
  },
  sheet: {
    buttonHeight: 'h-12',
    buttonWidth: '48px',
    expandedWidth: 'calc(100% - 60px)',
    iconSize: 18,
    sendSize: 18,
    inputHeight: 'h-12',
    inputPadding: 'pl-4 pr-12',
    pulseBars: 4,
  },
};

const VoiceInput = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Type your message...',
  variant = 'main',
  onStartListening,
  onStopListening,
}) => {
  const config = VARIANTS[variant] || VARIANTS.main;
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

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
          .map((result) => result[0].transcript)
          .join('');

        onChange(transcript);

        if (event.results[0].isFinal) {
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onStopListening?.();
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        onStopListening?.();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onChange, onStopListening]);

  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      onStopListening?.();
      return;
    }

    onStartListening?.();
    onChange('');
    setIsListening(true);

    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setIsListening(false);
      onStopListening?.();
    }
  };

  const handleVoiceSend = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      onChange('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    onChange('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center w-full">
      <button
        type="button"
        onClick={isListening ? handleVoiceSend : toggleListening}
        disabled={disabled}
        className={`${config.buttonHeight} rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 ease-out disabled:opacity-30 overflow-hidden flex-shrink-0`}
        style={{
          width: isListening ? config.expandedWidth : config.buttonWidth,
          flex: isListening ? '1 1 auto' : `0 0 ${config.buttonWidth}`,
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
            <Mic size={config.iconSize} className="text-[#8FEC78]" />
            <div className="flex items-center gap-1">
              {Array.from({ length: config.pulseBars }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 bg-[#8FEC78] rounded-full animate-pulse"
                  style={{
                    height: i % 2 === 0 ? '12px' : '18px',
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
            <span className="text-[#8FEC78] text-xs font-medium ml-2">Tap to send</span>
            <Send size={config.sendSize} className="text-[#8FEC78] ml-auto mr-2" />
          </>
        ) : (
          <Mic size={config.iconSize} className="text-white/50" />
        )}
      </button>

      <div
        className="relative transition-all duration-500 ease-out"
        style={{
          flex: isListening ? `0 0 ${config.buttonWidth}` : '1 1 auto',
          width: isListening ? config.buttonWidth : 'auto',
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
              onStopListening?.();
            }}
            className={`${config.buttonHeight} rounded-2xl flex items-center justify-center transition-all duration-300`}
            style={{
              width: config.buttonWidth,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Send size={config.sendSize} className="text-white/30" />
          </button>
        ) : (
          <>
            <Input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              disabled={disabled}
              className={`${config.inputHeight} ${config.inputPadding} rounded-2xl text-white placeholder:text-white/25 transition-all duration-300 border-0 focus-visible:ring-1 focus-visible:ring-[#8FEC78]/50`}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            />
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all hover:bg-white/10 disabled:opacity-30"
            >
              <Send size={config.sendSize} className="text-white/40" />
            </button>
          </>
        )}
      </div>
    </form>
  );
};

export default VoiceInput;
