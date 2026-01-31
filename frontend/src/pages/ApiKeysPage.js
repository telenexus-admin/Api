import { useState, useEffect } from 'react';
import { 
  Plus, 
  Key, 
  Trash2, 
  Copy, 
  Check,
  Loader2,
  Eye,
  EyeOff,
  Shield
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
import { Checkbox } from '../components/ui/checkbox';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [permissions, setPermissions] = useState({
    send_message: true,
    receive_message: true
  });
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get(`${API_URL}/api-keys`);
      setApiKeys(response.data);
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    const selectedPermissions = Object.entries(permissions)
      .filter(([_, enabled]) => enabled)
      .map(([perm]) => perm);

    setCreating(true);
    try {
      const response = await axios.post(`${API_URL}/api-keys`, {
        name: newKeyName,
        permissions: selectedPermissions
      });
      setNewlyCreatedKey(response.data);
      fetchApiKeys();
      setNewKeyName('');
      setPermissions({ send_message: true, receive_message: true });
    } catch (error) {
      toast.error('Failed to create API key');
      setCreating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!selectedKey) return;

    try {
      await axios.delete(`${API_URL}/api-keys/${selectedKey.id}`);
      setApiKeys(apiKeys.filter(k => k.id !== selectedKey.id));
      setDeleteDialogOpen(false);
      setSelectedKey(null);
      toast.success('API key revoked');
    } catch (error) {
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const closeNewKeyDialog = () => {
    setNewlyCreatedKey(null);
    setCreateDialogOpen(false);
    setCreating(false);
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
    <div className="space-y-6" data-testid="api-keys-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
            API Keys
          </h1>
          <p className="text-neutral-400">
            Manage your API keys for authentication
          </p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
          data-testid="create-api-key-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="bg-[#FF5500]/5 border-[#FF5500]/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#FF5500] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-neutral-300">
              <strong>Security Notice:</strong> API keys are shown only once when created. 
              Store them securely and never share them publicly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="empty-state border border-white/10 rounded-md py-16">
          <Key className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">No API keys yet</h3>
          <p className="text-neutral-500 mb-6">Generate your first API key to start using the API</p>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate New Key
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((apiKey) => (
            <Card 
              key={apiKey.id} 
              className="bg-[#121212] border-white/10"
              data-testid={`api-key-card-${apiKey.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center text-yellow-400">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{apiKey.name}</h3>
                      <div className="flex items-center gap-4">
                        <code className="text-sm text-neutral-500 font-mono">{apiKey.key}</code>
                        <div className="flex gap-2">
                          {apiKey.permissions.map((perm) => (
                            <span key={perm} className="badge badge-neutral text-xs">
                              {perm.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${apiKey.is_active ? 'text-[#00FF94]' : 'text-neutral-500'}`}>
                      {apiKey.is_active ? 'Active' : 'Revoked'}
                    </span>
                    {apiKey.is_active && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedKey(apiKey);
                          setDeleteDialogOpen(true);
                        }}
                        className="border-[#FF5500]/30 text-[#FF5500] hover:bg-[#FF5500]/10"
                        data-testid={`revoke-key-${apiKey.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
                {apiKey.last_used && (
                  <p className="text-xs text-neutral-500 mt-3">
                    Last used: {new Date(apiKey.last_used).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) closeNewKeyDialog();
        else setCreateDialogOpen(true);
      }}>
        <DialogContent className="bg-[#121212] border-white/10">
          {newlyCreatedKey ? (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  API Key Created
                </DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Make sure to copy your API key now. You won't be able to see it again!
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label className="text-[#FF5500]">Your API Key (copy it now!)</Label>
                <div className="mt-2 p-4 bg-[#0A0A0A] border border-[#00FF94]/30 rounded-md">
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-sm text-[#00FF94] font-mono break-all">
                      {newlyCreatedKey.key}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(newlyCreatedKey.key, 'new')}
                      className="hover:bg-white/10 flex-shrink-0"
                      data-testid="copy-new-key-btn"
                    >
                      {copiedId === 'new' ? (
                        <Check className="w-4 h-4 text-[#00FF94]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={closeNewKeyDialog}
                  className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
                >
                  I've Saved My Key
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Generate New API Key</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Create a new API key for your application
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Key Name *</Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                    className="bg-[#0A0A0A] border-white/10"
                    data-testid="api-key-name-input"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="send_message"
                        checked={permissions.send_message}
                        onCheckedChange={(checked) => 
                          setPermissions({ ...permissions, send_message: checked })
                        }
                        className="border-white/20 data-[state=checked]:bg-[#00FF94] data-[state=checked]:border-[#00FF94]"
                      />
                      <label htmlFor="send_message" className="text-sm text-neutral-300">
                        Send Messages
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="receive_message"
                        checked={permissions.receive_message}
                        onCheckedChange={(checked) => 
                          setPermissions({ ...permissions, receive_message: checked })
                        }
                        className="border-white/20 data-[state=checked]:bg-[#00FF94] data-[state=checked]:border-[#00FF94]"
                      />
                      <label htmlFor="receive_message" className="text-sm text-neutral-300">
                        Receive Messages
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-white/10">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateKey}
                  disabled={creating}
                  className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
                  data-testid="confirm-create-key-btn"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Key'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#121212] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to revoke "{selectedKey?.name}"? 
              This action cannot be undone and any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeKey}
              className="bg-[#FF5500] hover:bg-[#CC4400]"
              data-testid="confirm-revoke-key-btn"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApiKeysPage;
