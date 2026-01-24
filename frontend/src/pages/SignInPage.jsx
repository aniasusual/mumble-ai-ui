import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/sessions');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to sign in';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Google Sign-In coming soon!');
  };

  return (
    <MeshGradientBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity">
          <MumbleLogo size={44} color="#ffffff" />
          <span className="font-semibold text-2xl text-white">mumble</span>
        </Link>
        
        {/* Floating Card with Glow */}
        <div className="relative w-full max-w-md">
          {/* Multi-color glow effect behind card */}
          <div 
            className="absolute -inset-1 rounded-3xl opacity-75 blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(74, 144, 217, 0.4) 100%)',
            }}
          />
          <div 
            className="absolute -inset-0.5 rounded-3xl opacity-50 blur-xl"
            style={{
              background: 'linear-gradient(225deg, rgba(244, 114, 182, 0.3) 0%, rgba(45, 212, 191, 0.3) 100%)',
            }}
          />
          
          {/* Card */}
          <div 
            className="relative p-8 rounded-2xl"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Welcome back
            </h1>
            <p className="text-white/50 text-center mb-8">
              Sign in to continue learning
            </p>
            
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.05), inset 0 0 15px rgba(255, 255, 255, 0.03)',
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span 
                  className="px-4 text-white/30 text-xs uppercase tracking-wider"
                  style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                >
                  or continue with email
                </span>
              </div>
            </div>
            
            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#8FEC78] transition-colors" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-13 pl-12 pr-4 rounded-xl text-white placeholder:text-white/30 transition-all focus:ring-2 focus:ring-[#8FEC78]/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#8FEC78] transition-colors" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-13 pl-12 pr-12 rounded-xl text-white placeholder:text-white/30 transition-all focus:ring-2 focus:ring-[#8FEC78]/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Sign In Button - Pill style with glow */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.2) 0%, rgba(90, 201, 75, 0.2) 100%)',
                  color: '#8FEC78',
                  border: '1px solid rgba(143, 236, 120, 0.4)',
                  boxShadow: '0 0 30px rgba(143, 236, 120, 0.25), inset 0 0 20px rgba(143, 236, 120, 0.1)',
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            {/* Sign Up Link */}
            <p className="text-center text-white/50 mt-8 text-sm">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-[#8FEC78] hover:text-[#a5f08f] transition-colors font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
        
        {/* Back to home */}
        <Link 
          to="/" 
          className="mt-8 text-white/30 hover:text-white/60 transition-colors text-sm"
        >
          ← Back to home
        </Link>
      </div>
    </MeshGradientBackground>
  );
};

export default SignInPage;
