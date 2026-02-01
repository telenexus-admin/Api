# Evolution API Webhook - Quick Start Guide

## What Was Added

### 1. Backend Webhook Endpoint
**Endpoint:** `POST /api/webhooks/evolution/{evolution_instance_name}`

This endpoint receives incoming WhatsApp messages from Evolution API and:
- ✅ Stores messages in your database
- ✅ Forwards to Botpress (if configured)
- ✅ Triggers your custom webhooks
- ✅ Handles text, images, videos, audio, and documents

### 2. Frontend UI (Botpress Tab)
Added a new section showing:
- ✅ Your Evolution webhook URL
- ✅ One-click copy button
- ✅ Setup instructions
- ✅ Green highlighted styling

## How to Use

### Step 1: Access Your Instance
1. Login to your Telenexus dashboard
2. Go to **Instances** page
3. Click on a **Botpress instance** (not billing instance)

### Step 2: Get Your Webhook URL
1. Navigate to the **Botpress** tab
2. Scroll to **"Evolution API Webhook URL"** section
3. Click **"Copy URL"** button
4. Your webhook URL format: `https://api.telenexustechnologies.com/api/webhooks/evolution/{your_instance_name}`

### Step 3: Configure in Evolution API
1. Open your Evolution API dashboard at `https://evoapi.telenexustechnologies.com`
2. Select your instance
3. Go to **Webhooks** settings
4. Add the webhook URL you copied
5. Enable the `MESSAGES_UPSERT` event
6. **Save** the configuration

### Step 4: Test the Integration
1. Send a WhatsApp message to your instance number
2. Check your Telenexus **Messages** tab - incoming message should appear
3. If Botpress is configured, it should receive the message and respond

## Example Webhook Payload (from Evolution API)

Evolution API will send this format when someone messages you:

```json
{
  "event": "messages.upsert",
  "instance": "your_instance_name",
  "data": {
    "messages": [{
      "key": {
        "remoteJid": "254712345678@s.whatsapp.net",
        "fromMe": false,
        "id": "MSG_ID_123"
      },
      "message": {
        "conversation": "Hello! I need help."
      },
      "messageType": "conversation",
      "pushName": "John Doe"
    }]
  }
}
```

## What Happens Next?

### If Botpress is Configured:
1. Message arrives → Stored in database
2. Forwarded to your Botpress webhook
3. Botpress processes and generates reply
4. Reply sent via `/api/botpress/reply`
5. Reply delivered to WhatsApp user via Evolution API

### If Botpress Not Configured:
1. Message arrives → Stored in database
2. Available in Messages tab
3. Can be viewed in message history
4. Custom webhooks triggered (if configured)

## Troubleshooting

### Webhook Not Receiving Messages
1. ✅ Verify webhook URL is correct in Evolution API
2. ✅ Check `MESSAGES_UPSERT` event is enabled
3. ✅ Confirm instance is connected (shows "Connected" status)
4. ✅ Check Evolution API logs for delivery errors

### Messages Not Forwarding to Botpress
1. ✅ Verify Botpress webhook URL is configured
2. ✅ Check "Botpress Active" status is enabled
3. ✅ Test Botpress connection using the "Test" button
4. ✅ Review backend logs: `tail -f /var/log/supervisor/backend.out.log`

### Backend Logs
```bash
# View backend logs
tail -f /var/log/supervisor/backend.out.log

# Search for webhook activity
grep "Evolution webhook received" /var/log/supervisor/backend.out.log
```

## API Reference

### Evolution Webhook Endpoint
```
POST /api/webhooks/evolution/{evolution_instance_name}
Content-Type: application/json

Body: Evolution API webhook payload (see example above)

Response:
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### Botpress Reply Endpoint (Already Existed)
```
POST /api/botpress/reply
Content-Type: application/json

Body:
{
  "instance_id": "your_instance_id",
  "phone_number": "254712345678",
  "message": "Bot response message"
}

Response:
{
  "success": true,
  "message_id": "uuid"
}
```

## Supported Message Types

| Type | Description | Stored As |
|------|-------------|-----------|
| Text | Plain text messages | Actual text content |
| Extended Text | Text with formatting | Extracted text |
| Image | Images with/without captions | `[Image] caption` |
| Video | Videos with/without captions | `[Video] caption` |
| Audio | Voice messages | `[Audio Message]` |
| Document | File attachments | `[Document] filename` |

## Security Notes

- ⚠️ **No authentication** required for webhook (as requested)
- ✅ Instance validation ensures only valid instances process messages
- ✅ Background processing prevents blocking
- ✅ Error handling prevents crashes on malformed payloads
- 💡 **Recommendation**: Consider adding webhook signature verification in production

## Database Schema

### Incoming Messages Stored As:
```json
{
  "id": "uuid",
  "instance_id": "your_instance_id",
  "phone_number": "254712345678",
  "message": "Message content",
  "message_type": "conversation",
  "direction": "incoming",
  "status": "received",
  "sender_name": "Sender Name",
  "evolution_message_id": "MSG_ID_FROM_EVOLUTION",
  "created_at": "2026-02-01T10:00:00Z"
}
```

## Support

For issues or questions:
1. Check backend logs: `/var/log/supervisor/backend.out.log`
2. Check Evolution API dashboard for webhook delivery status
3. Test endpoint manually with curl (see IMPLEMENTATION_SUMMARY.md)
4. Review message history in Messages tab

## Files Modified

1. `/app/backend/server.py` - Added webhook endpoint (~120 lines)
2. `/app/frontend/src/pages/InstanceDetailPage.js` - Added webhook URL UI (~40 lines)

---

**Last Updated:** 2026-02-01  
**Status:** ✅ Deployed and Running  
**Version:** 1.0.0
