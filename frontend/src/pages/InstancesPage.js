import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Server, 
  MoreVertical, 
  Trash2, 
  Eye,
  Wifi,
  WifiOff,
  Loader2,
  QrCode
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InstancesPage = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceDescription, setNewInstanceDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await axios.get(`${API_URL}/instances`);
      setInstances(response.data);
    } catch (error) {
      toast.error('Failed to load instances');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Please enter an instance name');
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API_URL}/instances`, {
        name: newInstanceName,
        description: newInstanceDescription || null
      });
      setInstances([...instances, response.data]);
      setCreateDialogOpen(false);
      setNewInstanceName('');
      setNewInstanceDescription('');
      toast.success('Instance created successfully');
      navigate(`/dashboard/instances/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create instance');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!selectedInstance) return;

    try {
      await axios.delete(`${API_URL}/instances/${selectedInstance.id}`);
      setInstances(instances.filter(i => i.id !== selectedInstance.id));
      setDeleteDialogOpen(false);
      setSelectedInstance(null);
      toast.success('Instance deleted successfully');
    } catch (error) {
      toast.error('Failed to delete instance');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return (
          <span className="badge badge-success">
            <Wifi className="w-3 h-3 mr-1" />
            Connected
          </span>
        );
      case 'connecting':
        return (
          <span className="badge badge-warning">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral">
            <WifiOff className="w-3 h-3 mr-1" />
            Disconnected
          </span>
        );
    }
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
    <div className="space-y-6" data-testid="instances-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Instances
          </h1>
          <p className="text-neutral-400">
            Manage your WhatsApp instances and connections
          </p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
          data-testid="create-instance-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Instance
        </Button>
      </div>

      {/* Instances List */}
      {instances.length === 0 ? (
        <div className="empty-state border border-white/10 rounded-md py-16">
          <Server className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">No instances yet</h3>
          <p className="text-neutral-500 mb-6">Create your first WhatsApp instance to get started</p>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Instance
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <div 
              key={instance.id} 
              className="card p-6 flex items-center justify-between"
              data-testid={`instance-card-${instance.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00FF94]/10 rounded-lg flex items-center justify-center text-[#00FF94]">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{instance.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    {instance.phone_number && (
                      <span>{instance.phone_number}</span>
                    )}
                    {getStatusBadge(instance.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/instances/${instance.id}`)}
                  className="border-white/10 hover:bg-white/5"
                  data-testid={`view-instance-${instance.id}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#121212] border-white/10">
                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/instances/${instance.id}`)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR Code
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedInstance(instance);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-[#FF5500] focus:text-[#FF5500]"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Instance Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#121212] border-white/10">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Create New Instance</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Create a new WhatsApp instance to start sending messages
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Instance Name *</Label>
              <Input
                id="instance-name"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="e.g., Support Bot"
                className="bg-[#0A0A0A] border-white/10"
                data-testid="instance-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instance-description">Description</Label>
              <Input
                id="instance-description"
                value={newInstanceDescription}
                onChange={(e) => setNewInstanceDescription(e.target.value)}
                placeholder="Optional description"
                className="bg-[#0A0A0A] border-white/10"
                data-testid="instance-description-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateInstance}
              disabled={creating}
              className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
              data-testid="confirm-create-instance-btn"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Instance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#121212] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instance</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to delete "{selectedInstance?.name}"? This action cannot be undone.
              All messages, webhooks, and sessions associated with this instance will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInstance}
              className="bg-[#FF5500] hover:bg-[#CC4400]"
              data-testid="confirm-delete-instance-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InstancesPage;
