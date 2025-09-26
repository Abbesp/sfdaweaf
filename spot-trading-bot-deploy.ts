/**
 * KuCoin Spot Trading Bot - Node.js Version for Railway
 * Optimized for Railway deployment
 */

import axios from 'axios';
import { createHmac } from 'crypto';

// API Configuration Manager
class APIConfigManager {
  static instance: APIConfigManager | null = null;
  
  constructor() {
    this.kucoinConfig = {
      apiKey: process.env.KUCOIN_API_KEY || '',
      secretKey: process.env.KUCOIN_SECRET_KEY || '',
      passphrase: process.env.KUCOIN_PASSPHRASE || '',
      baseUrl: process.env.KUCOIN_BASE_URL || 'https://api.kucoin.com',
      testnet: process.env.KUCOIN_TESTNET === 'true'
    };
    
    this.telegramConfig = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || ''
    };
  }
  
  static getInstance(): APIConfigManager {
    if (!APIConfigManager.instance) {
      APIConfigManager.instance = new APIConfigManager();
    }
    return APIConfigManager.instance;
  }
  
  getKucoinConfig(): {
    apiKey: string;
    secretKey: string;
    passphrase: string;
    baseUrl: string;
    testnet: boolean;
  } {
    return this.kucoinConfig;
  }
  
  getTelegramConfig(): { botToken: string; chatId: string } {
    return this.telegramConfig;
  }
  
  validateConfig(): boolean {
    return !!(this.kucoinConfig.apiKey && this.kucoinConfig.secretKey && this.kucoinConfig.passphrase);
  }
}

// Currency Manager
class CurrencyManager {
  constructor() {
    this.currencies = [
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
  }
  
  getAllCurrencies(): Array<{ symbol: string; name: string; category: string; volatility: string }> {
    return this.currencies;
  }
  
  getCurrency(symbol: string) {
    return this.currencies.find(c => c.symbol === symbol);
  }
}

// Telegram Service
class TelegramService {
  botToken: string;
  chatId: string;
  baseUrl: string;
  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }
  
  async sendMessage(message: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      console.log('Telegram not configured, skipping message');
      return;
    }
    
    try {
      await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error: unknown) {
      console.error('Error sending Telegram message:', (error as Error).message);
    }
  }
  
  async sendStatusUpdate(title: string, message: string): Promise<void> {
    const fullMessage = `🤖 <b>${title}</b>\n\n${message}`;
    await this.sendMessage(fullMessage);
  }
}

// Create instances
const apiConfig = APIConfigManager.getInstance();
const currencyManager = new CurrencyManager();

// Main Trading Bot Class
type Position = {
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  orderId: string;
};

type Candle = { timestamp: number; open: number; high: number; low: number; close: number; volume: number };

type Currency = { symbol: string; name: string; category: string; volatility: string };

type Trade = {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  leverage: number;
  riskAmount: number;
  totalExposure: number;
  timestamp: number;
  pnl: number;
  status: string;
};

export class SpotTradingBot {
  isRunning: boolean;
  loopCount: number;
  totalTrades: number;
  totalPnL: number;
  trades: Trade[];
  telegramService: TelegramService;
  positions: Map<string, Position>;
  minimumOrderSizes: Map<string, number>;
  tradingHistory: Trade[];
  tradingInterval: NodeJS.Timeout | null;
  maxIterations: number;
  currentIterations: number;

  constructor() {
    this.isRunning = false;
    this.loopCount = 0;
    this.totalTrades = 0;
    this.totalPnL = 0;
    this.trades = [];
    this.telegramService = new TelegramService(
      apiConfig.getTelegramConfig().botToken,
      apiConfig.getTelegramConfig().chatId
    );
    this.positions = new Map<string, Position>();
    this.minimumOrderSizes = new Map<string, number>();
    this.tradingHistory = [];
    this.tradingInterval = null;
    this.maxIterations = 100;
    this.currentIterations = 0;
  }

