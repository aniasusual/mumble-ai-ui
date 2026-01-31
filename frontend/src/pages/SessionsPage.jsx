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
  Edit2,
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

const JobsPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [baseLanguage, setBaseLanguage] = useState(user?.base_language || 'English');
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renamingJob, setRenamingJob] = useState(null);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/signin');
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Create new job instantly
  const handleCreateJob = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    try {
      const response = await axios.post(`${API}/jobs`, {});
      setJobs([response.data, ...jobs]);
      navigate(`/jobs/${response.data.id}/chat`);
    } catch (error) {
      toast.error('Failed to create job');
      setIsCreating(false);
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/jobs/${jobId}`);
      setJobs(jobs.filter(j => j.id !== jobId));
      toast.success('Job deleted');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  // Open rename dialog
  const handleOpenRename = (job, e) => {
    e.stopPropagation();
    setRenamingJob(job);
    setNewJobTitle(job.title || 'New Job');
    setShowRenameDialog(true);
  };

  // Handle rename job
  const handleRenameJob = async () => {
    if (!renamingJob || !newJobTitle.trim() || isRenaming) return;

    setIsRenaming(true);

    try {
      await axios.put(`${API}/jobs/${renamingJob.id}`, {
        title: newJobTitle.trim()
      });

      // Update local state
      setJobs(jobs.map(j =>
        j.id === renamingJob.id
          ? { ...j, title: newJobTitle.trim() }
          : j
      ));

      toast.success('Job renamed');
      setShowRenameDialog(false);
      setRenamingJob(null);
      setNewJobTitle('');
    } catch (error) {
      toast.error('Failed to rename job');
    } finally {
      setIsRenaming(false);
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
                  background: '#0f1115',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 16px 50px rgba(0, 0, 0, 0.6)',
                }}
              >
                <div className="mb-2.5 pb-2.5 px-1" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{user?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <DropdownMenuItem 
                    onClick={() => setShowProfileModal(true)}
                    className="rounded-lg cursor-pointer text-sm py-2.5 px-3 text-white/80 focus:text-white focus:bg-white/5"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowSettingsModal(true)}
                    className="rounded-lg cursor-pointer text-sm py-2.5 px-3 text-white/80 focus:text-white focus:bg-white/5"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </DropdownMenuItem>
                  <div className="my-1.5 h-px" style={{ background: 'rgba(255, 255, 255, 0.08)' }} />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="rounded-lg cursor-pointer text-sm py-2.5 px-3 focus:bg-red-500/10"
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
                Jobs
              </h1>
              
              {/* Minimal New Job Button */}
              <button
                onClick={handleCreateJob}
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

            {/* Jobs Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              /* Empty State */
              <div className="text-center py-20">
                <BookOpen className="w-10 h-10 text-white/15 mx-auto mb-4" />
                <p className="text-white/40 mb-6">No jobs yet</p>
                <button
                  onClick={handleCreateJob}
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
                      Create your first job
                    </span>
                  )}
                </button>
              </div>
            ) : (
              /* Jobs List */
              <div className="space-y-1">
                {jobs.map((job) => {
                  const language = job.language ? getLanguageInfo(job.language) : null;
                  return (
                    <div
                      key={job.id}
                      className="group flex items-center justify-between py-4 px-4 -mx-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                    >
                      <div 
                        className="min-w-0 flex-1"
                        onClick={() => navigate(`/jobs/${job.id}/chat`)}
                      >
                        {/* Job Info */}
                        <h3 className="text-white font-medium truncate">
                          {job.title || 'New Job'}
                        </h3>
                        <p className="text-white/40 text-sm truncate">
                          {language ? language.label : 'Getting started'}
                          {job.level && ` · ${job.level}`}
                        </p>
                      </div>
                      
                      {/* Right Side - Responsive Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Date - Hides on mobile and on desktop hover */}
                        <span className="text-white/25 text-sm hidden md:block group-hover:hidden">
                          {formatDate(job.created_at)}
                        </span>

                        {/* Rename Button - Shows on hover on desktop, always on mobile */}
                        <button
                          onClick={(e) => handleOpenRename(job, e)}
                          className="flex md:hidden md:group-hover:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all hover:bg-white/5"
                          style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                          }}
                          title="Rename job"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Rename</span>
                        </button>

                        {/* Delete Button - Always visible on mobile, shows on hover on desktop */}
                        <button
                          onClick={(e) => handleDeleteJob(job.id, e)}
                          className="flex md:hidden md:group-hover:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all hover:bg-red-500/10"
                          style={{
                            color: 'rgba(239, 68, 68, 0.85)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                          title="Delete job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Delete</span>
                        </button>

                        {/* Chevron - Clickable area */}
                        <div
                          onClick={() => navigate(`/jobs/${job.id}/chat`)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-white/5 transition-all"
                        >
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                        </div>
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
          width="420px"
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
          width="420px"
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
                      
                      {/* Dropdown Content - Transparent Glass */}
                      <div 
                        className="absolute top-full left-0 right-0 mt-2 rounded-lg z-[101] language-dropdown-panel"
                        style={{
                          background: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(50px) saturate(180%)',
                          // WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
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

        {/* Rename Job Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent
            className="rounded-2xl border-0 p-0 overflow-hidden"
            style={{
              background: 'transparent',
              opacity: 0.98,
              backdropFilter: 'blur(50px) saturate(180%)',
              WebkitBackdropFilter: 'blur(50px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
              maxWidth: '440px',
            }}
          >
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-medium text-white">
                Rename Job
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 pb-6">
              <div className="space-y-4">
                {/* Job Title Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleRenameJob();
                      }
                    }}
                    className="w-full h-12 px-4 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(143, 236, 120, 0.4)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    placeholder="Enter job title..."
                    autoFocus
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRenameDialog(false);
                      setRenamingJob(null);
                      setNewJobTitle('');
                    }}
                    className="flex-1 h-11 rounded-lg text-sm font-normal transition-all"
                    style={{
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRenameJob}
                    disabled={isRenaming || !newJobTitle.trim()}
                    className="flex-1 h-11 rounded-lg text-sm font-normal transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: 'transparent',
                      color: '#8FEC78',
                      border: '1px solid rgba(143, 236, 120, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isRenaming && newJobTitle.trim()) {
                        e.currentTarget.style.background = 'rgba(143, 236, 120, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(143, 236, 120, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(143, 236, 120, 0.3)';
                    }}
                  >
                    {isRenaming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Renaming...
                      </>
                    ) : (
                      'Rename'
                    )}
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

export default JobsPage;
