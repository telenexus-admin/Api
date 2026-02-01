# Billing System Integration Guide

## 🎯 Overview

This guide explains how to integrate external billing systems (WISPMAN, custom software, etc.) with Telenexus to send WhatsApp billing notifications.

---

## 📋 What Billing Systems Need

To integrate with Telenexus, your billing system needs **3 things**:

1. **API Endpoint URL** - Where to send billing notifications
2. **Instance ID** - Which WhatsApp instance to use
3. **API Key** - For authentication

All three are provided in the **API Integration** tab of your billing instance.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create API Key

1. Login to Telenexus: `https://api.telenexustechnologies.com`
2. Go to **API Keys** page (left sidebar)
3. Click **"Create API Key"**
4. Give it a name (e.g., "WISPMAN Integration")
5. Select permissions:
   - ✅ `send_message` (required)
   - ✅ `receive_message` (optional)
6. Click **Create**
7. **Copy the API key** - You won't see it again!
8. Save it securely (password manager, .env file, etc.)

### Step 2: Get Instance Information

1. Go to **Instances** page
2. Click on your **billing instance**
3. Go to **API Integration** tab (blue tab)
4. You'll see:
   - **API Endpoint URL** with copy button
   - **Instance ID** with copy button
5. Copy both values

### Step 3: Configure Your Billing System

Configure your billing system with:

**API Endpoint:**
```
https://api.telenexustechnologies.com/api/v1/billing/send-notification?instance_id=YOUR_INSTANCE_ID
```

**Authentication:**
```
Authorization: Bearer YOUR_API_KEY
```

**Content-Type:**
```
Content-Type: application/json
```

### Step 4: Test the Integration

Use the cURL example from the API Integration tab, or:

```bash
curl -X POST "https://api.telenexustechnologies.com/api/v1/billing/send-notification?instance_id=YOUR_INSTANCE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "phone_number": "254712345678",
    "customer_name": "Test Customer",
    "amount": 100.00,
    "currency": "KES",
    "invoice_id": "TEST-001",
    "message_type": "payment_reminder"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message_id": "uuid-here",
  "invoice_id": "TEST-001"
}
```

### Step 5: Verify Delivery

1. Go to your Telenexus instance
2. Click **Messages** tab
3. You should see the test message
4. Check the WhatsApp number - message should be delivered

✅ **Integration complete!**

---

## 📊 API Reference

### Endpoint

```
POST /api/v1/billing/send-notification
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instance_id` | string | Yes | Your billing instance ID |

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes |
| `Authorization` | `Bearer YOUR_API_KEY` | Yes |

### Request Body

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `phone_number` | string | Yes | Customer's WhatsApp number with country code | `"254712345678"` |
| `customer_name` | string | Yes | Customer's full name | `"John Doe"` |
| `amount` | number | Yes | Bill amount | `1500.00` |
| `currency` | string | Yes | Currency code (ISO 4217) | `"KES"`, `"USD"`, `"EUR"` |
| `invoice_id` | string | Yes | Invoice/Bill reference number | `"INV-2026-001"` |
| `due_date` | string | No | Payment due date (ISO 8601) | `"2026-02-15"` |
| `message_type` | string | Yes | Type of notification | See below |

### Message Types

| Type | Description | Use Case |
|------|-------------|----------|
| `payment_reminder` | Friendly reminder of upcoming payment | Send before due date |
| `invoice` | New invoice notification | When invoice is generated |
| `overdue` | Payment is now overdue | After due date passes |
| `confirmation` | Payment received confirmation | After payment processed |

### Response

**Success (200):**
```json
{
  "success": true,
  "message_id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_id": "INV-001"
}
```

**Error (400/401/404/500):**
```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Message sent successfully |
| 400 | Bad Request | Missing required fields, invalid data format |
| 401 | Unauthorized | Invalid or missing API key |
| 404 | Not Found | Instance not found or doesn't belong to your account |
| 500 | Server Error | WhatsApp instance not connected, Evolution API error |

---

## 💻 Code Examples

### cURL

```bash
curl -X POST "https://api.telenexustechnologies.com/api/v1/billing/send-notification?instance_id=abc-123-def" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tnx_abc123xyz..." \
  -d '{
    "phone_number": "254712345678",
    "customer_name": "John Doe",
    "amount": 1500.00,
    "currency": "KES",
    "invoice_id": "INV-001",
    "due_date": "2026-02-15",
    "message_type": "payment_reminder"
  }'
