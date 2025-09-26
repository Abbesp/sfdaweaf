/**
 * Main entry point for Railway Deploy
 * This file serves as the entry point for the trading bot on Railway
 */

// Type declarations for Deno globals
declare const Deno: any;
declare const console: any;
declare const Request: any;
declare const Response: any;
declare const URL: any;

import { SpotTradingBot } from './spot-trading-bot-deploy';

// Global bot instance to prevent multiple instances
let botInstance: SpotTradingBot | null = null;
let isRunning = false;

// Create a simple HTTP server for Railway Deploy
const handler = async (request: any): Promise<any> => {
  const url = new URL(request.url);
  
  if (url.pathname === '/') {
    return new Response(`
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
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  if (url.pathname === '/start') {
    if (isRunning) {
      return new Response('Bot is already running!', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
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
      
      return new Response('Bot started successfully!', {
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(`Error starting bot: ${errorMessage}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
  
  if (url.pathname === '/stop') {
    if (!isRunning || !botInstance) {
      return new Response('Bot is not running!', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    try {
      await botInstance.stop();
      isRunning = false;
      botInstance = null;
      
      return new Response('Bot stopped successfully!', {
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(`Error stopping bot: ${errorMessage}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
  
  if (url.pathname === '/stats') {
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
    
    return new Response(JSON.stringify(stats, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
  
  // Health check route
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bot_status: isRunning ? 'running' : 'stopped',
      uptime: 'unknown',
      version: '1.0.0',
      environment: 'production'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
  
  return new Response('Not found', { status: 404 });
};

// Start the server
Deno.serve({ port: 8000 }, handler);
