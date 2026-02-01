# Telenexus API - Product Requirements Document

## Original Problem Statement
User had a Telenexus API app with simulated WhatsApp instance management. The requirement was to integrate with their deployed Evolution API (https://evoapi.telenexustechnologies.com) to enable real WhatsApp instance creation, QR code generation, and message sending - replacing all simulation with real functionality while keeping databases separate.

## Architecture
- **Frontend**: React.js with Tailwind CSS, running on port 3000
- **Backend**: FastAPI (Python) running on port 8001
- **Database**: MongoDB (local) - stores Telenexus app data (users, API keys, logs, webhooks)
- **External API**: Evolution API (https://evoapi.telenexustechnologies.com) - handles WhatsApp connections

## Instance Types (2026-01-31)
1. **Billing Instance** - For WISPMAN/payment notifications, invoices
2. **Botpress Instance** - For AI chatbot integration

## Integration Flow
```
User -> Telenexus API -> Evolution API -> WhatsApp Web
                     |
                     v
              MongoDB (app data only)
```

## What's Been Implemented (2026-01-31)

### Evolution API Integration
1. **EvolutionAPIClient class** - Handles all Evolution API calls
2. **Real WhatsApp instances** - Creation, QR codes, message sending, deletion

### Instance Type System
- **Billing instances**: Show Billing & Interactive tabs
- **Botpress instances**: Show Botpress configuration tab

### Botpress Integration
- Webhook URL configuration
- Token authentication
- Message forwarding to Botpress
- Reply endpoint for bot responses
- Test connection feature

### Billing Features
- Payment reminder messages
- Invoice notifications
- Overdue notices
- Payment confirmations
- (Note: Interactive buttons not supported in Baileys mode)

### API Endpoints
- `POST /api/instances` - Create instance (billing or botpress type)
- `POST /api/instances/{id}/botpress` - Configure Botpress
- `GET /api/instances/{id}/botpress` - Get Botpress config
- `POST /api/instances/{id}/botpress/test` - Test connection
- `POST /api/botpress/reply` - Receive bot replies
- `POST /api/v1/billing/send-notification` - Public billing API

## User Personas
1. **ISP Operators** - Use billing instances for WISPMAN integration
2. **Bot Developers** - Use botpress instances for AI chatbots

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Evolution API integration
- [x] Instance type separation (billing/botpress)
- [x] Botpress webhook integration
- [x] Billing notification endpoints

### P1 (High Priority) - Pending
- [ ] M-Pesa STK Push integration (for PayNow via reply system)
- [ ] Invoice PDF generation
- [ ] Reply-based payment flow (user replies "1" to pay)

### P2 (Medium Priority) - Future
- [ ] WISPMAN direct integration
- [ ] Message templates
- [ ] Scheduled messages

## Recent Updates (2026-02-01)

### Evolution API Webhook Integration ✅
- **Backend**: Added webhook endpoint `/api/webhooks/evolution/{instance_name}`
- **Frontend**: Added webhook URL display with copy button in Botpress configuration
- **Functionality**: 
  - Receives incoming WhatsApp messages from Evolution API
  - Automatically forwards to Botpress if configured
  - Stores all incoming messages in database
  - Triggers user-configured webhooks
  - Supports multiple message types (text, image, video, audio, document)

### Message Flow (Complete)
```
User WhatsApp Message
    ↓
Evolution API (receives)
    ↓
POST /api/webhooks/evolution/{instance_name} (NEW!)
    ↓
[Store in DB] → [Forward to Botpress] → [Trigger user webhooks]
    ↓
Botpress processes
    ↓
POST /api/botpress/reply
    ↓
Evolution API → WhatsApp User
```

## Next Tasks
1. Implement M-Pesa Daraja API integration
2. Create reply-based payment flow
3. Add invoice PDF generation
