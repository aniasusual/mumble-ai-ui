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
  Plus,
  User,
  Settings,
  LogOut,
  BookOpen,
  MoreHorizontal,
  Trash2,
  Loader2,
  ChevronRight,
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

const SessionsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  // Create new session instantly
  const handleCreateSession = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    try {
      const response = await axios.post(`${API}/sessions`, {});
      setSessions([response.data, ...sessions]);
      navigate(`/sessions/${response.data.id}/chat`);
    } catch (error) {
      toast.error('Failed to create session');
      setIsCreating(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
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
    return LANGUAGES.find(l => l.value === languageValue) || null;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <MeshGradientBackground>
      <div className="min-h-screen flex flex-col">
        {/* Minimal Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
          <nav className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MumbleLogo size={32} color="#ffffff" />
              <span className="font-medium text-lg text-white">mumble</span>
            </div>
            
            {/* Minimal Profile Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-48 mt-2 p-1.5 rounded-xl border-0"
                style={{
                  background: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/40 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={() => setShowProfileModal(true)}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer text-sm py-2"
                >
                  <User className="w-4 h-4 mr-2.5" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowSettingsModal(true)}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer text-sm py-2"
                >
                  <Settings className="w-4 h-4 mr-2.5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer text-sm py-2"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pt-28 pb-12">
          <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-semibold text-white">
                Sessions
              </h1>
              
              {/* Minimal New Session Button */}
              <button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                style={{ color: '#8FEC78' }}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                New
              </button>
            </div>

            {/* Sessions Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              /* Empty State */
              <div className="text-center py-20">
                <BookOpen className="w-10 h-10 text-white/15 mx-auto mb-4" />
                <p className="text-white/40 mb-6">No sessions yet</p>
                <button
                  onClick={handleCreateSession}
                  disabled={isCreating}
                  className="text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ color: '#8FEC78' }}
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create your first session
                    </span>
                  )}
                </button>
              </div>
            ) : (
              /* Sessions List */
              <div className="space-y-1">
                {sessions.map((session) => {
                  const language = session.language ? getLanguageInfo(session.language) : null;
                  return (
                    <div
                      key={session.id}
                      onClick={() => navigate(`/sessions/${session.id}/chat`)}
                      className="group flex items-center justify-between py-4 px-4 -mx-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        {/* Session Info */}
                        <h3 className="text-white font-medium truncate">
                          {session.title || 'New Session'}
                        </h3>
                        <p className="text-white/40 text-sm truncate">
                          {language ? language.label : 'Getting started'}
                          {session.level && ` · ${session.level}`}
                        </p>
                      </div>
                      
                      {/* Right Side */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-white/25 text-sm hidden sm:block">
                          {formatDate(session.created_at)}
                        </span>
                        
                        {/* More Options */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                            >
                              <MoreHorizontal className="w-4 h-4 text-white/40" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-0 p-1.5"
                            style={{
                              background: 'rgba(0, 0, 0, 0.85)',
                              backdropFilter: 'blur(20px)',
                            }}
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer text-sm py-2"
                            >
                              <Trash2 className="w-4 h-4 mr-2.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent
            className="sm:max-w-sm border-0 p-0 overflow-hidden"
            style={{ background: 'transparent' }}
          >
            <div 
              className="p-6"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(40px)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-white mb-6">
                  Profile
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-white font-medium">{user?.name}</h3>
                  <p className="text-white/40 text-sm">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Name</label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="h-11 rounded-xl text-white/50 text-sm border-0"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="h-11 rounded-xl text-white/50 text-sm border-0"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
          <DialogContent
            className="sm:max-w-sm border-0 p-0 overflow-hidden"
            style={{ background: 'transparent' }}
          >
            <div 
              className="p-6"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(40px)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-white mb-6">
                  Settings
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div 
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                >
                  <p className="text-white/30 text-sm">
                    More settings coming soon
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full h-11 rounded-xl text-sm font-medium transition-all hover:bg-red-500/20 flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MeshGradientBackground>
  );
};

export default SessionsPage;