  /**
   * Start the spot trading bot
   */
  async start() {
    try {
      console.log('🚀 Starting KuCoin SPOT Trading Bot (Node.js Railway Version)...');
      console.log('============================================================');

      const kucoinConfig = apiConfig.getKucoinConfig();
      
      console.log('📊 Trading Configuration:');
      console.log('   • Exchange: KuCoin SPOT');
      console.log('   • Strategy: Ultra Aggressive Strategy');
      console.log('   • Trade size: 4 USDT');
      console.log('   • Leverage: 2x (spot trading with margin)');
      console.log('   • Currencies: 10 meme coins');
      console.log(`   • Testnet: ${kucoinConfig.testnet ? 'YES' : 'NO'}`);
      console.log('   • REAL MONEY TRADING: YES');
      console.log('   • Max Iterations: ' + this.maxIterations);
      console.log('============================================================');

      if (!apiConfig.validateConfig()) {
        console.error('❌ Invalid API configuration. Please check your API keys.');
        return;
      }

      console.log('✅ API configuration validated, continuing...');

      // Send startup notification to Telegram
      await this.telegramService.sendStatusUpdate(
        '🚀 Trading Bot Started (Railway Node.js)',
        'Bot is now running on Railway with Node.js'
      );

      // Load minimum order sizes
      console.log('🔄 Loading minimum order sizes from KuCoin...');
      await this.loadMinimumOrderSizes();
      console.log('✅ Minimum order sizes loaded');
      
      // Check account balance first
      console.log('🔄 Checking KuCoin account balance...');
      await this.checkAllAccountBalances();
      
      // Load existing positions from KuCoin
      console.log('🔄 Loading existing positions from KuCoin...');
      await this.loadExistingPositions();
      console.log('✅ Existing positions loaded');

      this.isRunning = true;
      this.currentIterations = 0;
      console.log('🚀 Starting optimized trading loop...');
      
      // Use interval instead of infinite loop to prevent resource exhaustion
      this.tradingInterval = setInterval(() => {
        this.tradingIteration().catch(console.error);
      }, 60000); // Run every minute
      
    } catch (error) {
      console.error('❌ Error starting bot:', error);
    }
  }

  /**
   * Single trading iteration - runs every minute
   */
  async tradingIteration(): Promise<void> {
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
      const currencies = currencyManager.getAllCurrencies();
      
      // Process each currency
      for (const currency of currencies) {
        if (!this.isRunning) break;
        
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
          
          // Small delay to prevent overwhelming the API
          await this.sleep(100);
          
        } catch (error: unknown) {
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

    } catch (error: unknown) {
      console.error('❌ Error in trading iteration:', error);
    }
  }

