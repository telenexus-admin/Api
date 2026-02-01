# Botpress Messaging API Integration - Complete Guide

## 🎯 **Correct Integration Pattern**

This guide explains the proper way to integrate Botpress using their **Messaging API** pattern.

---

## 📊 **The Integration Architecture**

```
┌─────────────────┐
│  WhatsApp User  │
└────────┬────────┘
         │ Sends message
         ↓
┌─────────────────┐
│  Evolution API  │
└────────┬────────┘
         │ Webhook
         ↓
┌──────────────────────────────────────────────────────┐
│  Telenexus - Evolution Webhook                       │
│  POST /api/webhooks/evolution/{instance_name}        │
└────────┬─────────────────────────────────────────────┘
         │ Forwards message
         ↓
┌──────────────────────────────────────────────────────┐
│  Botpress Webhook (URL from Botpress)                │
│  Your configured Botpress webhook URL                │
└────────┬─────────────────────────────────────────────┘
         │ Bot processes & generates reply
         ↓
┌──────────────────────────────────────────────────────┐
│  Telenexus - Botpress Webhook (NEW!)                 │
│  POST /api/webhooks/botpress/{instance_id}           │
└────────┬─────────────────────────────────────────────┘
         │ Sends to Evolution
         ↓
┌─────────────────┐
│  Evolution API  │
└────────┬────────┘
         │ Delivers
         ↓
┌─────────────────┐
│  WhatsApp User  │
└─────────────────┘
```

---

## 🔄 **The Two-Way Connection**

### Connection 1: Telenexus → Botpress
**Purpose:** Send incoming WhatsApp messages TO Botpress

**Configuration:**
- Location: Telenexus Dashboard → Instance → Botpress Tab → Step 2
- What you paste: The webhook URL that **Botpress gives you**
- Example: `https://webhook.botpress.cloud/YOUR_BOT_ID/webhook`

### Connection 2: Botpress → Telenexus  
**Purpose:** Receive bot replies FROM Botpress

**Configuration:**
- Location: Botpress Dashboard → Messaging API → Webhook URL field
- What you paste: `https://api.telenexustechnologies.com/api/webhooks/botpress/{YOUR_INSTANCE_ID}`
- This URL is shown in Step 1 with a copy button

---

## 📝 **Step-by-Step Setup**

### Step 1: Configure Evolution API Webhook (Receive WhatsApp Messages)

1. Go to Telenexus → Your Instance → **Botpress** tab
2. Scroll to **"Evolution API Webhook URL"** section
3. Click **"Copy URL"** button
4. Go to Evolution API dashboard (`https://evoapi.telenexustechnologies.com`)
5. Find your instance → Webhooks settings
6. Paste the Evolution webhook URL
7. Enable event: `MESSAGES_UPSERT`
8. Save

✅ **Result:** WhatsApp messages now flow: User → Evolution → Telenexus

---

### Step 2: Link Telenexus with Botpress (Bidirectional)

#### Part A: Give Telenexus Webhook TO Botpress

1. In Telenexus → Your Instance → **Botpress** tab
2. Find the **purple/blue highlighted box** titled "Botpress Messaging API Configuration"
3. In **STEP 1**, click **"Copy"** button next to the webhook URL
   - This copies: `https://api.telenexustechnologies.com/api/webhooks/botpress/{instance_id}`

4. Open **Botpress Dashboard** in another tab
5. Go to your bot → **Integrations** → **Messaging API** (or similar)
6. Find the field: **"Webhook URL"** or **"Incoming Messages Webhook"**
7. **Paste** the URL you copied from Telenexus
8. Save in Botpress

✅ **Result:** Botpress can now send messages TO Telenexus

---

#### Part B: Get Botpress Webhook and Add TO Telenexus

1. Still in **Botpress Dashboard** → Messaging API integration
2. After saving the webhook URL above, Botpress will show **their webhook URL**
3. Look for something like:
   - "Webhook URL to send messages"
   - "Outgoing webhook"
   - Usually looks like: `https://webhook.botpress.cloud/YOUR_BOT_ID/webhook`
4. **Copy** this URL from Botpress

5. Go back to **Telenexus** → Your Instance → **Botpress** tab
6. In the purple/blue box, find **STEP 2**
7. **Paste** the Botpress webhook URL in the input field
8. Scroll down and click **"Save Configuration"**
9. Make sure the **"Active"** toggle is ON (green)
10. Click **"Test"** to verify connection

✅ **Result:** Telenexus can now send messages TO Botpress

---

### Step 3: Test the Full Integration

#### Test 1: Send WhatsApp Message
1. Send a message from your phone to the connected WhatsApp number
2. Check **Telenexus → Messages tab**
   - You should see the incoming message

#### Test 2: Check Botpress Received It
1. Go to **Botpress Dashboard** → **Conversations**
2. You should see the conversation with the message

#### Test 3: Bot Reply Appears
1. Botpress should process the message and generate a reply
2. Check your **WhatsApp** on your phone
3. You should receive the bot's reply

#### Test 4: Verify in Telenexus
1. Back in **Telenexus → Messages tab**
2. You should see both:
   - The incoming message (direction: incoming)
   - The bot reply (direction: outgoing, type: botpress_reply)

---

## 🔍 **Troubleshooting**

### Messages not reaching Telenexus from WhatsApp

**Check:**
- [ ] Evolution webhook URL is configured correctly
- [ ] `MESSAGES_UPSERT` event is enabled in Evolution
- [ ] Instance is connected (green status)
- [ ] Backend logs: `tail -f /var/log/supervisor/backend.out.log | grep "Evolution webhook"`

