import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Server, 
  Wifi, 
  WifiOff, 
  Send, 
  RefreshCw,
  Loader2,
  Phone,
  MessageSquare,
  Copy,
  Check,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  User,
  DollarSign,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InstanceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Billing message state
  const [billingPhone, setBillingPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [invoiceId, setInvoiceId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [messageType, setMessageType] = useState('payment_reminder');
  const [sendingBilling, setSendingBilling] = useState(false);
  
  // Interactive message state
  const [interactivePhone, setInteractivePhone] = useState('');
  const [interactiveTitle, setInteractiveTitle] = useState('');
  const [interactiveDescription, setInteractiveDescription] = useState('');
  const [interactiveFooter, setInteractiveFooter] = useState('');
  const [buttons, setButtons] = useState([{ id: 'btn_1', text: '' }]);
  const [sendingInteractive, setSendingInteractive] = useState(false);

  useEffect(() => {
    fetchInstance();
    fetchMessages();
  }, [id]);

  const fetchInstance = async () => {
    try {
      const response = await axios.get(`${API_URL}/instances/${id}`);
      setInstance(response.data);
      setQrCode(response.data.qr_code);
    } catch (error) {
      toast.error('Failed to load instance');
      navigate('/dashboard/instances');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/instances/${id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const refreshQrCode = async () => {
    try {
      const response = await axios.get(`${API_URL}/instances/${id}/qr`);
      setQrCode(response.data.qr_code);
      toast.success('QR code refreshed');
    } catch (error) {
      toast.error('Failed to refresh QR code');
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await axios.post(`${API_URL}/instances/${id}/connect`, null, {
        params: { phone_number: phoneNumber || '+1234567890' }
      });
      await fetchInstance();
      toast.success('Instance connected successfully');
    } catch (error) {
      toast.error('Failed to connect instance');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.post(`${API_URL}/instances/${id}/disconnect`);
      await fetchInstance();
      toast.success('Instance disconnected');
    } catch (error) {
      toast.error('Failed to disconnect instance');
    }
  };

  const handleSendMessage = async () => {
    if (!phoneNumber.trim() || !messageText.trim()) {
      toast.error('Please enter phone number and message');
      return;
    }

    setSendingMessage(true);
    try {
      await axios.post(`${API_URL}/instances/${id}/messages/send`, {
        phone_number: phoneNumber,
        message: messageText
      });
      toast.success('Message sent successfully');
      setMessageText('');
      fetchMessages();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to send message';
      toast.error(msg);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendBillingMessage = async () => {
    if (!billingPhone.trim() || !customerName.trim() || !amount || !invoiceId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSendingBilling(true);
    try {
      await axios.post(`${API_URL}/instances/${id}/messages/send-billing`, {
        phone_number: billingPhone,
        customer_name: customerName,
        amount: parseFloat(amount),
        currency: currency,
        invoice_id: invoiceId,
        due_date: dueDate || null,
        message_type: messageType
      });
      toast.success('Billing notification sent successfully');
      // Clear form
      setBillingPhone('');
      setCustomerName('');
      setAmount('');
      setInvoiceId('');
      setDueDate('');
      fetchMessages();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to send billing notification';
      toast.error(msg);
    } finally {
      setSendingBilling(false);
    }
  };

  const handleSendInteractiveMessage = async () => {
    if (!interactivePhone.trim() || !interactiveTitle.trim() || !interactiveDescription.trim()) {
      toast.error('Please fill in phone, title and description');
      return;
    }
    
    const validButtons = buttons.filter(b => b.text.trim());
    if (validButtons.length === 0) {
      toast.error('Please add at least one button');
      return;
    }

    setSendingInteractive(true);
    try {
      await axios.post(`${API_URL}/instances/${id}/messages/send-buttons`, {
        phone_number: interactivePhone,
        title: interactiveTitle,
        description: interactiveDescription,
        footer: interactiveFooter || null,
        buttons: validButtons.map((b, i) => ({ id: b.id || `btn_${i}`, text: b.text }))
      });
      toast.success('Interactive message sent successfully');
      // Clear form
      setInteractivePhone('');
      setInteractiveTitle('');
      setInteractiveDescription('');
      setInteractiveFooter('');
      setButtons([{ id: 'btn_1', text: '' }]);
      fetchMessages();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to send interactive message';
      toast.error(msg);
    } finally {
      setSendingInteractive(false);
    }
  };

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { id: `btn_${buttons.length + 1}`, text: '' }]);
    } else {
      toast.error('Maximum 3 buttons allowed');
    }
  };

  const removeButton = (index) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index));
    }
  };

  const updateButton = (index, text) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], text };
    setButtons(newButtons);
  };

  const copyInstanceId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Instance ID copied');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF94]" />
      </div>
    );
  }

  if (!instance) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="instance-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dashboard/instances')}
          className="hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
              {instance.name}
            </h1>
            {instance.status === 'connected' ? (
              <span className="badge badge-success">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </span>
            ) : (
              <span className="badge badge-neutral">
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </span>
            )}
          </div>
          {instance.description && (
            <p className="text-neutral-400 mt-1">{instance.description}</p>
          )}
        </div>
      </div>

      {/* Instance Info Card */}
      <Card className="bg-[#121212] border-white/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Instance ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-neutral-300 truncate">{instance.id}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyInstanceId}
                  className="h-6 w-6 p-0 hover:bg-white/10"
                  data-testid="copy-instance-id-btn"
                >
                  {copied ? <Check className="w-3 h-3 text-[#00FF94]" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="text-sm text-neutral-300">{instance.phone_number || 'Not connected'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm text-neutral-300">
                {new Date(instance.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="qr" className="space-y-6">
        <TabsList className="bg-[#121212] border border-white/10 flex-wrap">
          <TabsTrigger value="qr" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
            QR Code
          </TabsTrigger>
          <TabsTrigger value="send" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
            Text Message
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
            Billing
          </TabsTrigger>
          <TabsTrigger value="interactive" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
            Interactive
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
            Messages
          </TabsTrigger>
        </TabsList>

        {/* QR Code Tab */}
        <TabsContent value="qr">
          <Card className="bg-[#121212] border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                {instance.status === 'connected' ? 'Instance Connected' : 'Scan QR Code'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instance.status === 'connected' ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-[#00FF94]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi className="w-10 h-10 text-[#00FF94]" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Instance is Connected</h3>
                  <p className="text-neutral-400 mb-6">
                    Phone: {instance.phone_number}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect}
                    className="border-[#FF5500]/30 text-[#FF5500] hover:bg-[#FF5500]/10"
                    data-testid="disconnect-btn"
                  >
                    Disconnect Instance
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="qr-container">
                    {qrCode ? (
                      <img 
                        src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                        alt="QR Code" 
                        className="w-64 h-64"
                        data-testid="qr-code-image"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-neutral-200 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-medium">How to connect:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-neutral-400">
                      <li>Open WhatsApp on your phone</li>
                      <li>Tap Menu or Settings and select Linked Devices</li>
                      <li>Tap on Link a Device</li>
                      <li>Point your phone at this QR code to scan it</li>
                    </ol>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={refreshQrCode}
                        className="border-white/10 hover:bg-white/5"
                        data-testid="refresh-qr-btn"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh QR
                      </Button>
                      <Button 
                        onClick={handleConnect}
                        disabled={connecting}
                        className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
                        data-testid="simulate-connect-btn"
                      >
                        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simulate Connect'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Message Tab */}
        <TabsContent value="send">
          <Card className="bg-[#121212] border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Send Test Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {instance.status !== 'connected' ? (
                <div className="text-center py-8 text-neutral-400">
                  <WifiOff className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                  <p>Instance must be connected to send messages</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="254712345678"
                        className="bg-[#0A0A0A] border-white/10 pl-10"
                        data-testid="send-phone-input"
                      />
                    </div>
                    <p className="text-xs text-neutral-500">Enter number with country code (e.g., 254 for Kenya, 1 for USA)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here..."
                      className="bg-[#0A0A0A] border-white/10 min-h-[120px]"
                      data-testid="send-message-input"
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sendingMessage}
                    className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
                    data-testid="send-message-btn"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card className="bg-[#121212] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Message History</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMessages}
                className="border-white/10 hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-4 rounded-lg border ${
                        msg.direction === 'outgoing' 
                          ? 'bg-[#00FF94]/5 border-[#00FF94]/20' 
                          : 'bg-[#0A0A0A] border-white/10'
                      }`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-300">
                          {msg.direction === 'outgoing' ? 'To: ' : 'From: '}{msg.phone_number}
                        </span>
                        <span className={`text-xs ${
                          msg.status === 'sent' ? 'text-[#00FF94]' : 
                          msg.status === 'failed' ? 'text-[#FF5500]' : 'text-neutral-500'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-neutral-400 text-sm">{msg.message}</p>
                      <p className="text-xs text-neutral-600 mt-2">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstanceDetailPage;
