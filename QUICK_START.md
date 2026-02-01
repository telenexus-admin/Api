# Botpress Integration - Quick Steps

## What You Need to Do (3 Simple Steps)

### 📱 STEP 1: Configure Evolution API to Send Messages to Telenexus

**Where:** Evolution API Dashboard (`https://evoapi.telenexustechnologies.com`)

**Action:**
1. Go to your instance settings
2. Add webhook URL: `https://api.telenexustechnologies.com/api/webhooks/evolution/YOUR_INSTANCE_NAME`
   - (Copy this URL from Botpress tab in Telenexus)
3. Enable event: `MESSAGES_UPSERT`
4. Save

**Result:** When someone messages your WhatsApp, Evolution sends it to Telenexus ✅

---

### 🤖 STEP 2: Configure Telenexus to Forward to Botpress

**Where:** Telenexus Dashboard → Your Instance → Botpress Tab

**Action:**
1. Fill in **Botpress Webhook URL**
   - Example: `https://webhook.botpress.cloud/YOUR_BOT_ID`
   - Or: `https://your-botpress.com/api/v1/bots/BOT_ID/converse`
2. Add **Token** (if your Botpress requires authentication)
3. Make sure **Active** toggle is ON (green)
4. Click **Save Configuration**
5. Click **Test** to verify connection

**Result:** Telenexus will forward incoming messages to your Botpress bot ✅

---

### 💬 STEP 3: Configure Botpress to Send Replies Back to Telenexus

**Where:** Botpress Dashboard → Your Bot → Code Section

**Action:**
Add this code in Botpress "Before Outgoing Hook" or equivalent:

```javascript
// When bot wants to send a message, send it to Telenexus
const axios = require('axios');

async function sendToTelenexus(instanceId, phoneNumber, message) {
  await axios.post('https://api.telenexustechnologies.com/api/botpress/reply', {
    instance_id: instanceId,  // Get from incoming message
    phone_number: phoneNumber, // Get from incoming message
    message: message           // Your bot's response
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Call this function with your bot's reply
```

**Result:** Bot replies are sent back to WhatsApp users ✅

---

## Complete Flow (What Happens)

```
📱 User sends WhatsApp message
    ↓
🌐 Evolution API receives it
    ↓
📩 Evolution sends to: /api/webhooks/evolution/{instance}
    ↓
💾 Telenexus stores message in database
    ↓
🔄 Telenexus forwards to: Your Botpress Webhook
    ↓
🤖 Botpress processes and generates reply
    ↓
📤 Botpress sends reply to: /api/botpress/reply
    ↓
🌐 Telenexus sends to Evolution API
    ↓
📱 User receives bot reply on WhatsApp
```

---

## Where to Get Each URL

### 1. Evolution Webhook URL (for Step 1)
**Location:** Telenexus → Your Instance → Botpress Tab → "Evolution API Webhook URL" section → Click "Copy URL"

Format: `https://api.telenexustechnologies.com/api/webhooks/evolution/tnx_bot_abc123_YourInstance`

### 2. Botpress Webhook URL (for Step 2)
**Location:** Botpress Dashboard → Your Bot → Integrations/Webhooks

Options:
- Botpress Cloud: `https://webhook.botpress.cloud/YOUR_BOT_ID`
- Self-hosted: `https://your-domain.com/api/v1/bots/BOT_ID/converse`

### 3. Telenexus Reply URL (for Step 3)
**Fixed URL:** `https://api.telenexustechnologies.com/api/botpress/reply`

Use this in your Botpress code to send replies back.

---

## Testing Checklist

After completing all 3 steps:

1. ✅ Send WhatsApp message to your number
2. ✅ Check Telenexus → Messages tab (should see incoming message)
3. ✅ Check Botpress dashboard (should see conversation)
4. ✅ Check WhatsApp (should receive bot reply)

If any step fails, see `/app/BOTPRESS_INTEGRATION_GUIDE.md` for detailed troubleshooting.

---

## Need Help?

**View Logs:**
```bash
# See what's happening in real-time
tail -f /var/log/supervisor/backend.out.log
```

**Test Webhook:**
```bash
# Test if Evolution webhook is working
# (Replace YOUR_INSTANCE_NAME with actual name)
curl -X POST https://api.telenexustechnologies.com/api/webhooks/evolution/YOUR_INSTANCE_NAME \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"messages":[{"key":{"remoteJid":"1234@s.whatsapp.net","fromMe":false},"message":{"conversation":"test"},"messageType":"conversation"}]}}'
```

**Common Issues:**
- "Instance not found" → Check evolution_instance_name is correct
- "Botpress not responding" → Check webhook URL and token
- "Reply not delivered" → Check Evolution instance is connected

---

## Summary

You need to configure **3 connections**:

1. **Evolution → Telenexus**: So incoming messages reach your system
2. **Telenexus → Botpress**: So messages are forwarded to your bot
3. **Botpress → Telenexus**: So bot replies are sent back

Each connection is independent and must be configured properly for the full integration to work.

**All the code is already implemented! You just need to configure the URLs in the right places.**
