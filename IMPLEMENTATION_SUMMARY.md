# Evolution API Webhook Implementation Summary

## Overview
Successfully added Evolution API webhook endpoint to receive incoming WhatsApp messages and integrated it with the Botpress configuration UI.

## Changes Made

### 1. Backend Changes (`/app/backend/server.py`)

#### New Endpoint Added (Line ~1458)
```python
@api_router.post("/webhooks/evolution/{evolution_instance_name}")
async def receive_evolution_webhook(evolution_instance_name, request, background_tasks)
```

**Functionality:**
- Receives incoming WhatsApp messages from Evolution API
- Processes `messages.upsert` events
- Extracts message content from various message types (text, image, video, audio, document)
- Stores incoming messages in MongoDB with direction="incoming"
- Automatically forwards messages to Botpress if instance type is "botpress" and configured
- Triggers user-configured webhooks for the "message.received" event

**Supported Message Types:**
- Plain text (`conversation`)
- Extended text (`extendedTextMessage`)
- Images with captions (`imageMessage`)
- Videos with captions (`videoMessage`)
- Audio messages (`audioMessage`)
- Documents (`documentMessage`)

**Webhook Payload Structure (from Evolution API):**
```json
{
  "event": "messages.upsert",
  "instance": "instance-name",
  "data": {
    "messages": [{
      "key": {
        "remoteJid": "254712345678@s.whatsapp.net",
        "fromMe": false,
        "id": "MSG_ID"
      },
      "message": {
        "conversation": "Message text"
      },
      "messageType": "conversation",
      "pushName": "Sender Name"
    }]
  }
}
```

### 2. Frontend Changes (`/app/frontend/src/pages/InstanceDetailPage.js`)

#### New State Variable (Line ~86)
```javascript
const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
```

#### New Function (Line ~348)
```javascript
const copyWebhookUrl = () => {
  // Copies Evolution webhook URL to clipboard
}
```

#### New UI Section in Botpress Tab (Line ~1081)
Added a new section displaying:
- **Evolution API Webhook URL** with copy button
- Full webhook URL: `{BACKEND_URL}/api/webhooks/evolution/{evolution_instance_name}`
- Step-by-step instructions for configuring in Evolution API
- Highlighted styling to differentiate from other sections

**UI Features:**
- ✅ Copy button with success feedback
- ✅ URL displayed with monospace font and green highlighting
- ✅ Clear instructions with numbered steps
- ✅ Shows the specific Evolution instance name for the current instance

## How It Works

### Message Flow:
1. **User sends WhatsApp message** → Evolution API receives it
2. **Evolution API** → Forwards to webhook: `POST /api/webhooks/evolution/{instance_name}`
3. **Backend webhook endpoint**:
   - Validates instance exists
   - Stores message in database
   - Forwards to Botpress webhook (if configured)
   - Triggers user webhooks
4. **Botpress** processes message and sends reply via `/api/botpress/reply`
5. **Backend** sends reply back to WhatsApp via Evolution API

### Configuration Steps (for users):

1. Navigate to Instance Detail page for a Botpress instance
2. Go to the "Botpress" tab
3. Locate the "Evolution API Webhook URL" section
4. Click "Copy URL" button
5. In Evolution API dashboard:
   - Select the instance
   - Navigate to Webhooks settings
   - Paste the webhook URL
   - Enable `MESSAGES_UPSERT` event
   - Save configuration

## Testing

### Test the Webhook Endpoint:
```bash
curl -X POST http://localhost:8001/api/webhooks/evolution/{your_instance_name} \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "your_instance_name",
    "data": {
      "messages": [{
        "key": {
          "remoteJid": "254712345678@s.whatsapp.net",
          "fromMe": false,
          "id": "TEST_MSG_123"
        },
        "message": {
          "conversation": "Hello from WhatsApp!"
        },
        "messageType": "conversation",
        "pushName": "Test User"
      }]
    }
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Files Modified

1. `/app/backend/server.py` - Added webhook endpoint
2. `/app/frontend/src/pages/InstanceDetailPage.js` - Added UI for webhook URL display

## Dependencies

No new dependencies required. Uses existing:
- FastAPI (backend)
- httpx (for Botpress forwarding)
- React with existing UI components (frontend)

## Security Notes

- **No authentication required** for the webhook endpoint (as requested)
- Instance validation ensures only valid instances can receive messages
- Background tasks prevent blocking on external webhook calls
- Error handling prevents crashes on malformed payloads

## Next Steps (Optional Enhancements)

1. Add webhook authentication option (API key or secret token)
2. Add webhook delivery logs/history
3. Add webhook retry mechanism for failed deliveries
4. Add rate limiting to prevent abuse
5. Add webhook signature verification from Evolution API

## Deployment Status

✅ Backend updated and running
✅ Frontend updated and running
✅ Services restarted successfully
✅ Webhook endpoint tested and responding correctly

## API Endpoint Reference

### Evolution Webhook Endpoint
- **URL**: `POST /api/webhooks/evolution/{evolution_instance_name}`
- **Authentication**: None required
- **Content-Type**: `application/json`
- **Response**: `{"success": true, "message": "Webhook processed successfully"}`

### Related Endpoints
- `POST /api/instances/{id}/botpress` - Configure Botpress integration
- `POST /api/botpress/reply` - Receive replies from Botpress
- `POST /api/instances/{id}/botpress/test` - Test Botpress connection
