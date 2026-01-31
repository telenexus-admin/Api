import { useState, useEffect } from 'react';
import { 
  ScrollText, 
  RefreshCw, 
  Filter,
  User,
  Server,
  MessageSquare,
  Key,
  Webhook,
  LogIn
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getActionIcon = (action) => {
  if (action.includes('user')) return <User className="w-4 h-4" />;
  if (action.includes('instance')) return <Server className="w-4 h-4" />;
  if (action.includes('message')) return <MessageSquare className="w-4 h-4" />;
  if (action.includes('api_key')) return <Key className="w-4 h-4" />;
  if (action.includes('webhook')) return <Webhook className="w-4 h-4" />;
  return <ScrollText className="w-4 h-4" />;
};

const getActionColor = (action) => {
  if (action.includes('created') || action.includes('connected') || action.includes('login')) {
    return 'text-[#00FF94] bg-[#00FF94]/10';
  }
  if (action.includes('deleted') || action.includes('revoked') || action.includes('disconnected')) {
    return 'text-[#FF5500] bg-[#FF5500]/10';
  }
  return 'text-blue-400 bg-blue-400/10';
};

const formatAction = (action) => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, instancesRes] = await Promise.all([
        axios.get(`${API_URL}/logs?limit=100`),
        axios.get(`${API_URL}/instances`)
      ]);
      setLogs(logsRes.data);
      setInstances(instancesRes.data);
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (selectedInstance !== 'all') {
        params.instance_id = selectedInstance;
      }
      const response = await axios.get(`${API_URL}/logs`, { params });
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to refresh logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = selectedInstance === 'all' 
    ? logs 
    : logs.filter(log => log.instance_id === selectedInstance);

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 skeleton"></div>
          <div className="h-10 w-36 skeleton rounded-md"></div>
        </div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="logs-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Activity Logs
          </h1>
          <p className="text-neutral-400">
            View all activity and events in your account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger className="w-48 bg-[#121212] border-white/10" data-testid="logs-filter-select">
              <Filter className="w-4 h-4 mr-2 text-neutral-500" />
              <SelectValue placeholder="Filter by instance" />
            </SelectTrigger>
            <SelectContent className="bg-[#121212] border-white/10">
              <SelectItem value="all">All Instances</SelectItem>
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={fetchLogs}
            disabled={loading}
            className="border-white/10 hover:bg-white/5"
            data-testid="refresh-logs-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <Card className="bg-[#121212] border-white/10">
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <ScrollText className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
              <h3 className="text-lg font-medium text-neutral-300 mb-2">No activity yet</h3>
              <p className="text-neutral-500">Activity logs will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredLogs.map((log) => {
                const instance = instances.find(i => i.id === log.instance_id);
                return (
                  <div 
                    key={log.id} 
                    className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-neutral-200">
                            {formatAction(log.action)}
                          </p>
                          <span className="text-xs text-neutral-500 flex-shrink-0">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                          {instance && (
                            <span className="flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              {instance.name}
                            </span>
                          )}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <span className="font-mono text-xs">
                              {JSON.stringify(log.details)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;
