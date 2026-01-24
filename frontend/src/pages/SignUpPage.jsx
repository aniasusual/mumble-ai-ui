import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import MeshGradientBackground from '../components/MeshGradientBackground';
import MumbleLogo from '../components/MumbleLogo';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
      navigate('/sessions');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create account';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google OAuth
    toast.info('Google Sign-Up coming soon!');
  };

  return (
    <MeshGradientBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <MumbleLogo size={40} color="#ffffff" />
          <span className="font-semibold text-xl text-white">mumble</span>
        </Link>
        
        {/* Sign Up Card */}
        <div 
          className="w-full max-w-md p-8 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h1 className="text-2xl font-semibold text-white text-center mb-2">
            Create your account
          </h1>
          <p className="text-white/50 text-center mb-8">
            Start your language learning journey
          </p>
          
          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all hover:bg-white/10 mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
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
              <span className="px-3 text-white/30" style={{ background: 'rgba(0,0,0,0.3)' }}>
                or continue with email
              </span>
            </div>
          </div>
          
          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-12 pl-12 pr-4 rounded-xl text-white placeholder:text-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 pl-12 pr-4 rounded-xl text-white placeholder:text-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 pl-12 pr-12 rounded-xl text-white placeholder:text-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
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
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 pl-12 pr-4 rounded-xl text-white placeholder:text-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #8FEC78 0%, #5AC94B 100%)',
                color: '#000',
                border: 'none',
              }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
          
          {/* Terms */}
          <p className="text-center text-white/30 text-xs mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
          
          {/* Sign In Link */}
          <p className="text-center text-white/50 mt-6">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              className="text-[#8FEC78] hover:text-[#a5f08f] transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
        
        {/* Back to home */}
        <Link 
          to="/" 
          className="mt-6 text-white/30 hover:text-white/60 transition-colors text-sm"
        >
          ← Back to home
        </Link>
      </div>
    </MeshGradientBackground>
  );
};

export default SignUpPage;
