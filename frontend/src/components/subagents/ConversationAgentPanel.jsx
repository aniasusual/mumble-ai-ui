/**
 * Conversation Agent Panel
 * 
 * Full-screen immersive conversation practice interface.
 * Designed for free-flowing voice conversation like a phone call.
 * 
 * Uses WebRTC for realtime audio conversation.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import LiquidOrb from '../LiquidOrb';
import MumbleLogo from '../MumbleLogo';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createConversationRealtimeSession,
  negotiateRealtime,
} from '../../services/agentService';

const ConversationAgentPanel = ({
  isOpen,
  onClose,
  jobId,
  user,
  context = {}, // Context from main agent (topic, level, target language, etc.)
}) => {
  // Conversation state
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const agentResponseRef = useRef('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sessionId, setSessionId] = useState(jobId);

  // WebRTC + audio refs
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Speech recognition for live transcript display
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = context.targetLanguage || user?.target_language || 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.log('Speech recognition error (non-critical):', event.error);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [context.targetLanguage, user?.target_language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRealtime();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const cleanupRealtime = useCallback(() => {
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch (e) {}
      dataChannelRef.current = null;
    }

    if (peerRef.current) {
      try {
        peerRef.current.close();
      } catch (e) {}
      peerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const setupAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });
      // Start muted; user explicitly enables mic
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      streamRef.current = stream;
      return true;
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Could not access microphone. Please check permissions.');
      return false;
    }
  };

  const sendRealtimeEvent = (payload) => {
    const dc = dataChannelRef.current;
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify(payload));
    }
  };

  const buildInitialPrompt = () => {
    const parts = [];
    const topic = context.topic || context.scenario || null;
    const targetLang = context.targetLanguage || user?.target_language || null;
    const level = context.level || user?.level || null;

    if (targetLang) parts.push(`Target language: ${targetLang}`);
    if (level) parts.push(`Level: ${level}`);
    if (topic) parts.push(`Topic: ${topic}`);

    if (parts.length > 0) {
      return `Let's practice conversation. ${parts.join(' | ')}`;
    }
    return "Let's practice conversation. Please start with a friendly greeting.";
  };

  const handleRealtimeEvent = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (
        data.type === 'response.text.delta' ||
        data.type === 'response.output_text.delta' ||
        data.type === 'response.output_text' ||
        data.type === 'response.output_text.delta'
      ) {
        const delta = data.delta || data.text || data.content || '';
        if (delta) {
          setAgentResponse((prev) => {
          const next = prev + delta;
          agentResponseRef.current = next;
          return next;
        });
        }
      }

      if (data.type === 'response.audio_transcript.delta') {
        const delta = data.delta || '';
        if (delta) {
          setAgentResponse((prev) => {
          const next = prev + delta;
          agentResponseRef.current = next;
          return next;
        });
        }
      }

      if (data.type === 'response.completed' || data.type === 'response.done') {
        setIsSpeaking(false);
        setConversationHistory((prev) => {
          const trimmed = agentResponseRef.current.trim();
          if (!trimmed) return prev;
          return [...prev, { role: 'assistant', content: trimmed }];
        });
        setAgentResponse('');
        agentResponseRef.current = '';
      }

      if (data.type === 'response.started') {
        setIsSpeaking(true);
      }
    } catch (e) {
      // Ignore non-JSON events
    }
  };

  const setupRealtimeConnection = async () => {
    const pc = new RTCPeerConnection();
    peerRef.current = pc;

    const localStream = streamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
        audioRef.current.play().catch(() => {});
      }
    };

    const dataChannel = pc.createDataChannel('oai-events');
    dataChannelRef.current = dataChannel;

    dataChannel.onmessage = handleRealtimeEvent;
    dataChannel.onopen = () => {
      const initialPrompt = buildInitialPrompt();
      sendRealtimeEvent({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: initialPrompt }],
        },
      });
      sendRealtimeEvent({
        type: 'response.create',
        response: {
          modalities: ['audio', 'text'],
        },
      });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpAnswer = await negotiateRealtime(offer.sdp);
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer }));
  };

  // Start conversation
  const startConversation = useCallback(async () => {
    const setupSuccess = await setupAudioStream();
    if (!setupSuccess) return;

    setIsActive(true);
    setIsProcessing(true);

    // Start speech recognition for live transcript
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }

    const sessionResp = await createConversationRealtimeSession(sessionId, user, context);
    if (!sessionResp.success) {
      toast.error(sessionResp.error || 'Failed to create realtime session');
      setIsProcessing(false);
      return;
    }

    if (sessionResp.sessionId) {
      setSessionId(sessionResp.sessionId);
    }

    try {
      await setupRealtimeConnection();
      setIsProcessing(false);
      setIsRecording(false);
    } catch (error) {
      console.error('Realtime connection error:', error);
      toast.error('Failed to establish realtime connection');
      setIsProcessing(false);
    }
  }, [sessionId, user, context]);

  // Auto-start conversation when panel opens
  useEffect(() => {
    if (isOpen && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startConversation();
    }

    if (!isOpen) {
      hasStartedRef.current = false;
    }
  }, [isOpen, startConversation]);

  // Toggle mic (mute/unmute)
  const toggleRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      toast.error('Microphone is not ready yet.');
      return;
    }

    const nextEnabled = !isRecording;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsRecording(nextEnabled);

    if (!nextEnabled) {
      // User finished speaking; request a response
      sendRealtimeEvent({
        type: 'response.create',
        response: {
          modalities: ['audio', 'text'],
        },
      });
    }
  }, [isRecording]);

  // End conversation
  const endConversation = useCallback(() => {
    setIsActive(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsSpeaking(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    cleanupRealtime();

    setAgentResponse('Great conversation! The main coach will review your progress.');
    agentResponseRef.current = 'Great conversation! The main coach will review your progress.';
  }, [cleanupRealtime]);

  const handleClose = () => {
    endConversation();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} />

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isActive
            ? 'radial-gradient(circle at 50% 40%, rgba(143, 236, 120, 0.08) 0%, rgba(0, 0, 0, 1) 70%)'
            : 'radial-gradient(circle at 50% 40%, rgba(74, 144, 217, 0.05) 0%, rgba(0, 0, 0, 1) 70%)',
          transition: 'background 0.5s ease-out',
        }}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 py-5">
        <nav className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MumbleLogo size={28} color="#ffffff" isAnimating={isSpeaking} />
            <div>
              <span className="font-medium text-white">Conversation Practice</span>
              {context.topic && (
                <p className="text-xs text-white/40 mt-0.5">{context.topic}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="h-full flex flex-col items-center justify-center px-6">
        {/* Orb container */}
        <div className="relative mb-8">
          <LiquidOrb isSpeaking={isSpeaking || isRecording} size="xlarge" />

          {/* Status indicator */}
          {isActive && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: isRecording
                    ? 'rgba(143, 236, 120, 0.15)'
                    : isSpeaking
                    ? 'rgba(74, 144, 217, 0.15)'
                    : isProcessing
                    ? 'rgba(251, 191, 36, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isRecording
                    ? '1px solid rgba(143, 236, 120, 0.3)'
                    : isSpeaking
                    ? '1px solid rgba(74, 144, 217, 0.3)'
                    : isProcessing
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {isRecording ? (
                  <>
                    <Mic size={14} className="text-[#8FEC78]" />
                    <span className="text-xs text-[#8FEC78]">Listening...</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-xs text-blue-400">Speaking...</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 size={14} className="text-amber-400 animate-spin" />
                    <span className="text-xs text-amber-400">Connecting...</span>
                  </>
                ) : (
                  <span className="text-xs text-white/40">Tap mic to speak</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Response/transcript display */}
        <div className="text-center max-w-2xl mx-auto mb-12 min-h-[120px]">
          {isActive ? (
            <>
              {currentTranscript && isRecording && (
                <p className="text-lg leading-relaxed mb-4" style={{ color: 'rgba(143, 236, 120, 0.8)' }}>
                  {currentTranscript}
                </p>
              )}
              {agentResponse && !currentTranscript && (
                <p className="text-xl leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  "{agentResponse}"
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              <Loader2 size={32} className="text-[#8FEC78] animate-spin" />
              <p className="text-white/60 text-lg">Starting conversation...</p>
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleRecording}
            disabled={!isActive}
            className="h-16 w-16 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
            style={{
              background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'rgba(143, 236, 120, 0.2)',
              border: isRecording ? '2px solid rgba(239, 68, 68, 0.5)' : '2px solid rgba(143, 236, 120, 0.5)',
              boxShadow: isRecording ? '0 0 30px rgba(239, 68, 68, 0.3)' : '0 0 30px rgba(143, 236, 120, 0.2)',
            }}
          >
            {isRecording ? (
              <MicOff size={24} className="text-red-400" />
            ) : (
              <Mic size={24} className="text-[#8FEC78]" />
            )}
          </button>

        </div>
      </main>

      {/* Conversation history (minimized) */}
      {isActive && conversationHistory.length > 0 && (
        <div className="absolute bottom-6 left-6 right-6">
          <div
            className="max-w-2xl mx-auto p-4 rounded-2xl max-h-32 overflow-y-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Conversation</p>
            <div className="space-y-2">
              {conversationHistory.slice(-4).map((msg, idx) => (
                <p
                  key={idx}
                  className="text-sm"
                  style={{
                    color: msg.role === 'user' ? 'rgba(143, 236, 120, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <span className="text-white/30 mr-2">
                    {msg.role === 'user' ? 'You:' : 'Agent:'}
                  </span>
                  {msg.content}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationAgentPanel;
