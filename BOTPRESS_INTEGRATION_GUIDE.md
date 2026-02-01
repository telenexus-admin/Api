# Complete Botpress Integration Guide

## Overview
This guide walks you through connecting your Telenexus WhatsApp instance with Botpress for AI-powered chatbot responses.

## Integration Architecture

```
WhatsApp User
    ↓ (sends message)
Evolution API
    ↓ (webhook)
Telenexus Backend (/api/webhooks/evolution/{instance_name})
    ↓ (forwards message)
Botpress Webhook (your Botpress instance)
    ↓ (processes & generates reply)
Telenexus Backend (/api/botpress/reply)
    ↓ (sends reply)
Evolution API
    ↓ (delivers)
WhatsApp User
```

## Prerequisites

✅ Telenexus instance created (type: "botpress")
✅ Evolution API instance connected
✅ Botpress bot created and published
✅ All changes from this implementation deployed

---

## Part 1: Configure Evolution API Webhook (Receive Messages)

### Step 1.1: Get Your Webhook URL
1. Login to your Telenexus dashboard at `https://api.telenexustechnologies.com`
2. Navigate to **Instances** page
3. Click on your **Botpress instance**
4. Go to the **Botpress** tab
5. Find the section **"Evolution API Webhook URL"**
6. Click **"Copy URL"** button

Your webhook URL will look like:
```
https://api.telenexustechnologies.com/api/webhooks/evolution/tnx_bot_xxxxxx_InstanceName
```

### Step 1.2: Configure in Evolution API
1. Open Evolution API dashboard: `https://evoapi.telenexustechnologies.com`
2. Login with your credentials
3. Find your instance in the list
4. Click **Settings** or **Webhooks** for that instance
5. Add the webhook URL you copied
6. **Enable these events:**
   - ✅ `MESSAGES_UPSERT` (for incoming messages)
   - Optional: `MESSAGES_UPDATE` (for message status)
7. Click **Save**

### Step 1.3: Verify Evolution Webhook
Test the webhook is configured correctly:

```bash
# From your terminal, send a test webhook
curl -X POST https://api.telenexustechnologies.com/api/webhooks/evolution/YOUR_INSTANCE_NAME \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "YOUR_INSTANCE_NAME",
    "data": {
      "messages": [{
        "key": {
          "remoteJid": "254712345678@s.whatsapp.net",
          "fromMe": false,
          "id": "TEST123"
        },
        "message": {
          "conversation": "Test message"
        },
        "messageType": "conversation",
        "pushName": "Test User"
      }]
    }
  }'
```

Expected response:
```json
{"success": true, "message": "Webhook processed successfully"}
```

---

## Part 2: Configure Botpress (Forward Messages from Telenexus)

### Step 2.1: Create Botpress Webhook Endpoint

In your Botpress bot, you need to create a webhook that receives messages from Telenexus.

#### Option A: Using Botpress Cloud (Recommended)

1. Login to your Botpress Cloud dashboard
2. Select your bot
3. Go to **Integrations** → **Webhooks**
4. Create a new webhook endpoint
5. Copy the webhook URL (e.g., `https://webhook.botpress.cloud/YOUR_BOT_ID`)

#### Option B: Using Self-Hosted Botpress

1. Deploy your Botpress instance
2. Your webhook endpoint will be at: `https://your-botpress.com/api/v1/bots/YOUR_BOT_ID/converse`
3. Generate an API token from Botpress settings

### Step 2.2: Configure Botpress in Telenexus

1. Go back to your Telenexus dashboard
2. Open your Botpress instance
3. Navigate to **Botpress** tab
4. Fill in the configuration:

   **Botpress Webhook URL:** (from Step 2.1)
   ```
   https://webhook.botpress.cloud/YOUR_BOT_ID
   ```
   
   **Authentication Token:** (optional, if required by your Botpress)
   ```
   Your Botpress API token
   ```
   
   **Status:** Make sure toggle is **Active** (green)

5. Click **"Save Configuration"**
6. Click **"Test"** button to verify connection

✅ If successful, you'll see: "Botpress connection successful!"
❌ If failed, check your webhook URL and token

---

## Part 3: Configure Botpress Reply Endpoint (Send Responses)

Botpress needs to know where to send replies. Configure this in your Botpress bot.

### Step 3.1: Add Telenexus Reply URL to Botpress

Your Botpress bot should send replies to:
```
POST https://api.telenexustechnologies.com/api/botpress/reply
```

### Step 3.2: Configure Botpress Outgoing Webhook

#### For Botpress Cloud:
1. In your Botpress dashboard, go to **Code** section
2. Add a **Before Outgoing Hook**:

```javascript
// Before Outgoing Hook
async function hook(bp, event) {
  const axios = require('axios');
  
  if (event.type === 'text') {
    try {
      await axios.post('https://api.telenexustechnologies.com/api/botpress/reply', {
        instance_id: event.state.user.instance_id,
        phone_number: event.state.user.phone_number,
        message: event.preview
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to send reply to Telenexus:', error);
    }
  }
}

return hook(bp, event);
```

#### For Self-Hosted Botpress:
Add similar code in your bot's hooks or use Botpress' HTTP module to send POST requests.

### Step 3.3: Handle Incoming Messages in Botpress

When Telenexus forwards a message to Botpress, it sends this payload:

```json
{
  "type": "text",
  "text": "User's message",
  "userId": "254712345678",
  "conversationId": "instance_id_254712345678",
  "messageId": "uuid",
  "instance_id": "your_instance_id",
  "phone_number": "254712345678",
  "timestamp": "2026-02-01T10:00:00Z"
}
```

