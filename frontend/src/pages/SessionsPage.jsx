import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
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
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LANGUAGES = [
  { value: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { value: 'french', label: 'French', flag: '🇫🇷' },
  { value: 'german', label: 'German', flag: '🇩🇪' },
  { value: 'japanese', label: 'Japanese', flag: '🇯🇵' },
  { value: 'mandarin', label: 'Mandarin', flag: '🇨🇳' },
];

const BASE_LANGUAGES = [
  { value: 'English', label: 'English', flag: '🇬🇧' },
  { value: 'Spanish', label: 'Spanish', flag: '🇪🇸' },
  { value: 'French', label: 'French', flag: '🇫🇷' },
  { value: 'German', label: 'German', flag: '🇩🇪' },
  { value: 'Japanese', label: 'Japanese', flag: '🇯🇵' },
  { value: 'Mandarin', label: 'Mandarin', flag: '🇨🇳' },
  { value: 'Hindi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'Portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { value: 'Korean', label: 'Korean', flag: '🇰🇷' },
];

const SessionsPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [baseLanguage, setBaseLanguage] = useState(user?.base_language || 'English');
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);

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

  // Handle base language update
  const handleBaseLanguageChange = async (language) => {
    if (isUpdatingLanguage || language === baseLanguage) return;

    setIsUpdatingLanguage(true);
    try {
      await updateUser({ base_language: language });
      setBaseLanguage(language);
      toast.success('Base language updated');
    } catch (error) {
      toast.error('Failed to update language');
      console.error('Language update error:', error);
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  // Update base language when user changes
  useEffect(() => {
    if (user?.base_language) {
      setBaseLanguage(user.base_language);
    }
  }, [user]);

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
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <MumbleLogo size={32} color="#ffffff" />
              <span className="font-medium text-lg text-white">mumble</span>
            </Link>
            
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
                className="w-52 mt-3 p-2.5 rounded-2xl border-0"
                style={{
                  background: 'rgba(10, 10, 10, 0.95)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="mb-2.5 pb-2.5 px-1" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>{user?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <DropdownMenuItem 
                    onClick={() => setShowProfileModal(true)}
                    className="rounded-lg cursor-pointer text-sm py-2.5 px-3"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowSettingsModal(true)}
                    className="rounded-lg cursor-pointer text-sm py-2.5 px-3"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </DropdownMenuItem>
                  <div className="my-1.5 h-px" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="rounded-lg cursor-pointer text-sm py-2.5 px-3"
                    style={{ 
                      color: 'rgba(239, 68, 68, 0.85)',
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pt-28 pb-12">
          <div className="max-w-5xl mx-auto">
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
                              background: 'rgba(255, 255, 255, 0.08)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            }}
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="rounded-lg cursor-pointer text-sm py-2 px-3 focus:bg-red-500/10 focus:text-red-400"
                              style={{ 
                                color: 'rgba(239, 68, 68, 0.9)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.color = '#EF4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)';
                              }}
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
            className="sm:max-w-md border-0 p-0 overflow-hidden"
            style={{ background: 'transparent' }}
          >
            <div 
              className="p-8 rounded-3xl"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-white mb-8">
                  Profile
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex items-center gap-5 mb-8 p-5 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.15), rgba(90, 201, 75, 0.15))',
                    color: '#8FEC78',
                    border: '2px solid rgba(143, 236, 120, 0.3)',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate">{user?.name}</h3>
                  <p className="text-sm truncate" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2.5 block" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Name</label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="h-12 rounded-xl text-sm border-0"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-2.5 block" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="h-12 rounded-xl text-sm border-0"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'rgba(255, 255, 255, 0.7)',
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
            style={{ background: 'transparent' }}
          >
            <div 
              className="p-8 rounded-3xl"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-white mb-8">
                  Settings
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Base Language Setting */}
                <div
                  className="p-5 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="mb-4">
                    <label className="text-sm font-medium text-white block mb-1.5">
                      Base Language
                    </label>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                      Your native language for learning
                    </p>
                  </div>

                  <Popover open={languagePopoverOpen} onOpenChange={setLanguagePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        disabled={isUpdatingLanguage}
                        className="w-full h-12 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-between hover:bg-white/5"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">
                            {BASE_LANGUAGES.find(l => l.value === baseLanguage)?.flag}
                          </span>
                          <span>
                            {BASE_LANGUAGES.find(l => l.value === baseLanguage)?.label || 'Select language...'}
                          </span>
                        </div>
                        <ChevronsUpDown className="w-4 h-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0 border-0"
                      style={{
                        background: 'rgba(10, 10, 10, 0.98)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      <Command
                        className="rounded-xl"
                        style={{
                          background: 'transparent',
                        }}
                      >
                        <CommandInput
                          placeholder="Search language..."
                          className="h-10 text-sm border-b"
                          style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            borderColor: 'rgba(255, 255, 255, 0.12)',
                          }}
                        />
                        <CommandList
                          className="max-h-[280px] overflow-y-auto overflow-x-hidden py-2"
                        >
                          <CommandEmpty className="py-8 text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            No language found.
                          </CommandEmpty>
                          <CommandGroup>
                            {BASE_LANGUAGES.map((lang) => (
                              <CommandItem
                                key={lang.value}
                                value={lang.label}
                                onSelect={() => {
                                  handleBaseLanguageChange(lang.value);
                                  setLanguagePopoverOpen(false);
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer mx-1 rounded-lg"
                                style={{
                                  color: baseLanguage === lang.value ? '#8FEC78' : 'rgba(255, 255, 255, 0.75)',
                                }}
                              >
                                <Check
                                  className={`w-4 h-4 flex-shrink-0 ${baseLanguage === lang.value ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <span className="text-lg flex-shrink-0">{lang.flag}</span>
                                <span className="font-medium">{lang.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full h-12 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5"
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
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
