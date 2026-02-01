import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  Code2, 
  ArrowRight, 
  Check,
  ChevronRight,
  Globe,
  Bell,
  Bot
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Send Messages",
      description: "Send messages to any WhatsApp number from your application using our REST API."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Receive Messages",
      description: "Set up webhooks to receive incoming messages in real-time and respond instantly."
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "API Playground",
      description: "Test your API integration using our interactive playground before production."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with API key management and activity logging."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Multi-Instance",
      description: "Create multiple WhatsApp instances for different departments or clients."
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Automation Ready",
      description: "Build chatbots and automate customer support with webhook integrations."
    }
  ];

  const useCases = [
    {
      title: "Customer Support",
      description: "Offer real-time support through WhatsApp. Respond promptly with personalized assistance."
    },
    {
      title: "Chatbots",
      description: "Create intelligent chatbots that engage users, answer queries, and perform actions."
    },
    {
      title: "Notifications",
      description: "Send order confirmations, delivery updates, service reminders, and alerts."
    },
    {
      title: "Automation",
      description: "Integrate into business workflows for automated responses and data collection."
    }
  ];

  const steps = [
    { step: "01", title: "Create Account", description: "Sign up and create an instance to get your ID and token." },
    { step: "02", title: "Scan QR Code", description: "Scan the QR code to link your WhatsApp account." },
    { step: "03", title: "Start Sending", description: "Use our API to send messages with your preferred language." }
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Navigation */}
      <nav className="glass-header border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00FF94] rounded flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              TELENEXUS
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
                data-testid="dashboard-btn"
              >
                Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-neutral-400 hover:text-white transition-colors"
                  data-testid="login-link"
                >
                  Login
                </Link>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
                  data-testid="get-started-btn"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient grid-pattern relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FF94]/10 border border-[#00FF94]/20 rounded-full text-[#00FF94] text-sm mb-6">
              <Zap className="w-4 h-4" />
              <span>WhatsApp API Platform for ISP Clients</span>
            </div>
            
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6"
              style={{ fontFamily: 'Chivo, sans-serif' }}
            >
              Send and Receive WhatsApp Messages{' '}
              <span className="text-[#00FF94]">with Ease</span>
            </h1>
            
            <p className="text-lg text-neutral-400 mb-8 max-w-2xl">
              Our WhatsApp API allows you to harness the power of WhatsApp's messaging 
              capabilities directly in your web or mobile applications. Easily send and 
              receive messages, and set up webhooks for real-time notifications.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => navigate('/register')}
                className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold h-12 px-8 text-base"
                data-testid="hero-get-started-btn"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard/playground')}
                className="border-white/20 text-white hover:bg-white/5 h-12 px-8 text-base"
                data-testid="api-docs-btn"
              >
                API Documentation
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#00FF94]/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
              How it works?
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Unlimited messages, fixed pricing, no extra charges. Quick onboarding takes around five minutes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="feature-card h-full">
                  <div className="text-5xl font-black text-[#00FF94]/20 mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-neutral-400">{item.description}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-5 w-6 h-6 text-neutral-600 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-[#00FF94] text-sm font-medium mb-2">TELENEXUS SERVICES</p>
            <h2 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Our WhatsApp API Services
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" data-testid={`feature-card-${index}`}>
                <div className="w-12 h-12 bg-[#00FF94]/10 rounded-lg flex items-center justify-center text-[#00FF94] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-neutral-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="border-t border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#00FF94] text-sm font-medium mb-2">REST API</p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Send messages via WhatsApp REST API
              </h2>
              <p className="text-neutral-400 mb-6">
                Work with Telenexus now. Create a chatbot and combine WhatsApp with your 
                business systems, such as your ERP, CRM, app, or website. Any programming 
                language can be used with ease.
              </p>
              
              <ul className="space-y-3">
                {['Node.js', 'Python', 'PHP', 'Java', 'Go', 'Ruby'].map((lang, i) => (
                  <li key={i} className="flex items-center gap-2 text-neutral-300">
                    <Check className="w-4 h-4 text-[#00FF94]" />
                    {lang} SDK Available
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="code-block p-6">
              <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="ml-2">request.js</span>
              </div>
              <pre className="text-sm text-neutral-300 overflow-x-auto">
{`import axios from 'axios';

const sendMessage = async () => {
  const response = await axios.post(
    'https://api.telenexus.com/v1/send-message',
    {
      instance_id: 'your-instance-id',
      phone_number: '+1234567890',
      message: 'Hello from Telenexus!',
      type: 'text'
    },
    {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY'
      }
    }
  );
  
  return response.data;
};`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-white/10 py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-[#00FF94] text-sm font-medium mb-2">USE CASES</p>
            <h2 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
              WhatsApp API Use Cases
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="feature-card flex gap-4">
                <div className="w-10 h-10 bg-[#FF5500]/10 rounded-lg flex items-center justify-center text-[#FF5500] flex-shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{useCase.title}</h3>
                  <p className="text-neutral-400 text-sm">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-white/10 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="tracing-beam bg-[#121212] border border-white/10 rounded-lg p-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Communicate with Your Audience Through{' '}
              <span className="text-[#00FF94]">WhatsApp API</span>
            </h2>
            <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
              Start building your WhatsApp integration today. Create an account and get your API access in minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/register')}
                className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold h-12 px-8"
                data-testid="cta-get-started-btn"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 h-12 px-8"
              >
                View API Docs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#00FF94] rounded flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold">TELENEXUS</span>
            </div>
            <p className="text-neutral-500 text-sm">
              © {new Date().getFullYear()} Telenexus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
