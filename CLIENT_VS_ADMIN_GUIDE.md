# Client vs Admin Configuration Guide

## 🎯 Overview

This document explains who configures what in the Telenexus WhatsApp + Botpress integration.

---

## 👥 **CLIENT Configuration** (Your Customers)

Your clients will ONLY configure **Botpress integration** in the Telenexus dashboard. They will see:

### ✅ What Clients See & Configure:

#### 1. Botpress Messaging API Configuration Box (Purple/Blue Highlighted)

**STEP 1: Webhook URL for Botpress**
- Shows: `https://api.telenexustechnologies.com/api/webhooks/botpress/{instance_id}`
- Action: Copy this URL
- Where to use: Paste in their Botpress Messaging API integration settings

**STEP 2: Get Webhook URL from Botpress**
- Shows: Input field
- Action: Paste the webhook URL that Botpress gives them
- Purpose: So Telenexus can forward messages to their bot

**Quick Setup Guide:**
1. Copy Step 1 URL
2. Go to Botpress → Integrations → Messaging API
3. Paste URL in Botpress
4. Copy Botpress's webhook URL
5. Paste in Step 2
6. Click "Save Configuration"

#### 2. Evolution API Webhook URL (Yellow - Official Use Only)

**What they see:**
- The Evolution webhook URL (read-only, can copy)
- Yellow badge: "Official Use Only"
- Warning message: "⚠️ For Telenexus Administrators Only"
- Text: "This webhook URL is configured by the Telenexus team in Evolution API. No action required from you. If you need changes, please contact Telenexus support."

**What they do:**
- ❌ Nothing! This section is informational only
- They understand it's managed by Telenexus team
- If they need help, they contact support (you)

---

## 🔧 **ADMIN Configuration** (You - Telenexus Team)

As the Telenexus administrator, YOU configure Evolution API for each client instance.

### ✅ What You Configure:

#### 1. Evolution API Webhook Setup

**For each client instance:**

1. **Login to Evolution API:** `https://evoapi.telenexustechnologies.com`
2. **Find the client's instance** (e.g., `tnx_bot_abc123_ClientName`)
3. **Navigate to:** Webhooks settings
4. **Add webhook URL:**
   ```
   https://api.telenexustechnologies.com/api/webhooks/evolution/{instance_name}
   ```
   - Get this from the client's Telenexus instance page (yellow section, copy button)
   - Or construct it: Use the `evolution_instance_name` field

5. **Enable events:**
   - ✅ `MESSAGES_UPSERT` (required - incoming messages)
   - ✅ `MESSAGES_UPDATE` (optional - message status)
   - ✅ `MESSAGES_DELETE` (optional - deleted messages)

6. **Save configuration**

7. **Verify:**
   - Send test WhatsApp message to the instance
   - Check Telenexus backend logs: `tail -f /var/log/supervisor/backend.out.log | grep "Evolution webhook"`
   - Should see: "Evolution webhook received for {instance_name}"

#### 2. Instance Creation

When creating an instance for a client:
- Set `instance_type` to `"botpress"` (not "billing")
- This ensures the Botpress tab shows in the UI
- Evolution webhook is automatically generated based on `evolution_instance_name`

---

## 📊 **Complete Flow Summary**

### Client Perspective:
```
1. Client creates Botpress bot
2. Client logs into Telenexus
3. Client goes to Instance → Botpress tab
4. Client sees purple/blue box with 2 steps
5. Client configures Botpress Messaging API (Step 1 & 2)
6. Client clicks "Save Configuration"
7. ✅ Done! Messages now flow automatically
```

### Admin Perspective (You):
```
1. Client requests WhatsApp instance
2. You create instance in Telenexus (type: botpress)
3. You configure Evolution API webhook
4. You verify webhook is receiving messages
5. ✅ Client can now integrate their bot
```

---

## 🎨 **UI Changes Made**