Make sure your Botpress bot can parse this format.

---

## Part 4: Testing the Full Integration

### Test 4.1: Send Test Message via WhatsApp
1. Use your phone to send a WhatsApp message to your connected number
2. Message should flow:
   - WhatsApp → Evolution API → Telenexus Webhook → Stored in DB → Forwarded to Botpress

### Test 4.2: Verify in Telenexus
1. Go to your instance in Telenexus
2. Check **Messages** tab
3. You should see the incoming message with:
   - Direction: "incoming"
   - Status: "received"
   - Sender phone number
   - Message content

### Test 4.3: Check Botpress Received Message
1. Open Botpress dashboard
2. Go to **Analytics** or **Conversations**
3. You should see the incoming message
4. Check if bot generated a response

### Test 4.4: Verify Reply Sent Back
1. Check your WhatsApp phone
2. You should receive the bot's reply
3. Check Telenexus **Messages** tab
4. You should see the outgoing reply with:
   - Direction: "outgoing"
   - Message type: "botpress_reply"

---

## Part 5: Debugging & Troubleshooting

### Issue: Messages not reaching Telenexus
**Check Evolution API webhook:**
```bash
# View Telenexus backend logs
tail -f /var/log/supervisor/backend.out.log | grep "Evolution webhook"
```

**Verify:**
- Evolution webhook URL is correct
- `MESSAGES_UPSERT` event is enabled
- Instance is connected in Evolution API

### Issue: Messages not forwarding to Botpress
**Check Botpress configuration:**
1. Verify webhook URL in Telenexus is correct
2. Check Botpress is "Active" (green toggle)
3. Test connection using "Test" button

**View logs:**
```bash
# Check for Botpress forwarding errors
tail -f /var/log/supervisor/backend.out.log | grep "Botpress"
```

### Issue: Bot replies not reaching WhatsApp
**Check reply endpoint:**
```bash
# Test reply endpoint manually
curl -X POST https://api.telenexustechnologies.com/api/botpress/reply \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "YOUR_INSTANCE_ID",
    "phone_number": "254712345678",
    "message": "Test reply from Botpress"
  }'
```

**Verify:**
- Botpress has correct reply endpoint configured
- Instance is connected in Evolution API
- Evolution API can send messages

### View All Logs
```bash
# Backend logs (shows webhook activity)
tail -f /var/log/supervisor/backend.out.log

# Search for specific errors
grep -i error /var/log/supervisor/backend.err.log

# Check Evolution API webhook deliveries
# (Check in Evolution API dashboard)
```

---

## Part 6: Advanced Configuration

### Add Message Context to Botpress
Modify the forwarding to include more context:

In `/app/backend/server.py`, the `forward_to_botpress` function already includes:
- User ID (phone number)
- Conversation ID (instance + phone)
- Message ID
- Timestamp

You can extend this to include:
- User name (pushName)
- Message type
- Previous conversation history

### Handle Different Message Types in Botpress
Current implementation forwards:
- Text messages → Plain text
- Images → `[Image] caption`
- Videos → `[Video] caption`
- Audio → `[Audio Message]`
- Documents → `[Document] filename`

Configure your Botpress bot to handle these formats appropriately.

### Add Webhook Signature Verification (Security)
For production, consider adding:
1. Shared secret between Evolution API and Telenexus
2. HMAC signature verification
3. Timestamp validation to prevent replay attacks

---

## Quick Reference

### Key URLs
| Purpose | URL |
|---------|-----|
| Telenexus Dashboard | https://api.telenexustechnologies.com |
| Evolution API Dashboard | https://evoapi.telenexustechnologies.com |
| Evolution Webhook Endpoint | https://api.telenexustechnologies.com/api/webhooks/evolution/{instance_name} |
| Botpress Reply Endpoint | https://api.telenexustechnologies.com/api/botpress/reply |

### Important Fields
| Field | Description | Example |
|-------|-------------|---------|
| evolution_instance_name | Your Evolution instance name | `tnx_bot_abc123_MyBot` |
| instance_id | Telenexus instance UUID | `550e8400-e29b-41d4-a716-446655440000` |
| phone_number | WhatsApp number (no @s.whatsapp.net) | `254712345678` |

### API Payloads

**Incoming to Telenexus (from Evolution API):**
```json
{
  "event": "messages.upsert",
  "instance": "instance_name",
  "data": {
    "messages": [/* message objects */]
  }
}
```

**Forward to Botpress (from Telenexus):**
```json
{
  "type": "text",
  "text": "message content",
  "userId": "phone_number",
  "conversationId": "instance_id_phone",
  "messageId": "uuid",
  "instance_id": "uuid",
  "phone_number": "254712345678",
  "timestamp": "ISO-8601"
}
```

**Reply from Botpress (to Telenexus):**
```json
{
  "instance_id": "uuid",
  "phone_number": "254712345678",
  "message": "Bot response"
}
```

---

## Support Checklist

Before asking for help, verify:
- [ ] Evolution webhook is configured and event is enabled
- [ ] Telenexus instance type is "botpress" (not "billing")
- [ ] Botpress configuration is saved and Active
- [ ] Instance is connected (green status in Telenexus)
- [ ] Botpress bot is published and accessible
- [ ] Reply endpoint is configured in Botpress
- [ ] Backend logs show no errors
- [ ] All services are running (`sudo supervisorctl status`)

---

**Last Updated:** 2026-02-01  
**Integration Status:** ✅ Ready for Configuration  
**Required Actions:** Complete Parts 1-3 above
