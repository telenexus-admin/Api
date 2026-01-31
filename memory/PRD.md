# Telenexus API - Product Requirements Document

## Original Problem Statement
User had a Telenexus API app with simulated WhatsApp instance management. The requirement was to integrate with their deployed Evolution API (https://evoapi.telenexustechnologies.com) to enable real WhatsApp instance creation, QR code generation, and message sending - replacing all simulation with real functionality while keeping databases separate.

## Architecture
- **Frontend**: React.js with Tailwind CSS, running on port 3000
- **Backend**: FastAPI (Python) running on port 8001
- **Database**: MongoDB (local) - stores Telenexus app data (users, API keys, logs, webhooks)
- **External API**: Evolution API (https://evoapi.telenexustechnologies.com) - handles WhatsApp connections

## Integration Flow
```
User -> Telenexus API -> Evolution API -> WhatsApp Web
                     |
                     v
              MongoDB (app data only)
```

## What's Been Implemented (2026-01-31)

### Evolution API Integration
1. **EvolutionAPIClient class** - Handles all Evolution API calls:
   - `create_instance()` - Creates real WhatsApp instance
   - `get_qr_code()` - Fetches QR code for connection
   - `get_instance_connection_state()` - Checks connection status
   - `send_text_message()` - Sends WhatsApp messages
   - `delete_instance()` - Removes instance from Evolution API
   - `logout_instance()` - Disconnects WhatsApp session

2. **Modified Endpoints**:
   - `POST /api/instances` - Creates real Evolution API instance, returns real QR code
   - `GET /api/instances` - Syncs status from Evolution API
   - `GET /api/instances/{id}` - Returns real QR code and status
   - `DELETE /api/instances/{id}` - Deletes from both local DB and Evolution API
   - `POST /api/instances/{id}/messages/send` - Sends real WhatsApp messages
   - `GET /api/health` - Shows Evolution API connection status

3. **Webhook Receiver** (`POST /api/evolution/webhook`) - Receives events from Evolution API

### Configuration
- Evolution API URL and Key stored in `/app/backend/.env`
- Instance naming convention: `tnx_{user_id_8chars}_{clean_instance_name}`

## User Personas
1. **API Developers** - Build WhatsApp integrations using Telenexus API
2. **Business Users** - Manage WhatsApp instances via dashboard

## Core Requirements (Static)
- [x] Real WhatsApp instance creation via Evolution API
- [x] Real QR code generation for authentication
- [x] Real message sending to WhatsApp
- [x] Instance status sync from Evolution API
- [x] Separate databases (Telenexus uses MongoDB, Evolution uses its own)

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Evolution API integration
- [x] Real instance creation
- [x] Real QR code retrieval
- [x] Real message sending

### P1 (High Priority) - Pending
- [ ] Configure Evolution API webhooks to send events to Telenexus webhook receiver
- [ ] Handle incoming messages from Evolution API
- [ ] Media message support (images, documents)

### P2 (Medium Priority) - Future
- [ ] Instance templates
- [ ] Message scheduling
- [ ] Bulk messaging
- [ ] Analytics dashboard

## Testing Status
- Backend API: 100% functional
- Frontend UI: Working (registration, login, dashboard, instance management)
- Evolution API connectivity: Verified

## Next Tasks
1. Set up Evolution API webhook configuration to send events to `/api/evolution/webhook`
2. Test full message flow (send and receive)
3. Add media message support
