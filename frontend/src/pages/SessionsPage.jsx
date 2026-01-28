import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import SidePanel from '../components/ui/side-panel';
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
  Search,
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
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');

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
    setLanguageDropdownOpen(false);
    setLanguageSearch('');
    
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

  // Filter languages based on search
  const filteredLanguages = BASE_LANGUAGES.filter(lang =>
    lang.label.toLowerCase().includes(languageSearch.toLowerCase())
  );

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
                              background: 'rgba(10, 10, 10, 0.95)',
                              backdropFilter: 'blur(24px)',
                              WebkitBackdropFilter: 'blur(24px)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="rounded-lg cursor-pointer text-sm py-2.5 px-3"
                              style={{ 
                                color: 'rgba(239, 68, 68, 0.85)',
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

        {/* Profile Side Panel */}
        <SidePanel
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="Profile"
          width="500px"
        >
          <div className="p-8 space-y-8">
            {/* User Info - Minimal */}
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium"
                style={{
                  background: 'rgba(143, 236, 120, 0.1)',
                  color: '#8FEC78',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-base truncate">{user?.name}</h3>
                <p className="text-sm truncate" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{user?.email}</p>
              </div>
            </div>
            
            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
            
            {/* Info Fields - Minimal */}
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Name</label>
                <div className="text-white text-sm py-2.5">{user?.name || '-'}</div>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Email</label>
                <div className="text-white text-sm py-2.5">{user?.email || '-'}</div>
              </div>
            </div>
          </div>
        </SidePanel>

        {/* Settings Side Panel */}
        <SidePanel
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Settings"
          width="500px"
        >
          <div className="p-8">
            <div className="space-y-8">
              {/* Base Language Setting - Minimal */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-white block mb-1">
                    Base Language
                  </label>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                    Your native language for learning
                  </p>
                </div>

                {/* Custom Language Dropdown - Simplified */}
                <div className="relative z-50">
                  <button
                    disabled={isUpdatingLanguage}
                    onClick={() => {
                      setLanguageDropdownOpen(!languageDropdownOpen);
                      setLanguageSearch('');
                    }}
                    className="w-full h-12 px-4 rounded-lg text-sm transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.9)',
                      border: languageDropdownOpen 
                        ? '1px solid rgba(143, 236, 120, 0.4)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">
                        {BASE_LANGUAGES.find(l => l.value === baseLanguage)?.flag}
                      </span>
                      <span className="font-normal">
                        {BASE_LANGUAGES.find(l => l.value === baseLanguage)?.label || 'Select language...'}
                      </span>
                    </div>
                    <ChevronsUpDown 
                      className="w-4 h-4 transition-all duration-200" 
                      style={{ 
                        transform: languageDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'rgba(255, 255, 255, 0.4)',
                      }}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {languageDropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-[100]"
                        onClick={() => {
                          setLanguageDropdownOpen(false);
                          setLanguageSearch('');
                        }}
                        style={{ background: 'transparent' }}
                      />
                      
                      {/* Dropdown Content - Matching Style */}
                      <div 
                        className="absolute top-full left-0 right-0 mt-2 rounded-lg z-[101] language-dropdown-panel"
                        style={{
                          background: 'rgba(10, 10, 10, 0.95)',
                          backdropFilter: 'blur(32px)',
                          WebkitBackdropFilter: 'blur(32px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        {/* Search Input - Minimal */}
                        <div className="p-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          <div className="relative">
                            <Search 
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                              style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            />
                            <input
                              type="text"
                              placeholder="Search languages..."
                              value={languageSearch}
                              onChange={(e) => setLanguageSearch(e.target.value)}
                              className="w-full h-10 pl-10 pr-3 rounded-md text-sm outline-none transition-all"
                              style={{
                                background: 'transparent',
                                color: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                              }}
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Language List - Minimal & Scrollable */}
                        <div 
                          className="overflow-y-auto overflow-x-hidden py-2"
                          style={{
                            maxHeight: '320px',
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
                          }}
                        >
                          {filteredLanguages.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                No language found
                              </p>
                            </div>
                          ) : (
                            <div className="px-2 space-y-0.5">
                              {filteredLanguages.map((lang) => {
                                const isSelected = baseLanguage === lang.value;
                                return (
                                  <button
                                    key={lang.value}
                                    onClick={() => handleBaseLanguageChange(lang.value)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all rounded-md"
                                    style={{
                                      background: isSelected ? 'rgba(143, 236, 120, 0.08)' : 'transparent',
                                      color: isSelected ? '#8FEC78' : 'rgba(255, 255, 255, 0.75)',
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = 'transparent';
                                      }
                                    }}
                                  >
                                    <span className="text-xl flex-shrink-0">{lang.flag}</span>
                                    <span className="font-normal text-sm flex-1">{lang.label}</span>
                                    {isSelected && (
                                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#8FEC78' }} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

              {/* Logout Button - Minimal */}
              <button
                onClick={handleLogout}
                className="w-full h-11 rounded-lg text-sm font-normal transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'transparent',
                  color: 'rgba(239, 68, 68, 0.9)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                }}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </SidePanel>
      </div>
    </MeshGradientBackground>
  );
};

export default SessionsPage;