```

### Python (requests)

```python
import requests
from datetime import datetime, timedelta

TELENEXUS_API_URL = "https://api.telenexustechnologies.com"
INSTANCE_ID = "your-instance-id"
API_KEY = "your-api-key"

def send_billing_notification(customer_phone, customer_name, amount, invoice_id, message_type="payment_reminder"):
    """Send WhatsApp billing notification via Telenexus"""
    
    url = f"{TELENEXUS_API_URL}/api/v1/billing/send-notification"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    # Calculate due date (7 days from now)
    due_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    payload = {
        "phone_number": customer_phone,
        "customer_name": customer_name,
        "amount": amount,
        "currency": "KES",
        "invoice_id": invoice_id,
        "due_date": due_date,
        "message_type": message_type
    }
    
    params = {"instance_id": INSTANCE_ID}
    
    try:
        response = requests.post(url, json=payload, headers=headers, params=params)
        response.raise_for_status()
        result = response.json()
        print(f"✅ Message sent! Message ID: {result['message_id']}")
        return result
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to send: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Error details: {e.response.text}")
        raise

# Example usage
if __name__ == "__main__":
    send_billing_notification(
        customer_phone="254712345678",
        customer_name="John Doe",
        amount=1500.00,
        invoice_id="INV-2026-001",
        message_type="payment_reminder"
    )
```

### PHP

```php
<?php

function sendBillingNotification($customerPhone, $customerName, $amount, $invoiceId, $messageType = 'payment_reminder') {
    $apiUrl = 'https://api.telenexustechnologies.com/api/v1/billing/send-notification';
    $instanceId = 'your-instance-id';
    $apiKey = 'your-api-key';
    
    $url = $apiUrl . '?instance_id=' . $instanceId;
    
    $data = [
        'phone_number' => $customerPhone,
        'customer_name' => $customerName,
        'amount' => $amount,
        'currency' => 'KES',
        'invoice_id' => $invoiceId,
        'due_date' => date('Y-m-d', strtotime('+7 days')),
        'message_type' => $messageType
    ];
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey
            ],
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        throw new Exception('Failed to send billing notification');
    }
    
    return json_decode($result, true);
}