**Test manually:**
```bash
curl -X POST https://api.telenexustechnologies.com/api/webhooks/evolution/YOUR_INSTANCE_NAME \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"messages":[{"key":{"remoteJid":"254712345678@s.whatsapp.net","fromMe":false},"message":{"conversation":"test"},"messageType":"conversation"}]}}'
```

---

### Messages not reaching Botpress

**Check:**
- [ ] Botpress webhook URL is configured in Telenexus
- [ ] URL is correct (no typos, includes https://)
- [ ] "Active" toggle is ON in Telenexus
- [ ] Test connection button shows success
- [ ] Backend logs: `tail -f /var/log/supervisor/backend.out.log | grep "Botpress"`

**Test manually:**
```bash
# Check if forwarding is working
grep "forward_to_botpress" /var/log/supervisor/backend.out.log
```

---

### Bot replies not reaching WhatsApp

**Check:**
- [ ] Botpress has the Telenexus webhook URL configured
- [ ] URL format: `https://api.telenexustechnologies.com/api/webhooks/botpress/{INSTANCE_ID}`
- [ ] Instance ID is correct (check in Telenexus URL or copy from Step 1)
- [ ] Evolution instance is still connected
- [ ] Backend logs: `tail -f /var/log/supervisor/backend.out.log | grep "Botpress webhook received"`

**Test manually:**
```bash
curl -X POST https://api.telenexustechnologies.com/api/webhooks/botpress/YOUR_INSTANCE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "message": {"type":"text","text":"Test reply from bot"},
    "user": {"id":"254712345678"},
    "conversation": {"id":"test"}
  }'
```

---

### Common Botpress Webhook Formats

Different Botpress versions may send different payload formats. The endpoint handles:

#### Format 1: Standard Botpress Cloud
```json
{
  "message": {
    "type": "text",
    "text": "Bot response"
  },
  "user": {
    "id": "254712345678"
  },
  "conversation": {
    "id": "instance_id_254712345678"
  }
}
```

#### Format 2: Custom Payload
```json
{
  "message": {
    "payload": {
      "text": "Bot response"
    }
  },
  "user": {
    "id": "254712345678"
  }
}
```

The endpoint automatically handles both formats!

---

## 🎨 **Visual Guide - What You Should See**

### In Telenexus UI (Botpress Tab)

You should now see a **purple/blue highlighted box** with:

```
┌─────────────────────────────────────────────────┐
│ 🤖 Botpress Messaging API Configuration        │
├─────────────────────────────────────────────────┤
│                                                 │
│ STEP 1: Webhook URL for Botpress        [Copy] │
│ https://api.telenexustechnologies.com/...      │
│ 📋 Use this URL in your Botpress config        │
│                                                 │
│ STEP 2: Get Webhook URL from Botpress          │
│ [Input field to paste Botpress webhook]        │
│ 📥 Paste here the webhook URL from Botpress    │
│                                                 │
│ Quick Setup Guide:                              │
│ 1. Copy Step 1 URL                             │
│ 2. Go to Botpress → Integrations               │
│ 3. Paste URL in Botpress                       │
│ 4. Copy Botpress's webhook URL                 │
│ 5. Paste in Step 2                             │
│ 6. Save Configuration                          │
└─────────────────────────────────────────────────┘
```

---

## 📚 **API Reference**

### Endpoint 1: Evolution Webhook (Receive WhatsApp)
```
POST /api/webhooks/evolution/{evolution_instance_name}
Content-Type: application/json

Body: Evolution API webhook payload
```

### Endpoint 2: Forward to Botpress
```
POST {YOUR_BOTPRESS_WEBHOOK_URL}
Content-Type: application/json

Body: {
  "type": "text",
  "text": "User message",
  "userId": "phone_number",
  "conversationId": "instance_id_phone",
  "messageId": "uuid",
  "instance_id": "uuid",
  "phone_number": "254712345678",
  "timestamp": "ISO-8601"
}
```

### Endpoint 3: Botpress Webhook (Receive Bot Replies) ⭐ NEW
```
POST /api/webhooks/botpress/{instance_id}
Content-Type: application/json

Body: Botpress message payload (automatically handled)
```

---

## ✅ **Integration Checklist**

Before going live, verify:

- [ ] Evolution webhook configured with `MESSAGES_UPSERT` enabled
- [ ] Telenexus webhook URL added to Botpress Messaging API config
- [ ] Botpress webhook URL added to Telenexus (Step 2)
- [ ] Configuration saved in Telenexus
- [ ] "Active" toggle is ON (green)
- [ ] Test connection shows success
- [ ] End-to-end test completed (send message, receive reply)
- [ ] Messages appear in Telenexus Messages tab
- [ ] Backend logs show no errors

---

## 🚀 **What's Changed from Previous Implementation**

### Old Way (Generic):
- Single generic endpoint: `/api/botpress/reply`
- Required manual payload formatting
- Not aligned with Botpress Messaging API pattern

### New Way (Messaging API Pattern): ⭐
- Instance-specific endpoint: `/api/webhooks/botpress/{instance_id}`
- Automatic payload handling for Botpress formats
- Matches Botpress Messaging API integration exactly
- Clear two-way URL exchange in UI
- Step-by-step guidance in the interface

---

## 📞 **Support**

Still having issues? Check:

1. **Backend logs:**
   ```bash
   tail -f /var/log/supervisor/backend.out.log
   ```

2. **Search for specific events:**
   ```bash
   grep "Botpress webhook received" /var/log/supervisor/backend.out.log
   grep "Evolution webhook received" /var/log/supervisor/backend.out.log
   ```

3. **Verify services:**
   ```bash
   sudo supervisorctl status
   ```

---

**Last Updated:** 2026-02-01  
**Version:** 2.0 - Botpress Messaging API Pattern  
**Status:** ✅ Ready for Integration
