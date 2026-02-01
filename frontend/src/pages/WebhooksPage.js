import { useState, useEffect } from 'react';
import { 
  Plus, 
  Webhook, 
  Trash2, 
  Loader2,
  ExternalLink,
  PlayCircle,
  Check,
  X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WEBHOOK_EVENTS = [
  { id: 'message.sent', label: 'Message Sent' },
  { id: 'message.received', label: 'Message Received' },
  { id: 'instance.connected', label: 'Instance Connected' },
  { id: 'instance.disconnected', label: 'Instance Disconnected' }
];

const WebhooksPage = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const instancesRes = await axios.get(`${API_URL}/instances`);
      setInstances(instancesRes.data);
      
      // Fetch webhooks for all instances
      const allWebhooks = [];
      for (const instance of instancesRes.data) {
        try {
          const webhooksRes = await axios.get(`${API_URL}/instances/${instance.id}/webhooks`);
          webhooksRes.data.forEach(wh => {
            allWebhooks.push({ ...wh, instance_name: instance.name });
          });
        } catch (e) {
          // Instance might not have webhooks
        }
      }
      setWebhooks(allWebhooks);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!selectedInstanceId) {
      toast.error('Please select an instance');
      return;
    }
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API_URL}/instances/${selectedInstanceId}/webhooks`, {
        url: webhookUrl,
        events: selectedEvents,
        is_active: true
      });
      
      const instance = instances.find(i => i.id === selectedInstanceId);
      setWebhooks([...webhooks, { ...response.data, instance_name: instance?.name }]);
      setCreateDialogOpen(false);
      setWebhookUrl('');
      setSelectedEvents([]);
      setSelectedInstanceId('');
      toast.success('Webhook created successfully');
    } catch (error) {
      toast.error('Failed to create webhook');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      await axios.delete(`${API_URL}/webhooks/${selectedWebhook.id}`);
      setWebhooks(webhooks.filter(w => w.id !== selectedWebhook.id));
      setDeleteDialogOpen(false);
      setSelectedWebhook(null);
      toast.success('Webhook deleted');
    } catch (error) {
      toast.error('Failed to delete webhook');
    }
  };

  const handleTestWebhook = async (webhookId) => {
    setTesting({ ...testing, [webhookId]: true });
    try {
      const response = await axios.post(`${API_URL}/webhooks/${webhookId}/test`);
      if (response.data.success) {
        toast.success(`Test successful (Status: ${response.data.status_code})`);
      } else {
        toast.error(`Test failed: ${response.data.error}`);
      }
    } catch (error) {
      toast.error('Failed to test webhook');
    } finally {
      setTesting({ ...testing, [webhookId]: false });
    }
  };

  const toggleEvent = (eventId) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 skeleton"></div>
          <div className="h-10 w-36 skeleton rounded-md"></div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="webhooks-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Webhooks
          </h1>
          <p className="text-neutral-400">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          disabled={instances.length === 0}
          className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
          data-testid="create-webhook-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {instances.length === 0 ? (
        <Card className="bg-[#121212] border-white/10">
          <CardContent className="p-8 text-center">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
            <h3 className="text-lg font-medium text-neutral-300 mb-2">No instances available</h3>
            <p className="text-neutral-500">Create an instance first to add webhooks</p>
          </CardContent>
        </Card>
      ) : webhooks.length === 0 ? (
        <div className="empty-state border border-white/10 rounded-md py-16">
          <Webhook className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">No webhooks yet</h3>
          <p className="text-neutral-500 mb-6">Add webhooks to receive event notifications</p>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card 
              key={webhook.id} 
              className="bg-[#121212] border-white/10"
              data-testid={`webhook-card-${webhook.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-[#FF5500]/10 rounded-lg flex items-center justify-center text-[#FF5500] flex-shrink-0">
                      <Webhook className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-neutral-500">Instance:</span>
                        <span className="text-sm font-medium">{webhook.instance_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <ExternalLink className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <code className="text-sm text-neutral-300 font-mono truncate">{webhook.url}</code>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <span key={event} className="badge badge-neutral text-xs">
                            {event}
                          </span>
                        ))}
                      </div>
                      {webhook.last_triggered && (
                        <p className="text-xs text-neutral-500 mt-2">
                          Last triggered: {new Date(webhook.last_triggered).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook.id)}
                      disabled={testing[webhook.id]}
                      className="border-white/10 hover:bg-white/5"
                      data-testid={`test-webhook-${webhook.id}`}
                    >
                      {testing[webhook.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Test
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedWebhook(webhook);
                        setDeleteDialogOpen(true);
                      }}
                      className="border-[#FF5500]/30 text-[#FF5500] hover:bg-[#FF5500]/10"
                      data-testid={`delete-webhook-${webhook.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#121212] border-white/10">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Add Webhook</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Configure a webhook to receive event notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Instance *</Label>
              <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10" data-testid="webhook-instance-select">
                  <SelectValue placeholder="Select an instance" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10">
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL *</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="bg-[#0A0A0A] border-white/10"
                data-testid="webhook-url-input"
              />
            </div>
            <div className="space-y-3">
              <Label>Events *</Label>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                      className="border-white/20 data-[state=checked]:bg-[#00FF94] data-[state=checked]:border-[#00FF94]"
                    />
                    <label htmlFor={event.id} className="text-sm text-neutral-300">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWebhook}
              disabled={creating}
              className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
              data-testid="confirm-create-webhook-btn"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#121212] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to delete this webhook? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteWebhook}
              className="bg-[#FF5500] hover:bg-[#CC4400]"
              data-testid="confirm-delete-webhook-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WebhooksPage;
