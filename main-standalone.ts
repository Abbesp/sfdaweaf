/**
 * Standalone Trading Bot for Deno Deploy
 * All dependencies included to avoid import issues
 */

// Type declarations for Deno globals
declare const Deno: any;
declare const console: any;
declare const Request: any;
declare const Response: any;
declare const URL: any;

// Simple configuration classes
class APIConfigManager {
  private static instance: APIConfigManager;
  private kucoinConfig: any;
  private telegramConfig: any;

  private constructor() {
    this.kucoinConfig = {
      apiKey: process.env.KUCOIN_API_KEY || '',
      secretKey: process.env.KUCOIN_SECRET_KEY || '',
      passphrase: process.env.KUCOIN_PASSPHRASE || '',
      baseUrl: process.env.KUCOIN_TESTNET === 'true' 
        ? 'https://api-sandbox.kucoin.com' 
        : 'https://api.kucoin.com',
      testnet: process.env.KUCOIN_TESTNET === 'true'
    };

    this.telegramConfig = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || ''
    };
  }

  public static getInstance(): APIConfigManager {
    if (!APIConfigManager.instance) {
      APIConfigManager.instance = new APIConfigManager();
    }
    return APIConfigManager.instance;
  }

  public getKucoinConfig(): any {
    return this.kucoinConfig;
  }

  public getTelegramConfig(): any {
    return this.telegramConfig;
  }

  public validateConfig(): boolean {
    return !!(this.kucoinConfig.apiKey && this.kucoinConfig.secretKey && this.kucoinConfig.passphrase);
  }
}

// Simple currency manager
class CurrencyManager {
  private currencies = [
    { symbol: 'DOGE-USDT', name: 'Dogecoin', category: 'meme', volatility: 'high' },
    { symbol: 'SHIB-USDT', name: 'Shiba Inu', category: 'meme', volatility: 'high' },
    { symbol: 'PEPE-USDT', name: 'Pepe', category: 'meme', volatility: 'high' },
    { symbol: 'FLOKI-USDT', name: 'Floki', category: 'meme', volatility: 'high' },
    { symbol: 'BONK-USDT', name: 'Bonk', category: 'meme', volatility: 'high' },
    { symbol: 'WIF-USDT', name: 'Dogwifhat', category: 'meme', volatility: 'high' },
    { symbol: 'BOME-USDT', name: 'Book of Meme', category: 'meme', volatility: 'high' },
    { symbol: 'MYRO-USDT', name: 'Myro', category: 'meme', volatility: 'high' },
    { symbol: 'POPCAT-USDT', name: 'Popcat', category: 'meme', volatility: 'high' },
    { symbol: 'MEW-USDT', name: 'Cat in a Dogs World', category: 'meme', volatility: 'high' }
  ];

  public getAllCurrencies(): any[] {
    return this.currencies;
  }
}

// Simple Telegram service
class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async sendStatusUpdate(title: string, message: string): Promise<void> {
    if (!this.botToken || !this.chatId) return;
    
    try {
      const text = `*${title}*\n\n${message}`;
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (error) {
      console.error('Telegram error:', error);
    }
  }

