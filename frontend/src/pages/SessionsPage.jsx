import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Plus,
  User,
  Settings,
  LogOut,
  Clock,
  Globe,
  BookOpen,
  MoreVertical,
  Trash2,
  Loader2,
  ChevronDown,
  Play,
  Sparkles,
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

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

const SessionsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // New session form
  const [newSession, setNewSession] = useState({
    title: '',
    language: 'spanish',
    level: 'beginner',
    duration_minutes: 30,
  });

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/signin');
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Create new session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    if (!newSession.title.trim()) {
      toast.error('Please enter a session title');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await axios.post(`${API}/sessions`, newSession);
      setSessions([response.data, ...sessions]);
      setShowCreateModal(false);
      setNewSession({
        title: '',
        language: 'spanish',
        level: 'beginner',
        duration_minutes: 30,
      });
      toast.success('Session created!');
      // Navigate to chat page
      navigate(`/sessions/${response.data.id}/chat`);
    } catch (error) {
      toast.error('Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API}/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session deleted');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  // Get language info
  const getLanguageInfo = (languageValue) => {
    return LANGUAGES.find(l => l.value === languageValue) || { label: languageValue, flag: '🌐' };
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusStyles = (status) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(143, 236, 120, 0.15)', color: '#8FEC78', border: 'rgba(143, 236, 120, 0.3)' };
      case 'completed':
        return { bg: 'rgba(74, 144, 217, 0.15)', color: '#4A90D9', border: 'rgba(74, 144, 217, 0.3)' };
      case 'paused':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBB724', border: 'rgba(251, 191, 36, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  return (
    <MeshGradientBackground>
      <div className="min-h-screen flex flex-col">
        {/* Seamless Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
          <nav className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MumbleLogo size={36} color="#ffffff" />
              <span className="font-semibold text-xl text-white">mumble</span>
            </div>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.3) 0%, rgba(90, 201, 75, 0.3) 100%)',
                      border: '1px solid rgba(143, 236, 120, 0.4)',
                      color: '#8FEC78',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-white/80 text-sm hidden sm:block">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 mt-2 p-2 rounded-xl border-0"
                style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div className="px-3 py-3 mb-2">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">{user?.email}</p>
                </div>
                <DropdownMenuItem 
                  onClick={() => setShowProfileModal(true)}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer py-2.5"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowSettingsModal(true)}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer py-2.5"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10 my-2" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer py-2.5"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pt-28 pb-12">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Your Sessions
                </h1>
                <p className="text-white/40">
                  Continue learning or start a new session
                </p>
              </div>
              
              {/* New Session Button - Pill glow style */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.15) 0%, rgba(90, 201, 75, 0.15) 100%)',
                  color: '#8FEC78',
                  border: '1px solid rgba(143, 236, 120, 0.3)',
                  boxShadow: '0 0 30px rgba(143, 236, 120, 0.15)',
                }}
              >
                <Plus className="w-5 h-5" />
                New Session
              </button>
            </div>

            {/* Sessions Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              /* Empty State - Seamless */
              <div className="text-center py-24">
                <div 
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <BookOpen className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-2xl font-semibold text-white/80 mb-3">
                  No sessions yet
                </h3>
                <p className="text-white/40 mb-8 max-w-sm mx-auto">
                  Create your first learning session and start your language journey with Mia
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.15) 0%, rgba(90, 201, 75, 0.15) 100%)',
                    color: '#8FEC78',
                    border: '1px solid rgba(143, 236, 120, 0.3)',
                    boxShadow: '0 0 40px rgba(143, 236, 120, 0.2)',
                  }}
                >
                  Create Your First Session
                </button>
              </div>
            ) : (
              /* Sessions Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sessions.map((session) => {
                  const language = getLanguageInfo(session.language);
                  const statusStyles = getStatusStyles(session.status);
                  return (
                    <div
                      key={session.id}
                      className="group relative p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {/* Session Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all">
                            <MoreVertical className="w-4 h-4 text-white/50" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl border-0 p-2"
                          style={{
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(20px)',
                          }}
                        >
                          <DropdownMenuItem
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer py-2.5"
                          >
                            <Trash2 className="w-4 h-4 mr-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Language & Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{language.flag}</span>
                          <span className="text-sm text-white/50">{language.label}</span>
                        </div>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: statusStyles.bg,
                            color: statusStyles.color,
                            border: `1px solid ${statusStyles.border}`,
                          }}
                        >
                          {session.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-white mb-4 pr-8">
                        {session.title}
                      </h3>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-white/30 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-4 h-4" />
                          <span className="capitalize">{session.level}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{session.duration_minutes} min</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <p className="text-xs text-white/25">
                          {formatDate(session.created_at)}
                        </p>
                        <button 
                          className="flex items-center gap-1.5 text-xs font-medium text-[#8FEC78] hover:text-[#a5f08f] transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Continue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Create Session Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent
            className="sm:max-w-md border-0 p-0 overflow-hidden"
            style={{
              background: 'transparent',
            }}
          >
            <div 
              className="p-8"
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(40px)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white text-center mb-6">
                  Create New Session
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateSession} className="space-y-5">
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Session Title</label>
                  <Input
                    placeholder="e.g., Restaurant Conversations"
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    className="h-14 rounded-2xl text-white placeholder:text-white/25 border-0 focus-visible:ring-1 focus-visible:ring-[#8FEC78]/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Language</label>
                  <Select
                    value={newSession.language}
                    onValueChange={(value) => setNewSession({ ...newSession, language: value })}
                  >
                    <SelectTrigger 
                      className="h-14 rounded-2xl text-white border-0"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="rounded-xl border-0"
                      style={{
                        background: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-white hover:bg-white/10 rounded-lg">
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/50 mb-2 block">Level</label>
                    <Select
                      value={newSession.level}
                      onValueChange={(value) => setNewSession({ ...newSession, level: value })}
                    >
                      <SelectTrigger 
                        className="h-14 rounded-2xl text-white border-0"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        className="rounded-xl border-0"
                        style={{
                          background: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(20px)',
                        }}
                      >
                        {LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value} className="text-white hover:bg-white/10 rounded-lg">
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/50 mb-2 block">Duration</label>
                    <Select
                      value={newSession.duration_minutes.toString()}
                      onValueChange={(value) => setNewSession({ ...newSession, duration_minutes: parseInt(value) })}
                    >
                      <SelectTrigger 
                        className="h-14 rounded-2xl text-white border-0"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        className="rounded-xl border-0"
                        style={{
                          background: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(20px)',
                        }}
                      >
                        {DURATIONS.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value.toString()} className="text-white hover:bg-white/10 rounded-lg">
                            {duration.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-14 rounded-full font-medium transition-all duration-300 hover:bg-white/10"
                    style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 h-14 rounded-full font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.15) 0%, rgba(90, 201, 75, 0.15) 100%)',
                      color: '#8FEC78',
                      border: '1px solid rgba(143, 236, 120, 0.3)',
                      boxShadow: '0 0 30px rgba(143, 236, 120, 0.2)',
                    }}
                  >
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Create Session'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent
            className="sm:max-w-md border-0 p-0 overflow-hidden"
            style={{
              background: 'transparent',
            }}
          >
            <div 
              className="p-8"
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(40px)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white text-center mb-8">
                  Profile
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col items-center mb-8">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-semibold mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.2) 0%, rgba(90, 201, 75, 0.2) 100%)',
                    border: '2px solid rgba(143, 236, 120, 0.4)',
                    color: '#8FEC78',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="text-xl font-semibold text-white">{user?.name}</h3>
                <p className="text-white/40 text-sm">{user?.email}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Name</label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="h-14 rounded-2xl text-white/50 border-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="h-14 rounded-2xl text-white/50 border-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                    }}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
          <DialogContent
            className="sm:max-w-md border-0 p-0 overflow-hidden"
            style={{
              background: 'transparent',
            }}
          >
            <div 
              className="p-8"
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(40px)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white text-center mb-8">
                  Settings
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3">Preferences</h4>
                  <div 
                    className="p-5 rounded-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <p className="text-white/40 text-sm">
                      More settings coming soon...
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3">Account</h4>
                  <button
                    onClick={handleLogout}
                    className="w-full h-14 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MeshGradientBackground>
  );
};

export default SessionsPage;
