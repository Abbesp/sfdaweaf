/**
 * Node.js Trading Bot Server for Railway
 * This file serves as the entry point for the trading bot on Railway
 */

import express from 'express';
import { SpotTradingBot } from './spot-trading-bot-deploy.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Global bot instance to prevent multiple instances
let botInstance = null;
let isRunning = false;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Trading Bot</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          .status { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
          .button:hover { background: #0056b3; }
          .button:disabled { background: #ccc; cursor: not-allowed; }
          .status-running { background: #d4edda; border: 1px solid #c3e6cb; }
          .status-stopped { background: #f8d7da; border: 1px solid #f5c6cb; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Trading Bot</h1>
          <div class="status ${isRunning ? 'status-running' : 'status-stopped'}">
            <h2>Status: ${isRunning ? 'Running' : 'Stopped'}</h2>
            <p>${isRunning ? 'Bot is actively trading' : 'Bot is ready to start trading'}</p>
          </div>
          <button class="button" onclick="startBot()" ${isRunning ? 'disabled' : ''}>Start Bot</button>
          <button class="button" onclick="stopBot()" ${!isRunning ? 'disabled' : ''}>Stop Bot</button>
          <button class="button" onclick="getStats()">Get Stats</button>
          <div id="output"></div>
        </div>
        <script>
          async function startBot() {
            const response = await fetch('/start');
            const result = await response.text();
            document.getElementById('output').innerHTML = '<pre>' + result + '</pre>';
            if (response.ok) {
              location.reload();
            }
          }
          async function stopBot() {
            const response = await fetch('/stop');
            const result = await response.text();
            document.getElementById('output').innerHTML = '<pre>' + result + '</pre>';
            if (response.ok) {
              location.reload();
            }
          }
          async function getStats() {
            const response = await fetch('/stats');
            const result = await response.text();
            document.getElementById('output').innerHTML = '<pre>' + result + '</pre>';
          }
        </script>
      </body>
    </html>
  `);
});

app.post('/start', async (req, res) => {
  if (isRunning) {
    return res.status(400).send('Bot is already running!');
  }
  
  try {
    botInstance = new SpotTradingBot();
    isRunning = true;
    
    // Start bot in background without blocking the response
    botInstance.start().catch((error) => {
      console.error('Bot error:', error);
      isRunning = false;
      botInstance = null;
    });
    
    res.send('Bot started successfully!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).send(`Error starting bot: ${errorMessage}`);
  }
});

app.post('/stop', async (req, res) => {
  if (!isRunning || !botInstance) {
    return res.status(400).send('Bot is not running!');
  }
  
  try {
    await botInstance.stop();
    isRunning = false;
    botInstance = null;
    
    res.send('Bot stopped successfully!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).send(`Error stopping bot: ${errorMessage}`);
  }
});

app.get('/stats', (req, res) => {
  const stats = {
    status: isRunning ? 'Running' : 'Stopped',
    telegram: 'Enabled',
    features: [
      'Trade notifications',
      'Error alerts', 
      'Status updates',
      'Position updates'
    ],
    timestamp: new Date().toISOString(),
    uptime: isRunning ? 'Active' : 'Inactive'
  };
  
  res.json(stats);
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    bot_status: isRunning ? 'running' : 'stopped',
    uptime: 'unknown',
    version: '1.0.0',
    environment: 'production'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Trading Bot Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access the bot at: http://localhost:${PORT}`);
});