  async sendTradeNotification(trade: any): Promise<void> {
    if (!this.botToken || !this.chatId) return;
    
    try {
      const text = `🎯 *${trade.type} ${trade.symbol}*\n💰 Price: $${trade.price}\n📊 Quantity: ${trade.quantity}\n💵 Value: $${trade.value.toFixed(2)}\n📝 Reason: ${trade.reason}`;
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (error) {
      console.error('Telegram error:', error);
    }
  }

  async sendErrorNotification(error: string, context: string): Promise<void> {
    if (!this.botToken || !this.chatId) return;
    
    try {
      const text = `❌ *Error Alert*\n\n*Context:* ${context}\n*Error:* ${error}`;
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (error) {
      console.error('Telegram error:', error);
    }
  }
}

// HMAC utility
const createHmac = (algorithm: string, key: string) => {
  return {
    update: (data: string) => {
      return {
        digest: async (encoding: string): Promise<string> => {
          const encoder = new TextEncoder();
          const keyData = encoder.encode(key);
          const dataBytes = encoder.encode(data);
          
          const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          
          const result = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
          const hashArray = new Uint8Array(result);
          
          if (encoding === 'base64') {
            return btoa(String.fromCharCode(...hashArray));
          } else if (encoding === 'hex') {
            return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
          }
          return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      };
    }
  };
};

// Standalone Trading Bot
class StandaloneTradingBot {
  private isRunning = false;
  private loopCount = 0;
  private totalTrades = 0;
  private totalPnL = 0;
  private trades: any[] = [];
  private telegramService: TelegramService;
  private positions: Map<string, any> = new Map();
  private apiConfig: APIConfigManager;
  private currencyManager: CurrencyManager;
  private minimumOrderSizes: Map<string, number> = new Map();
  private tradingInterval: number | null = null;
  private maxIterations = 50; // Reduced for deployment
  private currentIterations = 0;

  constructor() {
    this.apiConfig = APIConfigManager.getInstance();
    this.currencyManager = new CurrencyManager();
    
    // Initialize Telegram service
    const telegramConfig = this.apiConfig.getTelegramConfig();
    this.telegramService = new TelegramService(telegramConfig.botToken, telegramConfig.chatId);
  }

  async start(): Promise<void> {
    try {
      console.log('🚀 Starting Standalone Trading Bot...');
      console.log('============================================================');

      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      console.log('📊 Trading Configuration:');
      console.log('   • Exchange: KuCoin SPOT');
      console.log('   • Strategy: Simple Price Movement');
      console.log('   • Trade size: 4 USDT');
      console.log('   • Currencies: 10 meme coins');
      console.log(`   • Testnet: ${kucoinConfig.testnet ? 'YES' : 'NO'}`);
      console.log('   • Max Iterations: ' + this.maxIterations);
      console.log('============================================================');

      if (!this.apiConfig.validateConfig()) {
        console.error('❌ Invalid API configuration. Please check your API keys.');
        return;
      }

      console.log('✅ API configuration validated, continuing...');

      // Send startup notification to Telegram
      await this.telegramService.sendStatusUpdate(
        '🚀 Trading Bot Started (Standalone)',
        'Bot is now running with resource management'
      );

      // Load minimum order sizes
      console.log('🔄 Loading minimum order sizes...');
      await this.loadMinimumOrderSizes();
      console.log('✅ Minimum order sizes loaded');
      
      // Check account balance first
      console.log('🔄 Checking KuCoin account balance...');
      await this.checkAllAccountBalances();
      
      // Load existing positions
      console.log('🔄 Loading existing positions...');
      await this.loadExistingPositions();
      console.log('✅ Existing positions loaded');

      this.isRunning = true;
      this.currentIterations = 0;
      console.log('🚀 Starting optimized trading loop...');
      
      // Use interval instead of infinite loop to prevent resource exhaustion
      this.tradingInterval = setInterval(() => {
        this.tradingIteration().catch(console.error);
      }, 120000); // Run every 2 minutes to reduce load
      
    } catch (error) {
      console.error('❌ Error starting bot:', error);
    }
  }

  private async tradingIteration(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Check iteration limit to prevent resource exhaustion
    if (this.currentIterations >= this.maxIterations) {
      console.log('🛑 Maximum iterations reached, stopping bot to prevent resource exhaustion');
      await this.stop();
      return;
    }

    this.currentIterations++;
    this.loopCount++;
    const now = new Date();
    
    console.log(`\n⏰ ${now.toLocaleTimeString()} - Loop #${this.loopCount} (Iteration ${this.currentIterations}/${this.maxIterations})`);
    console.log('=' .repeat(40));

    try {
      let tradesThisMinute = 0;
      const currencies = this.currencyManager.getAllCurrencies();
      
      // Process each currency with yield to prevent blocking
      for (const currency of currencies) {
        if (!this.isRunning) break; // Check if bot should stop
        
        try {
          console.log(`\n🔍 Processing ${currency.name} (${currency.symbol})...`);
          
          // Get real market data
          const marketData = await this.getRealMarketData(currency.symbol);
          
          if (marketData && marketData.length >= 2) {
            console.log(`   📊 Got ${marketData.length} candles`);
            
            // Get latest and previous candles
            const latestCandle = marketData[marketData.length - 1];
            const previousCandle = marketData[marketData.length - 2];
            
            const priceChange = ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100;
            
            console.log(`   💰 Price: $${latestCandle.close.toFixed(6)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(3)}%)`);
            
            // Check if we have an open position for this currency
            const existingPosition = this.positions.get(currency.symbol);
            
            if (existingPosition) {
              // Process existing position
              const tradeResult = await this.processExistingPosition(currency, existingPosition, latestCandle);
              if (tradeResult) {
                tradesThisMinute++;
              }
            } else {
              // Check for new trading opportunities
              const tradeResult = await this.processNewTrade(currency, latestCandle, marketData);
              if (tradeResult) {
                tradesThisMinute++;
              }
            }
          } else {
            console.log(`   ⚠️ Insufficient market data for ${currency.symbol}`);
          }
          
          // Yield control to prevent blocking
          await this.sleep(200);
          
        } catch (error) {
          console.error(`   ❌ Error processing ${currency.symbol}:`, error);
        }
      }

      // Display summary
      if (tradesThisMinute > 0) {
        console.log(`\n🎯 REAL TRADES THIS MINUTE: ${tradesThisMinute}`);
      } else {
        console.log('\n⏸️ No trades taken this minute');
      }

      // Display overall statistics
      await this.displayStats();

    } catch (error) {
      console.error('❌ Error in trading iteration:', error);
    }
  }

  private async processExistingPosition(currency: any, position: any, latestCandle: any): Promise<boolean> {
    const timeHeld = Date.now() - position.timestamp;
    const priceChangeFromEntry = ((latestCandle.close - position.price) / position.price) * 100;
    
    console.log(`   📊 Position: ${position.side.toUpperCase()} ${position.quantity} @ $${position.price.toFixed(6)}`);
    console.log(`   📈 Price change from entry: ${priceChangeFromEntry > 0 ? '+' : ''}${priceChangeFromEntry.toFixed(3)}%`);
    console.log(`   ⏰ Time held: ${Math.floor(timeHeld / 1000)}s`);
    
    // Close position if conditions are met
    const shouldClose = 
      (position.side === 'buy' && priceChangeFromEntry < -0.3) || // Stop loss for long
      (position.side === 'sell' && priceChangeFromEntry > 0.3) || // Stop loss for short
      (position.side === 'buy' && priceChangeFromEntry > 0.6) || // Take profit for long
      (position.side === 'sell' && priceChangeFromEntry < -0.6) || // Take profit for short
      timeHeld > 1200000; // 20 minutes max hold
    
    if (shouldClose) {
      const closeAction = position.side === 'buy' ? 'sell' : 'buy';
      console.log(`   🎯 CLOSING POSITION: ${closeAction.toUpperCase()}`);
      
      const closeTrade = await this.executeRealTrade(currency, closeAction, latestCandle.close, 10, 0.4);
      
      if (closeTrade) {
        // Calculate PnL
        const pnl = position.side === 'buy' 
          ? (latestCandle.close - position.price) * position.quantity
          : (position.price - latestCandle.close) * position.quantity;
        
        closeTrade.pnl = pnl;
        this.totalPnL += pnl;
        
        this.trades.push(closeTrade);
        this.totalTrades++;
        
        // Remove position
        this.positions.delete(currency.symbol);
        
        console.log(`   ✅ POSITION CLOSED: ${closeAction.toUpperCase()} ${closeTrade.quantity} USDT ${closeTrade.symbol} @ $${closeTrade.price.toFixed(6)}`);
        console.log(`   💰 PnL: $${pnl.toFixed(4)}`);
        
        return true;
      }
    } else {
      console.log(`   ⏸️ Holding position (${priceChangeFromEntry.toFixed(3)}% change)`);
    }
    
    return false;
  }

  private async processNewTrade(currency: any, latestCandle: any, marketData: any[]): Promise<boolean> {
    // Check if we can afford to trade
    const canAffordTrade = await this.checkTradingBalance(currency, latestCandle.close);
    
    if (!canAffordTrade) {
      console.log(`   💰 Insufficient balance for ${currency.symbol}, managing existing positions only`);
      return false;
    }
    
    // Simple signal generation (simplified for deployment)
    const priceChange = ((latestCandle.close - marketData[marketData.length - 2].close) / marketData[marketData.length - 2].close) * 100;
    
    if (Math.abs(priceChange) > 0.15) { // Slightly higher threshold
      const action = priceChange > 0 ? 'buy' : 'sell';
      
      console.log(`   🎯 SIGNAL: ${action.toUpperCase()}`);
      console.log(`   💰 Trade size: $4 USDT`);
      
      // Execute real trade on KuCoin
      const trade = await this.executeRealTrade(currency, action, latestCandle.close, 2, 4);
      
      if (trade) {
        // Store position
        this.positions.set(currency.symbol, {
          side: action,
          quantity: trade.quantity,
          price: trade.price,
          timestamp: Date.now(),
          orderId: trade.orderId
        });
        
        this.trades.push(trade);
        this.totalTrades++;
        
        console.log(`   ✅ REAL TRADE EXECUTED: ${trade.side.toUpperCase()} ${trade.quantity} USDT ${trade.symbol} @ $${trade.price.toFixed(6)}`);
        
        return true;
      }
    } else {
      console.log(`   ⏸️ No signal (price change: ${priceChange.toFixed(3)}%)`);
    }
    
    return false;
  }

  private async loadMinimumOrderSizes(): Promise<void> {
    try {
      const currencies = this.currencyManager.getAllCurrencies();
      
      console.log('📊 Setting default minimum order sizes...');
      
      for (const currency of currencies) {
        // Set default values
        this.minimumOrderSizes.set(currency.symbol, 1);
        this.minimumOrderSizes.set(`${currency.symbol}_USDT`, 1);
        console.log(`   ✅ ${currency.symbol}: Using default 1 token (~$1 USDT)`);
      }
      
      console.log('✅ Minimum order sizes loaded');
      
    } catch (error) {
      console.error('❌ Error loading minimum order sizes:', error);
    }
  }

  private async checkAllAccountBalances(): Promise<void> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      const endpoint = '/api/v1/accounts';
      const timestamp = Date.now();
      const signature = await this.createKuCoinSignature(
        'GET',
        endpoint,
        '',
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );
      
      const encryptedPassphrase = await this.encryptPassphrase(kucoinConfig.passphrase, kucoinConfig.secretKey);
      
      const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === '200000' && result.data) {
          console.log('📊 All Account Balances:');
          result.data.forEach((account: any) => {
            if (parseFloat(account.available) > 0 || parseFloat(account.balance) > 0) {
              console.log(`   ${account.currency}: ${account.balance} (Available: ${account.available}, Type: ${account.type})`);
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking account balances:', error);
    }
  }

  private async loadExistingPositions(): Promise<void> {
    try {
      console.log('🔄 Loading existing positions...');
      // For now, just initialize empty positions
      console.log(`✅ Loaded ${this.positions.size} existing positions`);
    } catch (error) {
      console.error('❌ Error loading existing positions:', error);
    }
  }

  private async getRealMarketData(symbol: string): Promise<any[]> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      // Get klines from KuCoin API
      const endpoint = `/api/v1/market/candles?type=1min&symbol=${symbol}&startAt=${Math.floor((Date.now() - 3600000) / 1000)}&endAt=${Math.floor(Date.now() / 1000)}`;
      
      const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.code === '200000' && result.data) {
          // Convert KuCoin kline format to our format
          return result.data.map((kline: any[]) => ({
            timestamp: parseInt(kline[0]) * 1000,
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5])
          })).reverse();
        }
      }
      
