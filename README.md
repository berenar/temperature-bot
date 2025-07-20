# Temperature Bot

A TypeScript Node.js application that fetches temperature data from HomePod mini devices every hour via HomeKit.

## Features

- 🌡️ Reads temperature from HomePod mini sensors
- ⏰ Scheduled hourly temperature checks
- 🔍 Automatic HomeKit device discovery
- 📊 Temperature analysis and alerts
- 🛡️ Error handling and graceful shutdown

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run the application:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

## Requirements

- Node.js 16+
- HomePod mini on the same network
- HomeKit setup with temperature sensor access

## How it works

The app uses the HomeKit Accessory Protocol (HAP) to discover and connect to HomePod devices, reads temperature data, and logs it every hour. It also provides basic temperature alerts for heating/cooling suggestions.

## Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled app
- `npm run dev` - Run in development mode with ts-node
- `Ctrl+C` - Gracefully shutdown the monitoring