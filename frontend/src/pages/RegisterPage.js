import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await register(name, email, password, company || null);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-[#00FF94] rounded flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              TELENEXUS
            </span>
          </Link>

          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Create your account
          </h1>
          <p className="text-neutral-400 mb-8">
            Get started with Telenexus WhatsApp API
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-neutral-300">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-[#0A0A0A] border-white/10 focus:border-[#00FF94] h-12"
                data-testid="register-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="bg-[#0A0A0A] border-white/10 focus:border-[#00FF94] h-12"
                data-testid="register-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-neutral-300">Company</Label>
              <Input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name (optional)"
                className="bg-[#0A0A0A] border-white/10 focus:border-[#00FF94] h-12"
                data-testid="register-company-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="bg-[#0A0A0A] border-white/10 focus:border-[#00FF94] h-12 pr-12"
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold h-12 mt-2"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-neutral-400 text-center mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00FF94] hover:underline" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] border-l border-white/10 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 bg-[#00FF94]/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <MessageSquare className="w-10 h-10 text-[#00FF94]" />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Start in 5 Minutes
          </h2>
          <p className="text-neutral-400 mb-6">
            Create your account, scan a QR code, and start sending messages through our powerful API.
          </p>
          <ul className="text-left space-y-3 max-w-xs mx-auto">
            {[
              'Multi-instance support',
              'Real-time webhooks',
              'Secure API keys',
              'Activity logging'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-neutral-300">
                <div className="w-1.5 h-1.5 bg-[#00FF94] rounded-full"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