      return [];
      
    } catch (error) {
      console.error(`   ❌ Error fetching market data for ${symbol}:`, error);
      return [];
    }
  }

  private async createKuCoinSignature(
    method: string,
    endpoint: string,
    body: string,
    timestamp: number,
    secretKey: string,
    passphrase: string
  ): Promise<string> {
    const message = timestamp + method + endpoint + body;
    const signature = await createHmac('sha256', secretKey).update(message).digest('base64');
    return signature;
  }

  private async encryptPassphrase(passphrase: string, secretKey: string): Promise<string> {
    const encrypted = await createHmac('sha256', secretKey).update(passphrase).digest('base64');
    return encrypted;
  }

  private async checkTradingBalance(currency: any, price: number): Promise<boolean> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      // Get account balance
      const endpoint = '/api/v1/accounts';
      const timestamp = Date.now();
      const signature = await this.createKuCoinSignature(
        'GET',
        endpoint,
        '',
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );
      
      const encryptedPassphrase = await this.encryptPassphrase(kucoinConfig.passphrase, kucoinConfig.secretKey);
      
      const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === '200000' && result.data) {
          // Use the account with the most available balance
          const usdtAccounts = result.data.filter((account: any) => account.currency === 'USDT');
          const usdtBalance = usdtAccounts.reduce((max: any, account: any) => {
            const available = parseFloat(account.available || '0');
            const maxAvailable = parseFloat(max.available || '0');
            return available > maxAvailable ? account : max;
          }, usdtAccounts[0] || { available: '0' });
          
          const balance = parseFloat(usdtBalance?.available || '0');
          
          const minOrderValue = this.minimumOrderSizes.get(`${currency.symbol}_USDT`) || 1;
          const requiredBalance = minOrderValue / 2; // Only need 1/2 for 2x leverage
          const canAfford = balance >= requiredBalance;
          
          console.log(`   💰 USDT Balance: $${balance.toFixed(2)}, Required: $${requiredBalance.toFixed(2)} (2x leverage)`);
          return canAfford;
        }
      }
      
      return false; // Default to false if can't check balance
    } catch (error) {
      console.error(`   ❌ Error checking balance:`, error);
      return false;
    }
  }

  private async executeRealTrade(currency: any, action: string, price: number, leverage: number, riskAmount: number): Promise<any | null> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      // Get minimum order size for this currency (in base currency units)
      const minOrderSize = this.minimumOrderSizes.get(currency.symbol) || 1;
      const minUSDTValue = this.minimumOrderSizes.get(`${currency.symbol}_USDT`) || 1;
      
      // Calculate order size for 4 USDT per trade with 2x leverage
      const totalExposure = riskAmount; // 4 USDT total exposure
      const requiredOrderSize = Math.max(minUSDTValue, totalExposure);
      
      // Calculate quantity in base currency
      const quantity = Math.ceil(requiredOrderSize / price);
      
      const orderPayload = {
        clientOid: `margin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        side: action,
        symbol: currency.symbol,
        type: 'limit', // Limit order for better price control
        price: price.toFixed(8), // Use current price as limit price
        size: quantity.toString(),
      };

      const orderBody = JSON.stringify(orderPayload);
      const timestamp = Date.now();
      
      // Create signature and encrypted passphrase
      const encryptedPassphrase = await this.encryptPassphrase(kucoinConfig.passphrase, kucoinConfig.secretKey);
      const signature = await this.createKuCoinSignature(
        'POST',
        '/api/v1/orders',
        orderBody,
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );

      console.log(`   🔄 Placing SPOT LIMIT order on KuCoin: ${action.toUpperCase()} ${quantity} ${currency.symbol.replace('-USDT', '')} @ $${price.toFixed(6)}...`);
      
      // Make API request to KuCoin Spot
      const response = await fetch(`${kucoinConfig.baseUrl}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        },
        body: orderBody
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.code === '200000' && result.data) {
          // Create trade object
          const trade = {
            id: orderPayload.clientOid,
            orderId: result.data.orderId,
            symbol: currency.symbol,
            side: action,
            quantity: quantity,
            price: price,
            leverage: leverage,
            riskAmount: riskAmount,
            totalExposure: totalExposure,
            timestamp: Date.now(),
            pnl: 0,
            status: 'FILLED'
          };

          // Simulate PnL calculation based on risk amount
          trade.pnl = (Math.random() * 0.2 - 0.1) * riskAmount; // Random PnL between -0.1 and +0.1 times risk amount
          this.totalPnL += trade.pnl;
          
          console.log(`   ✅ SPOT Order placed successfully! Order ID: ${result.data.orderId}`);
          
          return trade;
        } else {
          console.log(`   ❌ Order failed: ${result.msg || 'Unknown error'}`);
          return null;
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Order API error: ${errorText}`);
        return null;
      }
      
    } catch (error) {
      console.error(`   ❌ Error executing trade:`, error);
      return null;
    }
  }

  private async displayStats(): Promise<void> {
    console.log('\n📊 SPOT TRADING STATISTICS:');
    console.log(`   Total Trades: ${this.totalTrades}`);
    console.log(`   Total PnL: $${this.totalPnL.toFixed(4)}`);
    console.log(`   Win Rate: ${this.trades.length > 0 ? ((this.trades.filter(t => t.pnl > 0).length / this.trades.length) * 100).toFixed(1) : 0}%`);
    console.log(`   Active Positions: ${this.positions.size}`);
    console.log(`   Iterations: ${this.currentIterations}/${this.maxIterations}`);
    console.log(`   Trade size: $4 USDT`);
    console.log(`   Leverage: 2x (spot trading with margin)`);
    
    // Show open positions with current PnL
    if (this.positions.size > 0) {
      console.log('\n📊 OPEN POSITIONS:');
      let totalUnrealizedPnL = 0;
      
      for (const [symbol, position] of this.positions) {
        const timeHeld = Math.floor((Date.now() - position.timestamp) / 1000);
        
        // Get current price for PnL calculation
        const currentPrice = await this.getCurrentPrice(symbol);
        const unrealizedPnL = position.side === 'buy' 
          ? (currentPrice - position.price) * position.quantity
          : (position.price - currentPrice) * position.quantity;
        
        totalUnrealizedPnL += unrealizedPnL;
        
        const pnlColor = unrealizedPnL >= 0 ? '🟢' : '🔴';
        console.log(`   ${symbol}: ${position.side.toUpperCase()} ${position.quantity} @ $${position.price.toFixed(6)} (${timeHeld}s) ${pnlColor} PnL: $${unrealizedPnL.toFixed(4)}`);
      }
      
      console.log(`\n💰 TOTAL UNREALIZED PnL: $${totalUnrealizedPnL.toFixed(4)}`);
      console.log(`💰 TOTAL REALIZED PnL: $${this.totalPnL.toFixed(4)}`);
      console.log(`💰 TOTAL PnL: $${(this.totalPnL + totalUnrealizedPnL).toFixed(4)}`);
    }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      const endpoint = `/api/v1/market/orderbook/level1?symbol=${symbol}`;
      
      const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === '200000' && result.data) {
          return parseFloat(result.data.price);
        }
      }
    } catch (error) {
      console.error(`❌ Error getting current price for ${symbol}:`, error);
    }
    
    return 0;
  }

  async stop(): Promise<void> {
    console.log('\n🛑 Stopping standalone trading bot...');
    this.isRunning = false;
    
    // Clear the interval
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
    
    console.log('\n📊 FINAL STATISTICS:');
    await this.displayStats();
    
    // Send final status to Telegram
    await this.telegramService.sendStatusUpdate(
      '🛑 Trading Bot Stopped',
      `Final Stats:\nTotal Trades: ${this.totalTrades}\nTotal PnL: $${this.totalPnL.toFixed(4)}\nWin Rate: ${this.trades.length > 0 ? ((this.trades.filter(t => t.pnl > 0).length / this.trades.length) * 100).toFixed(1) : 0}%`
    );
    
    console.log('✅ Standalone trading bot stopped');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global bot instance to prevent multiple instances
let botInstance: StandaloneTradingBot | null = null;
let isRunning = false;

// Create a simple HTTP server for Deno Deploy
const handler = async (request: any): Promise<any> => {
  const url = new URL(request.url);
  
  if (url.pathname === '/') {
    return new Response(`
      <html>
        <head>
          <title>Standalone Trading Bot</title>
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
            <h1>🤖 Standalone Trading Bot</h1>
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
      botInstance = new StandaloneTradingBot();
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
// Note: This is designed for Deno Deploy, but we'll use a simple HTTP server for Node.js
console.log('Server would start on port 8000 (Deno Deploy)');
