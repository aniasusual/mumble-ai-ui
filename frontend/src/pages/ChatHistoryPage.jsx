import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatHistoryPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(`${API}/sessions/${sessionId}`);
        setSession(response.data);
        if (response.data.chat_history) {
          setMessages(response.data.chat_history);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        toast.error('Session not found');
        navigate('/sessions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSession();
  }, [sessionId, navigate]);

  if (isLoading) {
    return (
      <MeshGradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      </MeshGradientBackground>
    );
  }

  return (
    <MeshGradientBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
          <nav className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/sessions/${sessionId}/chat`}
                className="p-2 -ml-2 rounded-full transition-all hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </Link>
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <MumbleLogo size={32} color="#ffffff" />
                <span className="font-medium text-lg text-white">mumble</span>
              </Link>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pt-28 pb-12">
          <div className="max-w-2xl mx-auto">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-white mb-1">
                Chat History
              </h1>
              <p className="text-white/40 text-sm">
                {session?.title || 'New Session'}
              </p>
            </div>

            {/* Messages */}
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/30">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[85%]">
                      {/* Label */}
                      <p className={`text-xs mb-2 ${message.role === 'user' ? 'text-right text-white/30' : 'text-white/30'}`}>
                        {message.role === 'user' ? 'You' : 'Mia'}
                      </p>
                      
                      {/* Message Bubble */}
                      <div
                        className={`px-5 py-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'rounded-br-md'
                            : 'rounded-bl-md'
                        }`}
                        style={{
                          background: message.role === 'user'
                            ? 'rgba(143, 236, 120, 0.08)'
                            : 'rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        <p className={`text-sm leading-relaxed ${
                          message.role === 'user' ? 'text-[#8FEC78]/90' : 'text-white/70'
                        }`}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back to Chat Button */}
            <div className="mt-12 text-center">
              <Link
                to={`/sessions/${sessionId}/chat`}
                className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                style={{ color: '#8FEC78' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to chat
              </Link>
            </div>
          </div>
        </main>
      </div>
    </MeshGradientBackground>
  );
};

export default ChatHistoryPage;
