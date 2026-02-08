# Chain-Guard MVP Setup Guide

## 🚀 Quick Start

### 1. Environment Setup

Copy `example.env.local` to `.env.local` and add your API keys:

```bash
cp example.env.local .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your-tambo-api-key-here
NEXT_PUBLIC_TRACKINGMORE_API_KEY=your-trackingmore-api-key-here
```

**Get API Keys:**
- **Tambo API Key**: Get a free key from [https://tambo.co/dashboard](https://tambo.co/dashboard)
- **TrackingMore API Key**: Get from [https://www.trackingmore.com/api-doc](https://www.trackingmore.com/api-doc)

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access Chain-Guard

Open [http://localhost:3000/chain-guard](http://localhost:3000/chain-guard)

## 📋 What's Included in the MVP

### ✅ Components

1. **Timeline Component** (`src/components/tambo/timeline.tsx`)
   - Displays immutable timeline of tracking events
   - Shows timestamps, locations, and status indicators
   - Supports different variants (default, compact, detailed)

2. **ShipmentCard Component** (`src/components/tambo/shipment-card.tsx`)
   - Displays shipment information in card format
   - Shows tracking number, courier, status, route
   - Visual status indicators

### ✅ Tools (Tambo AI Functions)

1. **createShipmentTracking**
   - Creates a new tracking in TrackingMore
   - Usage: "Track package 1Z999AA10123456784 with UPS"

2. **getShipmentTracking**
   - Gets detailed tracking information
   - Returns complete timeline with all events
   - Usage: "Show me tracking for 1Z999AA10123456784"

3. **searchShipments**
   - Lists/search shipments
   - Filter by courier, date range
   - Usage: "Show me all DHL shipments from last week"

### ✅ Services

1. **TrackingMore API Service** (`src/services/trackingmore.ts`)
   - Complete API wrapper for TrackingMore v4
   - Methods: create, get, list, delete

2. **Tracking Tools** (`src/services/tracking-tools.ts`)
   - Tambo-compatible tool functions
   - Data transformation to our schemas

3. **Data Schemas** (`src/lib/tracking-schemas.ts`)
   - Zod schemas for type safety
   - Shipment, TrackingEvent, etc.

## 🎯 How to Use

### Example 1: Create a Tracking

In the Chain-Guard chat, try:

```
Track package 1Z999AA10123456784 with courier UPS
```

The AI will:
1. Call `createShipmentTracking` tool
2. Fetch tracking data from TrackingMore
3. Display a `ShipmentCard` with the shipment info
4. Show a `Timeline` with all tracking events

### Example 2: Get Tracking Details

```
Show me the timeline for tracking number 1Z999AA10123456784 from UPS
```

The AI will:
1. Call `getShipmentTracking` tool
2. Display a detailed `Timeline` component
3. Show all events with timestamps and locations

### Example 3: Search Shipments

```
List all DHL shipments
```

The AI will:
1. Call `searchShipments` tool
2. Display multiple `ShipmentCard` components
3. Show all matching shipments

## 🔧 Supported Couriers

Common courier codes supported by TrackingMore:
- `dhl` - DHL
- `ups` - UPS
- `fedex` - FedEx
- `usps` - USPS
- `tnt` - TNT
- `dpd` - DPD
- `aramex` - Aramex
- And many more...

See [TrackingMore courier list](https://www.trackingmore.com/courier.html) for full list.

## 📁 Project Structure

```
src/
├── app/
│   └── chain-guard/
│       └── page.tsx          # Chain-Guard main page
├── components/
│   └── tambo/
│       ├── timeline.tsx      # Timeline component
│       └── shipment-card.tsx # Shipment card component
├── lib/
│   ├── tambo.ts             # Component & tool registration
│   └── tracking-schemas.ts   # Zod schemas
└── services/
    ├── trackingmore.ts      # TrackingMore API service
    └── tracking-tools.ts    # Tambo tools
```

## 🐛 Troubleshooting

### API Key Issues

**Error: "TrackingMore API key is not configured"**
- Make sure `NEXT_PUBLIC_TRACKINGMORE_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

**Error: "Tambo API key is not configured"**
- Make sure `NEXT_PUBLIC_TAMBO_API_KEY` is set in `.env.local`
- Get a free key from [tambo.co/dashboard](https://tambo.co/dashboard)

### Tracking Issues

**Error: "Failed to create tracking"**
- Check that the tracking number is valid
- Verify the courier code is correct
- Some tracking numbers may already exist in TrackingMore

**No events in timeline**
- Some shipments may not have tracking events yet
- The courier may not have updated the tracking information
- Wait a few minutes and try again

## 🚀 Next Steps

1. **Add Route Map Component** - Visualize shipment routes on a map
2. **Add Anomaly Detection** - Detect unusual patterns in tracking
3. **Add Export Features** - Export timelines as PDF/CSV
4. **Add Multi-Shipment Comparison** - Compare multiple shipments
5. **Add Predictive Analytics** - Predict delivery times

## 📚 Resources

- [Tambo Documentation](https://docs.tambo.co)
- [TrackingMore API Docs](https://www.trackingmore.com/api-doc)
- [Project Understanding](./PROJECT_UNDERSTANDING.md)
- [Quick Reference](./QUICK_REFERENCE.md)
