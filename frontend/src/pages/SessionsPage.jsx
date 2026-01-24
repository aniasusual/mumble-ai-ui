import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
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
  DialogFooter,
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
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
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
      year: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <MeshGradientBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <nav 
            className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-5 py-3"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <MumbleLogo size={32} color="#ffffff" />
              <span className="font-semibold text-lg text-white">mumble</span>
            </div>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                      color: '#000',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-white/80 text-sm hidden sm:block">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-white/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56"
                style={{
                  background: 'rgba(20, 20, 20, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/50">{user?.email}</p>
                </div>
                <DropdownMenuItem 
                  onClick={() => setShowProfileModal(true)}
                  className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowSettingsModal(true)}
                  className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pt-28 pb-12">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Your Sessions
                </h1>
                <p className="text-white/50">
                  Continue learning or start a new session
                </p>
              </div>
              
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 h-11 px-5 rounded-xl font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                  color: '#000',
                }}
              >
                <Plus className="w-5 h-5" />
                New Session
              </Button>
            </div>

            {/* Sessions Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div 
                className="text-center py-20 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white/80 mb-2">
                  No sessions yet
                </h3>
                <p className="text-white/40 mb-6">
                  Create your first learning session to get started
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="h-11 px-6 rounded-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                    color: '#000',
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Session
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => {
                  const language = getLanguageInfo(session.language);
                  return (
                    <div
                      key={session.id}
                      className="group relative p-5 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {/* Session Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all">
                            <MoreVertical className="w-4 h-4 text-white/50" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          style={{
                            background: 'rgba(20, 20, 20, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <DropdownMenuItem
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Language Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{language.flag}</span>
                        <span className="text-sm text-white/60">{language.label}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-white mb-2 pr-8">
                        {session.title}
                      </h3>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-white/40">
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          <span className="capitalize">{session.level}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.duration_minutes} min</span>
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-white/30 mt-3">
                        Created {formatDate(session.created_at)}
                      </p>
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
            className="sm:max-w-md"
            style={{
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Create New Session</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateSession} className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">Session Title</label>
                <Input
                  placeholder="e.g., Restaurant Conversations"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="h-11 rounded-xl text-white placeholder:text-white/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-2 block">Language</label>
                <Select
                  value={newSession.language}
                  onValueChange={(value) => setNewSession({ ...newSession, language: value })}
                >
                  <SelectTrigger 
                    className="h-11 rounded-xl text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: 'rgba(20, 20, 20, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="text-white">
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
                  <label className="text-sm text-white/60 mb-2 block">Level</label>
                  <Select
                    value={newSession.level}
                    onValueChange={(value) => setNewSession({ ...newSession, level: value })}
                  >
                    <SelectTrigger 
                      className="h-11 rounded-xl text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: 'rgba(20, 20, 20, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value} className="text-white">
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Duration</label>
                  <Select
                    value={newSession.duration_minutes.toString()}
                    onValueChange={(value) => setNewSession({ ...newSession, duration_minutes: parseInt(value) })}
                  >
                    <SelectTrigger 
                      className="h-11 rounded-xl text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: 'rgba(20, 20, 20, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()} className="text-white">
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="h-10 px-5 rounded-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                    color: '#000',
                  }}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Session'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent
            className="sm:max-w-md"
            style={{
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Profile</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                    color: '#000',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user?.name}</h3>
                  <p className="text-white/50">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Name</label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="h-11 rounded-xl text-white/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="h-11 rounded-xl text-white/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
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
            className="sm:max-w-md"
            style={{
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Settings</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Preferences</h4>
                <div 
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <p className="text-white/50 text-sm">
                    More settings coming soon...
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Account</h4>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MeshGradientBackground>
  );
};

export default SessionsPage;
