import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  MessageSquare, 
  Webhook, 
  Key, 
  ArrowUpRight,
  Activity,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Instances',
      value: stats?.total_instances || 0,
      icon: <Server className="w-5 h-5" />,
      link: '/dashboard/instances',
      color: 'text-[#00FF94]',
      bgColor: 'bg-[#00FF94]/10'
    },
    {
      title: 'Connected',
      value: stats?.connected_instances || 0,
      icon: <Activity className="w-5 h-5" />,
      link: '/dashboard/instances',
      color: 'text-[#00FF94]',
      bgColor: 'bg-[#00FF94]/10'
    },
    {
      title: 'Total Messages',
      value: stats?.total_messages || 0,
      icon: <MessageSquare className="w-5 h-5" />,
      link: '/dashboard/logs',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      title: 'Messages Today',
      value: stats?.messages_today || 0,
      icon: <TrendingUp className="w-5 h-5" />,
      link: '/dashboard/logs',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    },
    {
      title: 'Active Webhooks',
      value: stats?.total_webhooks || 0,
      icon: <Webhook className="w-5 h-5" />,
      link: '/dashboard/webhooks',
      color: 'text-[#FF5500]',
      bgColor: 'bg-[#FF5500]/10'
    },
    {
      title: 'API Keys',
      value: stats?.active_api_keys || 0,
      icon: <Key className="w-5 h-5" />,
      link: '/dashboard/api-keys',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-48 skeleton mb-2"></div>
          <div className="h-5 w-64 skeleton"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-neutral-400">
          Overview of your WhatsApp API usage and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link} data-testid={`stat-card-${index}`}>
            <Card className="bg-[#121212] border-white/10 hover:border-white/20 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-400">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
                    {stat.value.toLocaleString()}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/dashboard/instances" 
            className="feature-card flex items-center gap-4"
            data-testid="quick-action-create-instance"
          >
            <div className="w-12 h-12 bg-[#00FF94]/10 rounded-lg flex items-center justify-center text-[#00FF94]">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium">Create Instance</h3>
              <p className="text-sm text-neutral-500">Add a new WhatsApp instance</p>
            </div>
          </Link>
          
          <Link 
            to="/dashboard/api-keys" 
            className="feature-card flex items-center gap-4"
            data-testid="quick-action-generate-key"
          >
            <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center text-yellow-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium">Generate API Key</h3>
              <p className="text-sm text-neutral-500">Create new API credentials</p>
            </div>
          </Link>
          
          <Link 
            to="/dashboard/playground" 
            className="feature-card flex items-center gap-4"
            data-testid="quick-action-playground"
          >
            <div className="w-12 h-12 bg-purple-400/10 rounded-lg flex items-center justify-center text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium">API Playground</h3>
              <p className="text-sm text-neutral-500">Test your API integration</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