// Example usage
try {
    $response = sendBillingNotification(
        '254712345678',
        'John Doe',
        1500.00,
        'INV-2026-001',
        'payment_reminder'
    );
    echo "Message sent! ID: " . $response['message_id'];
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

### Node.js (axios)

```javascript
const axios = require('axios');

const TELENEXUS_API_URL = 'https://api.telenexustechnologies.com';
const INSTANCE_ID = 'your-instance-id';
const API_KEY = 'your-api-key';

async function sendBillingNotification(customerPhone, customerName, amount, invoiceId, messageType = 'payment_reminder') {
    const url = `${TELENEXUS_API_URL}/api/v1/billing/send-notification`;
    
    // Calculate due date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    try {
        const response = await axios.post(url, {
            phone_number: customerPhone,
            customer_name: customerName,
            amount: amount,
            currency: 'KES',
            invoice_id: invoiceId,
            due_date: dueDate.toISOString().split('T')[0],
            message_type: messageType
        }, {
            params: { instance_id: INSTANCE_ID },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        console.log('✅ Message sent!', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to send:', error.response?.data || error.message);
        throw error;
    }
}

// Example usage
sendBillingNotification(
    '254712345678',
    'John Doe',
    1500.00,
    'INV-2026-001',
    'payment_reminder'
);
```

---

## 🔧 WISPMAN Integration

### Configuration in WISPMAN

1. Go to **WISPMAN Admin Panel**
2. Navigate to **Settings** → **Notifications** → **WhatsApp**
3. Configure:
   - **API URL:** `https://api.telenexustechnologies.com/api/v1/billing/send-notification?instance_id=YOUR_INSTANCE_ID`
   - **API Key:** Your Telenexus API key
   - **Authentication Method:** Bearer Token
4. Map WISPMAN fields to API parameters:
   - Customer Phone → `phone_number`
   - Customer Name → `customer_name`
   - Invoice Amount → `amount`
   - Currency → `currency` (set to your local currency)
   - Invoice Number → `invoice_id`
   - Due Date → `due_date`
5. Set notification triggers:
   - ✅ New invoice generated → `invoice`
   - ✅ Payment reminder (3 days before) → `payment_reminder`
   - ✅ Payment overdue → `overdue`
   - ✅ Payment received → `confirmation`
6. Save and test

---

## 🎨 Message Templates

### Payment Reminder
```
Payment Due Reminder

Dear John Doe,

This is a reminder that your payment of KES 1,500.00 is due.

Invoice: #INV-001
Due Date: 2026-02-15

Please ignore if already paid.
```

### New Invoice
```
New Invoice Generated

Dear John Doe,

A new invoice has been generated for your account.

Amount: KES 1,500.00
Invoice: #INV-001
Due Date: 2026-02-15
```

### Overdue Notice
```
Payment Overdue Notice

Dear John Doe,

Your account is now OVERDUE.

Outstanding: KES 1,500.00
Invoice: #INV-001

Please settle immediately to avoid service interruption.
```

### Payment Confirmation
```
Payment Received

Dear John Doe,

Thank you! We have received your payment.

Amount: KES 1,500.00
Invoice: #INV-001

Your account is now up to date.
```

---

## 🔒 Security Best Practices

1. **API Key Storage:**
   - Never commit API keys to version control
   - Use environment variables or secure key management
   - Rotate keys periodically

2. **HTTPS Only:**
   - Always use HTTPS endpoints
   - Never send API keys over HTTP

3. **Error Handling:**
   - Implement retry logic for temporary failures
   - Log errors but don't expose API keys in logs
   - Handle rate limiting gracefully

4. **Testing:**
   - Test in development environment first
   - Use test phone numbers
   - Verify message delivery before going live

---

## 📊 Monitoring & Logs

### Check Message Delivery

1. Go to Telenexus → Your Instance → **Messages** tab
2. Filter by:
   - Direction: Outgoing
   - Status: Sent/Delivered/Failed
3. View message details and timestamps

### Backend Logs

```bash
# View API requests
tail -f /var/log/supervisor/backend.out.log | grep "billing"

# Check for errors
grep "error" /var/log/supervisor/backend.err.log
```

---

## ❓ Troubleshooting

### "401 Unauthorized"
- **Cause:** Invalid or missing API key
- **Fix:** Check Authorization header format: `Bearer YOUR_API_KEY`
- **Fix:** Verify API key is active in API Keys page

### "404 Instance not found"
- **Cause:** Invalid instance_id or instance doesn't belong to your account
- **Fix:** Verify instance_id from API Integration tab
- **Fix:** Make sure you're using the correct API key for the account

### "400 Instance is not connected"
- **Cause:** WhatsApp instance is disconnected
- **Fix:** Go to instance → QR Code tab → Reconnect
- **Fix:** Check Evolution API dashboard

### Message sent but not delivered
- **Cause:** Invalid phone number format
- **Fix:** Use format: country code + number (e.g., 254712345678)
- **Fix:** No spaces, dashes, or + symbol

### "Rate limit exceeded"
- **Cause:** Too many requests in short time
- **Fix:** Implement exponential backoff
- **Fix:** Batch notifications instead of sending individually

---

## 💡 Tips & Best Practices

1. **Phone Number Format:**
   - Always include country code
   - Remove spaces, dashes, parentheses
   - Example: `254712345678` (Kenya), `1234567890` (USA)

2. **Testing:**
   - Test with your own number first
   - Use `payment_reminder` for testing
   - Check Messages tab after each test

3. **Timing:**
   - Don't send messages at night (respect timezone)
   - Space out batch notifications (avoid spam)
   - Set appropriate retry intervals

4. **Message Content:**
   - Keep customer names and amounts accurate
   - Include invoice reference numbers
   - Use correct message_type for each scenario

5. **Error Handling:**
   - Log all API responses
   - Implement retry logic for 5xx errors
   - Alert on repeated failures

---

## 📞 Support

Need help integrating?

1. **Check Messages Tab:** Verify message delivery
2. **Check API Keys:** Ensure key is active and has permissions
3. **Check Instance:** Verify it's connected (green status)
4. **Test with cURL:** Use example from API Integration tab
5. **Contact Support:** If issues persist

---

**Last Updated:** 2026-02-01  
**API Version:** 1.0  
**Status:** ✅ Production Ready