### Before (Confusing for Clients):
```
❌ Evolution API Webhook URL
   - Detailed step-by-step instructions for Evolution API
   - Clients thought they needed to configure it
   - Caused confusion and support tickets
```

### After (Clear for Clients):
```
✅ Evolution API Webhook URL
   - Yellow "Official Use Only" badge
   - Clear message: "For Telenexus Administrators Only"
   - No action required from clients
   - Reduces confusion and support requests
```

---

## 📋 **Support Scenarios**

### Client Says: "Where do I configure Evolution API?"

**Response:**
"You don't need to! Evolution API is configured by our team during instance setup. You only need to configure Botpress integration in the purple/blue box on the Botpress tab. Follow Steps 1 & 2 shown there."

### Client Says: "My messages aren't coming through"

**Troubleshooting Checklist:**

1. **Check Botpress Configuration (Client's Responsibility):**
   - [ ] Step 1 URL added to Botpress Messaging API?
   - [ ] Step 2 Botpress webhook URL added to Telenexus?
   - [ ] "Active" toggle is ON (green)?
   - [ ] "Test" button shows success?

2. **Check Evolution Webhook (Your Responsibility):**
   - [ ] Evolution webhook configured for this instance?
   - [ ] `MESSAGES_UPSERT` event enabled?
   - [ ] Instance is connected in Evolution?
   - [ ] Backend logs show incoming webhooks?

---

## 🔐 **Access Control**

### Clients Have Access To:
- ✅ Telenexus Dashboard
- ✅ Their own instances
- ✅ Botpress configuration
- ✅ Messages tab
- ✅ Webhooks (their own user webhooks)
- ✅ API keys

### Clients DO NOT Have Access To:
- ❌ Evolution API Dashboard
- ❌ Evolution API Settings
- ❌ Other clients' instances
- ❌ Backend logs
- ❌ Database

### You (Admin) Have Access To:
- ✅ Everything clients have
- ✅ Evolution API Dashboard
- ✅ Backend logs and monitoring
- ✅ Database (if needed)
- ✅ All client instances

---

## 📝 **Standard Operating Procedure**

### When Onboarding New Client:

1. **Create Instance:**
   ```bash
   # In Telenexus dashboard
   - Instance Type: Botpress
   - Name: Client name or identifier
   - Description: Client details
   ```

2. **Configure Evolution:**
   - Copy `evolution_instance_name` from instance
   - Add webhook in Evolution API
   - Enable `MESSAGES_UPSERT` event
   - Save

3. **Test:**
   - Send test WhatsApp message
   - Verify in backend logs
   - Verify in Telenexus Messages tab

4. **Provide Client Access:**
   - Give client login credentials
   - Send them link to Botpress integration guide
   - Tell them to configure only the purple/blue box

5. **Client Support:**
   - Point them to `/app/BOTPRESS_MESSAGING_API_GUIDE.md`
   - Sections relevant to clients:
     - "Step 2: Link Telenexus with Botpress"
     - "Testing the Full Integration"
     - "Troubleshooting" (client-facing issues)

---

## 🎯 **Key Takeaway**

**Simple Rule:**
- **Clients configure:** Botpress (purple/blue box)
- **You configure:** Evolution API (yellow section)

**Client sees:** 
- Yellow "Official Use Only" section = No action needed
- Purple/Blue "Botpress Messaging API" section = Configure this!

**Result:**
- Reduced confusion
- Fewer support requests  
- Clear separation of responsibilities
- Better client experience

---

## 📞 **Support Contacts**

### For Clients:
"If you need help with Evolution API configuration or have technical issues beyond Botpress setup, please contact Telenexus support."

### For You (Admin):
Check these resources:
- `/app/BOTPRESS_MESSAGING_API_GUIDE.md` - Complete technical guide
- Backend logs: `tail -f /var/log/supervisor/backend.out.log`
- Evolution API dashboard: `https://evoapi.telenexustechnologies.com`

---

**Last Updated:** 2026-02-01  
**Version:** 2.1 - Client-Focused UI  
**Status:** ✅ Production Ready
