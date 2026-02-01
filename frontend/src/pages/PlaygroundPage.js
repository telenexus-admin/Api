import { useState, useEffect } from 'react';
import { 
  Code2, 
  Play, 
  Copy, 
  Check,
  Loader2,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const PlaygroundPage = () => {
  const [instances, setInstances] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(null);

  // Form state
  const [selectedInstance, setSelectedInstance] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Hello from Telenexus!');
  const [response, setResponse] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [instancesRes, apiKeysRes] = await Promise.all([
        axios.get(`${API_URL}/instances`),
        axios.get(`${API_URL}/api-keys`)
      ]);
      setInstances(instancesRes.data);
      setApiKeys(apiKeysRes.data);
      
      if (instancesRes.data.length > 0) {
        setSelectedInstance(instancesRes.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const executeRequest = async () => {
    if (!selectedInstance) {
      toast.error('Please select an instance');
      return;
    }
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }
    if (!message) {
      toast.error('Please enter a message');
      return;
    }

    setExecuting(true);
    setResponse(null);

    try {
      const res = await axios.post(`${API_URL}/instances/${selectedInstance}/messages/send`, {
        phone_number: phoneNumber,
        message: message,
        message_type: 'text'
      });
      setResponse({
        status: 200,
        data: res.data,
        success: true
      });
      toast.success('Request successful');
    } catch (error) {
      setResponse({
        status: error.response?.status || 500,
        data: error.response?.data || { error: error.message },
        success: false
      });
      toast.error('Request failed');
    } finally {
      setExecuting(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const generateCurlCommand = () => {
    return `curl -X POST "${BASE_URL}/api/v1/send-message?instance_id=${selectedInstance}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "phone_number": "${phoneNumber || '+1234567890'}",
    "message": "${message}",
    "message_type": "text"
  }'`;
  };

  const generatePythonCode = () => {
    return `import requests

url = "${BASE_URL}/api/v1/send-message"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "phone_number": "${phoneNumber || '+1234567890'}",
    "message": "${message}",
    "message_type": "text"
}
params = {"instance_id": "${selectedInstance}"}

response = requests.post(url, json=data, headers=headers, params=params)
print(response.json())`;
  };

  const generateNodeCode = () => {
    return `const axios = require('axios');

const sendMessage = async () => {
  const response = await axios.post(
    '${BASE_URL}/api/v1/send-message',
    {
      phone_number: '${phoneNumber || '+1234567890'}',
      message: '${message}',
      message_type: 'text'
    },
    {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      params: { instance_id: '${selectedInstance}' }
    }
  );
  
  console.log(response.data);
};

sendMessage();`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF94]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="playground-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
          API Playground
        </h1>
        <p className="text-neutral-400">
          Test your API integration before deploying to production
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Builder */}
        <Card className="bg-[#121212] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
              <Code2 className="w-5 h-5 text-[#00FF94]" />
              Request Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Instance</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10" data-testid="playground-instance-select">
                  <SelectValue placeholder="Select an instance" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10">
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name} ({instance.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="bg-[#0A0A0A] border-white/10"
                data-testid="playground-phone-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="bg-[#0A0A0A] border-white/10 min-h-[100px]"
                data-testid="playground-message-input"
              />
            </div>

            <Button 
              onClick={executeRequest}
              disabled={executing || !selectedInstance}
              className="w-full bg-[#00FF94] text-black hover:bg-[#00CC76] font-bold"
              data-testid="playground-send-btn"
            >
              {executing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>

            {/* Response */}
            {response && (
              <div className="mt-4">
                <Label className="mb-2 block">Response</Label>
                <div className={`code-block p-4 scanlines ${response.success ? 'border-[#00FF94]/30' : 'border-[#FF5500]/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${response.success ? 'text-[#00FF94]' : 'text-[#FF5500]'}`}>
                      Status: {response.status}
                    </span>
                  </div>
                  <pre className="text-xs text-neutral-300 overflow-x-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="bg-[#121212] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
              <ExternalLink className="w-5 h-5 text-[#00FF94]" />
              Code Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl" className="space-y-4">
              <TabsList className="bg-[#0A0A0A] border border-white/10">
                <TabsTrigger value="curl" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
                  cURL
                </TabsTrigger>
                <TabsTrigger value="python" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
                  Python
                </TabsTrigger>
                <TabsTrigger value="node" className="data-[state=active]:bg-[#00FF94] data-[state=active]:text-black">
                  Node.js
                </TabsTrigger>
              </TabsList>

              <TabsContent value="curl">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generateCurlCommand(), 'curl')}
                    className="absolute top-2 right-2 hover:bg-white/10"
                    data-testid="copy-curl-btn"
                  >
                    {copied === 'curl' ? <Check className="w-4 h-4 text-[#00FF94]" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <div className="code-block p-4 scanlines">
                    <pre className="text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap">
                      {generateCurlCommand()}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="python">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatePythonCode(), 'python')}
                    className="absolute top-2 right-2 hover:bg-white/10"
                    data-testid="copy-python-btn"
                  >
                    {copied === 'python' ? <Check className="w-4 h-4 text-[#00FF94]" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <div className="code-block p-4 scanlines">
                    <pre className="text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap">
                      {generatePythonCode()}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="node">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generateNodeCode(), 'node')}
                    className="absolute top-2 right-2 hover:bg-white/10"
                    data-testid="copy-node-btn"
                  >
                    {copied === 'node' ? <Check className="w-4 h-4 text-[#00FF94]" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <div className="code-block p-4 scanlines">
                    <pre className="text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap">
                      {generateNodeCode()}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* API Endpoints Reference */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="font-medium mb-4">API Endpoints</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="method-post font-mono text-xs px-2 py-1 bg-blue-500/10 rounded">POST</span>
                  <div>
                    <code className="text-neutral-300">/api/v1/send-message</code>
                    <p className="text-neutral-500 text-xs mt-1">Send a message via instance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="method-get font-mono text-xs px-2 py-1 bg-[#00FF94]/10 rounded">GET</span>
                  <div>
                    <code className="text-neutral-300">/api/v1/instance-status</code>
                    <p className="text-neutral-500 text-xs mt-1">Get instance connection status</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="method-get font-mono text-xs px-2 py-1 bg-[#00FF94]/10 rounded">GET</span>
                  <div>
                    <code className="text-neutral-300">/api/instances/{'{id}'}/messages</code>
                    <p className="text-neutral-500 text-xs mt-1">Get message history</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlaygroundPage;
