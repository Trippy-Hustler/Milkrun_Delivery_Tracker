# Snitch B2B Delivery Driver App

A mobile-first PWA for Snitch's Bangalore store B2B delivery drivers to update shipment statuses in real-time, pushing directly to Trackmile/eShipz.

## Architecture

```
Driver Phone (PWA) → n8n Webhooks → eShipz API / Trackmile
```

- **Fetch shipments**: App calls n8n webhook → n8n calls eShipz get-shipments API → returns transformed data
- **Update status**: App calls n8n webhook → n8n logs into Trackmile → POSTs status update → returns success

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with your n8n webhook URLs
cp .env.example .env
# Edit .env with your actual URLs

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000 on your phone (same WiFi)
```

## Environment Variables

```env
VITE_N8N_BASE_URL=https://n8n.snitch-workflow.com/webhook
VITE_FETCH_SHIPMENTS_PATH=/get-shipments
VITE_UPDATE_STATUS_PATH=/update-status
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env variables in Vercel dashboard or CLI
vercel env add VITE_N8N_BASE_URL
vercel env add VITE_FETCH_SHIPMENTS_PATH
vercel env add VITE_UPDATE_STATUS_PATH
```

## n8n Workflows Required

### Workflow 1: GET /get-shipments
Webhook → HTTP Request (eShipz) → Code (transform) → Respond

### Workflow 2: POST /update-status  
Webhook → Code (normalize) → HTTP Login (Trackmile) → Code (extract cookies) → Loop → HTTP Update (Trackmile) → Code (response) → Respond

## Project Structure

```
src/
  api.js              # n8n webhook API calls
  statuses.js         # Status definitions & helpers
  styles.js           # Shared theme constants
  App.jsx             # Main app component
  main.jsx            # Entry point
  components/
    Toast.jsx          # Notification toast
    BulkActionBar.jsx  # Multi-select action bar
    ShipmentRow.jsx    # Shipment list item
    DetailView.jsx     # Shipment detail + timeline
```

## Features

- Real-time shipment list from eShipz API
- Status updates pushed to Trackmile
- Multi-select bulk status updates
- Exception reporting
- Search by AWB, customer, or order reference
- Filter by status
- Mobile-optimized PWA (add to home screen)
- Works offline-ish (shows last loaded data)
