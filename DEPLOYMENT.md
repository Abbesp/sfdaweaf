# Trading Bot Deployment Guide

## Deno Deploy Deployment

This guide will help you deploy the trading bot to Deno Deploy without encountering the 503 POOL_DEPLETED error.

### Key Optimizations Made

1. **Resource Management**: 
   - Limited maximum iterations to prevent infinite loops
   - Used `setInterval` instead of `while` loops
   - Added proper error handling and resource cleanup

2. **Memory Management**:
   - Implemented proper cleanup when stopping the bot
   - Limited data structures to prevent memory leaks
   - Added yield points to prevent blocking operations

3. **Deployment-Friendly Code**:
   - Separated concerns between HTTP server and trading logic
   - Added proper status management
   - Implemented graceful shutdown handling

### Deployment Steps

1. **Prepare Your Environment**:
   ```bash
   # Make sure you have the required environment variables
   cp TradingBot/env.example .env
   # Edit .env with your API keys
   ```

2. **Deploy to Deno Deploy**:
   - Go to [Deno Deploy](https://dash.deno.com/)
   - Create a new project
   - Connect your GitHub repository
   - Set the entry point to `main.ts`
   - Deploy!

3. **Environment Variables**:
   Make sure to set these in your Deno Deploy project settings:
   - `KUCOIN_API_KEY`
   - `KUCOIN_SECRET_KEY`
   - `KUCOIN_PASSPHRASE`
   - `KUCOIN_TESTNET` (set to `true` for testing)
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

### API Endpoints

- `GET /` - Main dashboard with start/stop controls
- `POST /start` - Start the trading bot
- `POST /stop` - Stop the trading bot
- `GET /stats` - Get trading statistics
- `GET /health` - Health check endpoint

### Monitoring

The bot includes several monitoring features:

1. **Health Check**: Visit `/health` to check if the service is running
2. **Status Dashboard**: Visit `/` to see the current status and control the bot
3. **Telegram Notifications**: The bot sends status updates to Telegram
4. **Resource Limits**: The bot automatically stops after 100 iterations to prevent resource exhaustion

### Troubleshooting

If you encounter the 503 POOL_DEPLETED error:

1. **Check Resource Usage**: The bot now has built-in limits to prevent resource exhaustion
2. **Monitor Iterations**: The bot will automatically stop after 100 iterations
3. **Check Logs**: Look at the Deno Deploy logs for any errors
4. **Restart if Needed**: Use the stop/start buttons on the dashboard

### Configuration

The bot is configured for:
- **Trade Size**: 4 USDT per trade
- **Leverage**: 2x (spot trading with margin)
- **Currencies**: 10 meme coins
- **Strategy**: Ultra Aggressive Strategy
- **Max Iterations**: 100 (prevents resource exhaustion)

### Safety Features

1. **Automatic Stop**: Bot stops after 100 iterations
2. **Balance Checks**: Verifies sufficient balance before trading
3. **Error Handling**: Comprehensive error handling and logging
4. **Position Management**: Proper position tracking and management
5. **Resource Cleanup**: Proper cleanup when stopping

### Support

If you encounter any issues:
1. Check the Deno Deploy logs
2. Verify your API keys are correct
3. Ensure you have sufficient balance
4. Check the health endpoint for service status
