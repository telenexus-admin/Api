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
  Trash2,
  Bot,
  Link,
  Key,
  Power,
  TestTube
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
  
  // Botpress integration state
  const [botpressWebhook, setBotpressWebhook] = useState('');
  const [botpressToken, setBotpressToken] = useState('');
  const [botpressActive, setBotpressActive] = useState(false);
  const [botpressConfigured, setBotpressConfigured] = useState(false);
  const [savingBotpress, setSavingBotpress] = useState(false);
  const [testingBotpress, setTestingBotpress] = useState(false);

  useEffect(() => {
    fetchInstance();
    fetchMessages();
    fetchBotpressConfig();
  }, [id]);

  const fetchBotpressConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/instances/${id}/botpress`);
      if (response.data.webhook_url) {
        setBotpressWebhook(response.data.webhook_url);
        setBotpressActive(response.data.is_active);
        setBotpressConfigured(true);
      }
    } catch (error) {
      // Not configured yet
    }
  };

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

  const handleSaveBotpress = async () => {
    if (!botpressWebhook.trim()) {
      toast.error('Please enter Botpress webhook URL');
      return;
    }

    setSavingBotpress(true);
    try {
      await axios.post(`${API_URL}/instances/${id}/botpress`, {
        webhook_url: botpressWebhook,
        token: botpressToken,
        is_active: botpressActive
      });
      toast.success('Botpress integration saved successfully');
      setBotpressConfigured(true);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to save Botpress configuration';
      toast.error(msg);
    } finally {
      setSavingBotpress(false);
    }
  };

  const handleTestBotpress = async () => {
    setTestingBotpress(true);
    try {
      const response = await axios.post(`${API_URL}/instances/${id}/botpress/test`);
      if (response.data.success) {
        toast.success('Botpress connection successful!');
      } else {
        toast.error(response.data.message || 'Connection test failed');
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to test connection';
      toast.error(msg);
    } finally {
      setTestingBotpress(false);
    }
  };

  const handleToggleBotpress = async () => {
    try {
      await axios.patch(`${API_URL}/instances/${id}/botpress`, {
        is_active: !botpressActive
      });
      setBotpressActive(!botpressActive);
      toast.success(botpressActive ? 'Botpress integration disabled' : 'Botpress integration enabled');
    } catch (error) {
      toast.error('Failed to update Botpress status');
    }
  };

  const handleRemoveBotpress = async () => {
    try {
      await axios.delete(`${API_URL}/instances/${id}/botpress`);
      setBotpressWebhook('');
      setBotpressToken('');
      setBotpressActive(false);
      setBotpressConfigured(false);
      toast.success('Botpress integration removed');
    } catch (error) {
      toast.error('Failed to remove Botpress integration');
    }
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
          {/* Show Billing/Interactive tabs only for billing instances */}
          {instance.instance_type !== 'botpress' && (
            <>
              <TabsTrigger value="billing" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
                Billing
              </TabsTrigger>
              <TabsTrigger value="interactive" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
                Interactive
              </TabsTrigger>
            </>
          )}
          {/* Show Botpress tab only for botpress instances */}
          {instance.instance_type === 'botpress' && (
            <TabsTrigger value="botpress" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Bot className="w-4 h-4 mr-1" />
              Botpress
            </TabsTrigger>
          )}
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

        {/* Billing Messages Tab */}
        <TabsContent value="billing">
          <Card className="bg-[#121212] border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                <CreditCard className="w-5 h-5 inline mr-2 text-[#00FF94]" />
                Send Billing Notification
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Send payment reminders, invoices, and overdue notices with interactive buttons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {instance.status !== 'connected' ? (
                <div className="text-center py-8 text-neutral-400">
                  <WifiOff className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                  <p>Instance must be connected to send messages</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing-phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                          id="billing-phone"
                          value={billingPhone}
                          onChange={(e) => setBillingPhone(e.target.value)}
                          placeholder="254712345678"
                          className="bg-[#0A0A0A] border-white/10 pl-10"
                          data-testid="billing-phone-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-name">Customer Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                          id="customer-name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="John Doe"
                          className="bg-[#0A0A0A] border-white/10 pl-10"
                          data-testid="customer-name-input"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                          id="amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="1500.00"
                          className="bg-[#0A0A0A] border-white/10 pl-10"
                          data-testid="amount-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="bg-[#0A0A0A] border-white/10">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-white/10">
                          <SelectItem value="KES">KES (Kenya Shilling)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                          <SelectItem value="TZS">TZS (Tanzania Shilling)</SelectItem>
                          <SelectItem value="UGX">UGX (Uganda Shilling)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice-id">Invoice ID *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                          id="invoice-id"
                          value={invoiceId}
                          onChange={(e) => setInvoiceId(e.target.value)}
                          placeholder="INV-001"
                          className="bg-[#0A0A0A] border-white/10 pl-10"
                          data-testid="invoice-id-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date (Optional)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                          id="due-date"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="bg-[#0A0A0A] border-white/10 pl-10"
                          data-testid="due-date-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message-type">Message Type *</Label>
                      <Select value={messageType} onValueChange={setMessageType}>
                        <SelectTrigger className="bg-[#0A0A0A] border-white/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-white/10">
                          <SelectItem value="payment_reminder">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                              Payment Reminder
                            </div>
                          </SelectItem>
                          <SelectItem value="invoice">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              New Invoice
                            </div>
                          </SelectItem>
                          <SelectItem value="overdue">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              Overdue Notice
                            </div>
                          </SelectItem>
                          <SelectItem value="confirmation">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Payment Confirmation
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-[#0A0A0A] rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Message Preview</p>
                    <div className="bg-[#1a1a1a] rounded-lg p-3 text-sm text-neutral-300">
                      <p className="font-medium text-white mb-1">
                        {messageType === 'payment_reminder' && 'Payment Due Reminder'}
                        {messageType === 'invoice' && 'New Invoice Generated'}
                        {messageType === 'overdue' && 'Payment Overdue Notice'}
                        {messageType === 'confirmation' && 'Payment Received'}
                      </p>
                      <p className="text-neutral-400">
                        Dear {customerName || '[Customer Name]'},
                        {messageType === 'payment_reminder' && ` your payment of ${currency} ${amount || '0'} is due.`}
                        {messageType === 'invoice' && ` a new invoice of ${currency} ${amount || '0'} has been generated.`}
                        {messageType === 'overdue' && ` your account is OVERDUE. Outstanding: ${currency} ${amount || '0'}.`}
                        {messageType === 'confirmation' && ` we received your payment of ${currency} ${amount || '0'}.`}
                      </p>
                      <p className="text-neutral-500 text-xs mt-2">Invoice: #{invoiceId || 'INV-XXX'}</p>
                      <div className="flex gap-2 mt-3">
                        {messageType !== 'confirmation' && (
                          <span className="bg-[#00FF94]/20 text-[#00FF94] px-3 py-1 rounded-full text-xs">PayNow</span>
                        )}
                        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">Invoice</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSendBillingMessage}
                    disabled={sendingBilling}
                    className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold w-full"
                    data-testid="send-billing-btn"
                  >
                    {sendingBilling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Send Billing Notification
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactive Messages Tab */}
        <TabsContent value="interactive">
          <Card className="bg-[#121212] border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                <MessageSquare className="w-5 h-5 inline mr-2 text-[#00FF94]" />
                Send Interactive Message
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Create custom messages with up to 3 interactive buttons
              </CardDescription>
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
                    <Label htmlFor="interactive-phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="interactive-phone"
                        value={interactivePhone}
                        onChange={(e) => setInteractivePhone(e.target.value)}
                        placeholder="254712345678"
                        className="bg-[#0A0A0A] border-white/10 pl-10"
                        data-testid="interactive-phone-input"
                      />
                    </div>
                    <p className="text-xs text-neutral-500">Enter number with country code</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interactive-title">Title * (max 60 chars)</Label>
                    <Input
                      id="interactive-title"
                      value={interactiveTitle}
                      onChange={(e) => setInteractiveTitle(e.target.value.slice(0, 60))}
                      placeholder="Message Title"
                      className="bg-[#0A0A0A] border-white/10"
                      data-testid="interactive-title-input"
                    />
                    <p className="text-xs text-neutral-500">{interactiveTitle.length}/60</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interactive-description">Description * (max 1024 chars)</Label>
                    <Textarea
                      id="interactive-description"
                      value={interactiveDescription}
                      onChange={(e) => setInteractiveDescription(e.target.value.slice(0, 1024))}
                      placeholder="Your message content here..."
                      className="bg-[#0A0A0A] border-white/10 min-h-[100px]"
                      data-testid="interactive-description-input"
                    />
                    <p className="text-xs text-neutral-500">{interactiveDescription.length}/1024</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interactive-footer">Footer (optional, max 60 chars)</Label>
                    <Input
                      id="interactive-footer"
                      value={interactiveFooter}
                      onChange={(e) => setInteractiveFooter(e.target.value.slice(0, 60))}
                      placeholder="Footer text"
                      className="bg-[#0A0A0A] border-white/10"
                      data-testid="interactive-footer-input"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Buttons * (max 3, 20 chars each)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addButton}
                        disabled={buttons.length >= 3}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Button
                      </Button>
                    </div>
                    {buttons.map((button, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={button.text}
                          onChange={(e) => updateButton(index, e.target.value.slice(0, 20))}
                          placeholder={`Button ${index + 1} text`}
                          className="bg-[#0A0A0A] border-white/10"
                          data-testid={`button-${index}-input`}
                        />
                        {buttons.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeButton(index)}
                            className="hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="bg-[#0A0A0A] rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Message Preview</p>
                    <div className="bg-[#1a1a1a] rounded-lg p-3 text-sm text-neutral-300">
                      <p className="font-medium text-white mb-1">{interactiveTitle || '[Title]'}</p>
                      <p className="text-neutral-400 whitespace-pre-wrap">{interactiveDescription || '[Description]'}</p>
                      {interactiveFooter && <p className="text-neutral-500 text-xs mt-2">{interactiveFooter}</p>}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {buttons.filter(b => b.text).map((btn, i) => (
                          <span key={i} className="bg-[#00FF94]/20 text-[#00FF94] px-3 py-1 rounded-full text-xs">
                            {btn.text}
                          </span>
                        ))}
                        {buttons.filter(b => b.text).length === 0 && (
                          <span className="text-neutral-600 text-xs">[Add buttons above]</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSendInteractiveMessage}
                    disabled={sendingInteractive}
                    className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold w-full"
                    data-testid="send-interactive-btn"
                  >
                    {sendingInteractive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Interactive Message
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Botpress Integration Tab */}
        <TabsContent value="botpress">
          <Card className="bg-[#121212] border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                <Bot className="w-5 h-5 inline mr-2 text-[#00FF94]" />
                Botpress Integration
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Connect this instance to your Botpress bot to automate responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Banner */}
              {botpressConfigured && (
                <div className={`p-4 rounded-lg border ${botpressActive ? 'bg-[#00FF94]/10 border-[#00FF94]/30' : 'bg-neutral-800/50 border-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${botpressActive ? 'bg-[#00FF94] animate-pulse' : 'bg-neutral-500'}`} />
                      <span className="font-medium">
                        {botpressActive ? 'Botpress Active' : 'Botpress Disabled'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleBotpress}
                      className={botpressActive ? 'border-[#FF5500]/30 text-[#FF5500] hover:bg-[#FF5500]/10' : 'border-[#00FF94]/30 text-[#00FF94] hover:bg-[#00FF94]/10'}
                    >
                      <Power className="w-4 h-4 mr-1" />
                      {botpressActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Configuration Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="botpress-webhook">Botpress Webhook URL *</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <Input
                      id="botpress-webhook"
                      value={botpressWebhook}
                      onChange={(e) => setBotpressWebhook(e.target.value)}
                      placeholder="https://your-botpress-instance.com/webhook"
                      className="bg-[#0A0A0A] border-white/10 pl-10"
                      data-testid="botpress-webhook-input"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Enter your Botpress webhook URL where messages will be forwarded
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botpress-token">Authentication Token (optional)</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <Input
                      id="botpress-token"
                      type="password"
                      value={botpressToken}
                      onChange={(e) => setBotpressToken(e.target.value)}
                      placeholder="Enter your Botpress token"
                      className="bg-[#0A0A0A] border-white/10 pl-10"
                      data-testid="botpress-token-input"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Optional authentication token for securing the webhook
                  </p>
                </div>

                {/* How it works section */}
                <div className="bg-[#0A0A0A] rounded-lg p-4 border border-white/10">
                  <p className="text-sm font-medium text-white mb-3">How it works:</p>
                  <div className="space-y-2 text-sm text-neutral-400">
                    <div className="flex items-start gap-2">
                      <span className="bg-[#00FF94]/20 text-[#00FF94] px-2 py-0.5 rounded text-xs">1</span>
                      <span>User sends WhatsApp message to your number</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-[#00FF94]/20 text-[#00FF94] px-2 py-0.5 rounded text-xs">2</span>
                      <span>Message is forwarded to your Botpress webhook</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-[#00FF94]/20 text-[#00FF94] px-2 py-0.5 rounded text-xs">3</span>
                      <span>Botpress processes and sends reply to:</span>
                    </div>
                    <div className="ml-6 mt-1">
                      <code className="text-xs bg-neutral-800 px-2 py-1 rounded text-[#00FF94] break-all">
                        POST {process.env.REACT_APP_BACKEND_URL}/api/botpress/reply
                      </code>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-[#00FF94]/20 text-[#00FF94] px-2 py-0.5 rounded text-xs">4</span>
                      <span>Reply is sent back to user via WhatsApp</span>
                    </div>
                  </div>
                </div>

                {/* Reply endpoint info */}
                <div className="bg-[#0A0A0A] rounded-lg p-4 border border-white/10">
                  <p className="text-sm font-medium text-white mb-2">Botpress Reply Endpoint:</p>
                  <code className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300 break-all">
                    POST {process.env.REACT_APP_BACKEND_URL}/api/botpress/reply
                  </code>
                  <p className="text-xs text-neutral-500 mt-2">
                    Configure your Botpress to send replies to this endpoint with JSON body:
                  </p>
                  <pre className="text-xs bg-neutral-800 p-2 rounded mt-2 text-neutral-400 overflow-x-auto">
{`{
  "instance_id": "${id}",
  "phone_number": "254712345678",
  "message": "Bot reply message"
}`}
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveBotpress}
                    disabled={savingBotpress || !botpressWebhook.trim()}
                    className="bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold flex-1"
                    data-testid="save-botpress-btn"
                  >
                    {savingBotpress ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                  
                  {botpressConfigured && (
                    <>
                      <Button 
                        onClick={handleTestBotpress}
                        disabled={testingBotpress}
                        variant="outline"
                        className="border-white/10 hover:bg-white/5"
                        data-testid="test-botpress-btn"
                      >
                        {testingBotpress ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <TestTube className="w-4 h-4 mr-2" />
                            Test
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={handleRemoveBotpress}
                        variant="outline"
                        className="border-[#FF5500]/30 text-[#FF5500] hover:bg-[#FF5500]/10"
                        data-testid="remove-botpress-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
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
                        <div className="flex items-center gap-2">
                          {msg.message_type && msg.message_type !== 'text' && (
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded">
                              {msg.message_type.replace('billing_', '').replace('_', ' ')}
                            </span>
                          )}
                          <span className={`text-xs ${
                            msg.status === 'sent' ? 'text-[#00FF94]' : 
                            msg.status === 'failed' ? 'text-[#FF5500]' : 'text-neutral-500'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-neutral-400 text-sm whitespace-pre-wrap">{msg.message}</p>
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