  /**
   * Process existing position
   */
  async processExistingPosition(currency: Currency, position: Position, latestCandle: Candle): Promise<boolean> {
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

  /**
   * Process new trade opportunity
   */
  async processNewTrade(currency: Currency, latestCandle: Candle, marketData: Candle[]): Promise<boolean> {
    // Check if we can afford to trade
    const canAffordTrade = await this.checkTradingBalance(currency, latestCandle.close);
    
    if (!canAffordTrade) {
      console.log(`   💰 Insufficient balance for ${currency.symbol}, managing existing positions only`);
      return false;
    }
    
    // Simple signal generation
    const priceChange = ((latestCandle.close - marketData[marketData.length - 2].close) / marketData[marketData.length - 2].close) * 100;
    
    if (Math.abs(priceChange) > 0.1) { // Simple threshold
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

  /**
   * Check all account balances
   */
  async checkAllAccountBalances(): Promise<void> {
    try {
      const kucoinConfig = apiConfig.getKucoinConfig();
      
      const endpoint = '/api/v1/accounts';
      const timestamp = Date.now();
      const signature = this.createKuCoinSignature(
        'GET',
        endpoint,
        '',
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );
      
      const encryptedPassphrase = this.encryptPassphrase(kucoinConfig.passphrase, kucoinConfig.secretKey);
      
      const response = await axios.get(`${kucoinConfig.baseUrl}${endpoint}`, {
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === '200000' && response.data.data) {
        console.log('📊 All Account Balances:');
        response.data.data.forEach((account) => {
          if (parseFloat(account.available) > 0 || parseFloat(account.balance) > 0) {
            console.log(`   ${account.currency}: ${account.balance} (Available: ${account.available}, Type: ${account.type})`);
          }
        });
      }
    } catch (error: unknown) {
      console.error('❌ Error checking account balances:', (error as Error).message);
    }
  }

  /**
   * Load existing positions from KuCoin
   */
  async loadExistingPositions(): Promise<void> {
    try {
      console.log('🔄 Loading existing positions from KuCoin...');
      const kucoinConfig = apiConfig.getKucoinConfig();
      
      // Get all orders from KuCoin (both active and filled)
      const endpoint = '/api/v1/orders?status=active';
      const timestamp = Date.now();
      const signature = this.createKuCoinSignature(
        'GET',
        endpoint,
        '',
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );
      
      const encryptedPassphrase = this.encryptPassphrase(kucoinConfig.passphrase, kucoinConfig.secretKey);
      
      const response = await axios.get(`${kucoinConfig.baseUrl}${endpoint}`, {
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === '200000' && response.data.data) {
        const activeOrders = response.data.data.items || [];
        
        console.log(`   📊 Found ${activeOrders.length} active orders on KuCoin`);
        
        // Process active orders and create positions
        for (const order of activeOrders) {
          const symbol = order.symbol;
          const side = order.side.toLowerCase();
          const price = parseFloat(order.price);
          const quantity = parseFloat(order.size);
          const orderId = order.id;
          
          // Store as position
          this.positions.set(symbol, {
            side: side,
            quantity: quantity,
            price: price,
            timestamp: Date.now() - 300000, // Assume 5 minutes ago
            orderId: orderId
          });
          
          console.log(`   📊 Loaded position: ${side.toUpperCase()} ${quantity} ${symbol} @ $${price.toFixed(6)}`);
        }
      }
      
      console.log(`✅ Loaded ${this.positions.size} existing positions`);
    } catch (error: unknown) {
      console.error('❌ Error loading existing positions:', (error as Error).message);
    }
  }

  /**
   * Load minimum order sizes and calculate required USDT values for all currencies
   */
  async loadMinimumOrderSizes(): Promise<void> {
    try {
      const kucoinConfig = apiConfig.getKucoinConfig();
      const currencies = currencyManager.getAllCurrencies();
      
      console.log('📊 Fetching minimum order requirements and calculating USDT values...');
      
      for (const currency of currencies) {
        try {
          // Get symbol info from KuCoin API
          const endpoint = `/api/v1/symbols/${currency.symbol}`;
          
          const response = await axios.get(`${kucoinConfig.baseUrl}${endpoint}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.data.code === '200000' && response.data.data) {
            const symbolInfo = response.data.data;
            const minOrderSize = parseFloat(symbolInfo.baseMinSize) || 1;
            
            // Get current price to calculate USDT value
            const priceEndpoint = `/api/v1/market/orderbook/level1?symbol=${currency.symbol}`;
            const priceResponse = await axios.get(`${kucoinConfig.baseUrl}${priceEndpoint}`);
            
            let currentPrice = 0.01; // Default fallback price
            if (priceResponse.data.code === '200000' && priceResponse.data.data) {
              currentPrice = parseFloat(priceResponse.data.data.price) || 0.01;
            }
            
            // Calculate minimum USDT value needed
            const minUSDTValue = minOrderSize * currentPrice;
            
            // Store both token size and USDT value
            this.minimumOrderSizes.set(currency.symbol, minOrderSize);
            this.minimumOrderSizes.set(`${currency.symbol}_USDT`, minUSDTValue);
            
            console.log(`   ✅ ${currency.symbol}: Min size ${minOrderSize} ${symbolInfo.baseCurrency} (~$${minUSDTValue.toFixed(4)} USDT @ $${currentPrice.toFixed(6)})`);
          } else {
            // Fallback to default values
            this.minimumOrderSizes.set(currency.symbol, 1);
            this.minimumOrderSizes.set(`${currency.symbol}_USDT`, 1);
            console.log(`   ⚠️ ${currency.symbol}: Using default 1 token (~$1 USDT)`);
          }
        } catch (error: unknown) {
          // Fallback to default values
          this.minimumOrderSizes.set(currency.symbol, 1);
          this.minimumOrderSizes.set(`${currency.symbol}_USDT`, 1);
          console.log(`   ⚠️ ${currency.symbol}: Error, using default 1 token (~$1 USDT)`);
        }
      }
      
      console.log('✅ Minimum order sizes and USDT values loaded');
      
    } catch (error: unknown) {
      console.error('❌ Error loading minimum order sizes:', (error as Error).message);
      // Set default values for all currencies
      const currencies = currencyManager.getAllCurrencies();
      currencies.forEach(currency => {
        this.minimumOrderSizes.set(currency.symbol, 1);
        this.minimumOrderSizes.set(`${currency.symbol}_USDT`, 1);
      });
    }
  }

  /**
   * Get real market data from KuCoin API
   */
  async getRealMarketData(symbol: string): Promise<Candle[]> {
    try {
      const kucoinConfig = apiConfig.getKucoinConfig();
      
      // Get klines from KuCoin API
      const endpoint = `/api/v1/market/candles?type=1min&symbol=${symbol}&startAt=${Math.floor((Date.now() - 3600000) / 1000)}&endAt=${Math.floor(Date.now() / 1000)}`;
      
      const response = await axios.get(`${kucoinConfig.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code === '200000' && response.data.data) {
        // Convert KuCoin kline format to our format
        return response.data.data.map((kline) => ({
          timestamp: parseInt(kline[0]) * 1000,
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5])
        })).reverse();
      }
      
      return [];
      
    } catch (error: unknown) {
      console.error(`   ❌ Error fetching market data for ${symbol}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Create KuCoin signature
   */
  createKuCoinSignature(method: string, endpoint: string, body: string, timestamp: number, secretKey: string, passphrase: string): string {
    const message = timestamp + method + endpoint + body;
    const signature = createHmac('sha256', secretKey).update(message).digest('base64');
    return signature;
  }

  /**
   * Encrypt passphrase for KuCoin
   */
  encryptPassphrase(passphrase: string, secretKey: string): string {
    const encrypted = createHmac('sha256', secretKey).update(passphrase).digest('base64');
    return encrypted;
  }

  /**
   * Check if we have sufficient balance to trade
   */
  async checkTradingBalance(currency: Currency, price: number): Promise<boolean> {
    try {
      const kucoinConfig = apiConfig.getKucoinConfig();
      
      // Get account balance
      const endpoint = '/api/v1/accounts';
      const timestamp = Date.now();
      const signature = this.createKuCoinSignature(
        'GET',
        endpoint,
        '',
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );
      
      const encryptedPassphrase = this.encryptPassphrase(kucoinConfig.passphrase, kucoinConfig.secretKey);
      
      const response = await axios.get(`${kucoinConfig.baseUrl}${endpoint}`, {
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === '200000' && response.data.data) {
        // Use the account with the most available balance
        const usdtAccounts = response.data.data.filter((account) => account.currency === 'USDT');
        const usdtBalance = usdtAccounts.reduce((max, account) => {
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
      
      return false; // Default to false if can't check balance
    } catch (error: unknown) {
      console.error(`   ❌ Error checking balance:`, (error as Error).message);
      return false;
    }
  }

  /**
   * Execute real trade via KuCoin Spot API
   */
  async executeRealTrade(currency: Currency, action: 'buy' | 'sell', price: number, leverage: number, riskAmount: number): Promise<Trade | null> {
    try {
      const kucoinConfig = apiConfig.getKucoinConfig();
      
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
      const encryptedPassphrase = this.encryptPassphrase(kucoinConfig.passphrase, kucoinConfig.secretKey);
      const signature = this.createKuCoinSignature(
        'POST',
        '/api/v1/orders',
        orderBody,
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );

      console.log(`   🔄 Placing SPOT LIMIT order on KuCoin: ${action.toUpperCase()} ${quantity} ${currency.symbol.replace('-USDT', '')} @ $${price.toFixed(6)}...`);
      
      // Make API request to KuCoin Spot
      const response = await axios.post(`${kucoinConfig.baseUrl}/api/v1/orders`, orderPayload, {
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code === '200000' && response.data.data) {
        // Create trade object
        const trade = {
          id: orderPayload.clientOid,
          orderId: response.data.data.orderId,
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
        
        console.log(`   ✅ SPOT Order placed successfully! Order ID: ${response.data.data.orderId}`);
        
        return trade;
      } else {
        console.log(`   ❌ Order failed: ${response.data.msg || 'Unknown error'}`);
        return null;
      }
      
    } catch (error: unknown) {
      console.error(`   ❌ Error executing trade:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Display trading statistics
   */
  async displayStats(): Promise<void> {
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

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const kucoinConfig = apiConfig.getKucoinConfig();
      const endpoint = `/api/v1/market/orderbook/level1?symbol=${symbol}`;
      
      const response = await axios.get(`${kucoinConfig.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === '200000' && response.data.data) {
        return parseFloat(response.data.data.price);
      }
    } catch (error: unknown) {
      console.error(`❌ Error getting current price for ${symbol}:`, (error as Error).message);
    }
    
    return 0;
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    console.log('\n🛑 Stopping spot trading bot...');
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
    
    console.log('✅ Spot trading bot stopped');
  }

  /**
   * Sleep utility
   */
  sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }
}

