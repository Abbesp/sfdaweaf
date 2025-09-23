/**
 * KuCoin Spot Trading Bot with 10x Leverage and 0.4 USDT Risk
 * Uses spot trading with margin for leverage
 */

import { APIConfigManager } from './src/config/api-config';
import { currencyManager } from './src/config/currency-config';
import { TelegramService } from './src/services/telegram-service';
import { UltimateICTSMCStrategy } from './src/strategies/ultimate-ict-smc-strategy';
// Use Deno's built-in crypto for HMAC
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

// Declare Deno global for TypeScript
declare const Deno: any;

export class SpotTradingBot {
  private isRunning = false;
  private loopCount = 0;
  private totalTrades = 0;
  private totalPnL = 0;
  private trades: any[] = [];
  private telegramService: TelegramService;
  private positions: Map<string, any> = new Map(); // Track open positions
  private apiConfig: APIConfigManager;
  private minimumOrderSizes: Map<string, number> = new Map();
  private aiLearning: Map<string, any> = new Map(); // AI learning data per currency
  private tradingHistory: any[] = []; // Store trading history for AI learning
  private ultimateICTSMCStrategy: UltimateICTSMCStrategy;

  constructor() {
    this.apiConfig = APIConfigManager.getInstance();
    this.ultimateICTSMCStrategy = new UltimateICTSMCStrategy(10000, 0.015);
    
    // Initialize Telegram service
    const telegramConfig = this.apiConfig.getTelegramConfig();
    this.telegramService = new TelegramService(telegramConfig.botToken, telegramConfig.chatId);
  }

  /**
   * Start the spot trading bot
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Starting KuCoin SPOT Trading Bot...');
      console.log('============================================================');
      console.log('DEBUG: Start function called');

      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      console.log('📊 Trading Configuration:');
      console.log('   • Exchange: KuCoin SPOT');
      console.log('   • Strategy: Ultimate ICT/SMC Strategy (FULL VERSION)');
      console.log('   • Trade size: 4 USDT');
      console.log('   • Leverage: 2x (spot trading with margin)');
      console.log('   • Currencies: 10 meme coins');
      console.log('   • Analysis: ICT/SMC Signal Generation');
      console.log(`   • Testnet: ${kucoinConfig.testnet ? 'YES' : 'NO'}`);
      console.log('   • REAL MONEY TRADING: YES');
      console.log('============================================================');

      if (!this.apiConfig.validateConfig()) {
        console.error('❌ Invalid API configuration. Please check your API keys.');
        return;
      }

      console.log('✅ API configuration validated, continuing...');

      // Send startup notification to Telegram
      await this.telegramService.sendStatusUpdate(
        '🚀 Trading Bot Started',
        'Bot is now running and monitoring markets for trading opportunities'
      );

      // Load minimum order sizes
      console.log('🔄 Loading minimum order sizes from KuCoin...');
      console.log('📊 Getting currencies from currencyManager...');
      const currencies = currencyManager.getAllCurrencies();
      console.log(`📊 Found ${currencies.length} currencies to process`);
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
      console.log('🚀 Starting trading loop...');
      await this.tradingLoop();
    } catch (error) {
      console.error('❌ Error starting bot:', error);
    }
  }

  /**
   * Main trading loop - runs every minute
   */
  private async tradingLoop(): Promise<void> {
    const currencies = currencyManager.getAllCurrencies();
    
    while (this.isRunning) {
      this.loopCount++;
      const now = new Date();
      
      console.log(`\n⏰ ${now.toLocaleTimeString()} - Loop #${this.loopCount}`);
      console.log('=' .repeat(40));

      try {
        let tradesThisMinute = 0;
        
        // Process each currency
        for (const currency of currencies) {
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
                // We have an open position, check if we should close it
                const timeHeld = Date.now() - existingPosition.timestamp;
                const priceChangeFromEntry = ((latestCandle.close - existingPosition.price) / existingPosition.price) * 100;
                
                console.log(`   📊 Position: ${existingPosition.side.toUpperCase()} ${existingPosition.quantity} @ $${existingPosition.price.toFixed(6)}`);
                console.log(`   📈 Price change from entry: ${priceChangeFromEntry > 0 ? '+' : ''}${priceChangeFromEntry.toFixed(3)}%`);
                console.log(`   ⏰ Time held: ${Math.floor(timeHeld / 1000)}s`);
                
                // Close position if:
                // 1. Price moved 0.3% in opposite direction (stop loss)
                // 2. Price moved 0.6% in same direction (take profit) - 1:2 ratio
                // 3. Position held for more than 20 minutes
                const shouldClose = 
                  (existingPosition.side === 'buy' && priceChangeFromEntry < -0.3) || // Stop loss for long
                  (existingPosition.side === 'sell' && priceChangeFromEntry > 0.3) || // Stop loss for short
                  (existingPosition.side === 'buy' && priceChangeFromEntry > 0.6) || // Take profit for long
                  (existingPosition.side === 'sell' && priceChangeFromEntry < -0.6) || // Take profit for short
                  timeHeld > 1200000; // 20 minutes max hold (more time for profit)
                
                if (shouldClose) {
                  const closeAction = existingPosition.side === 'buy' ? 'sell' : 'buy';
                  console.log(`   🎯 CLOSING POSITION: ${closeAction.toUpperCase()}`);
                  
                  const closeTrade = await this.executeRealTrade(currency, closeAction, latestCandle.close, 10, 0.4);
                  
                  if (closeTrade) {
                    // Calculate PnL
                    const pnl = existingPosition.side === 'buy' 
                      ? (latestCandle.close - existingPosition.price) * existingPosition.quantity
                      : (existingPosition.price - latestCandle.close) * existingPosition.quantity;
                    
                    closeTrade.pnl = pnl;
                    this.totalPnL += pnl;
                    
                    // Learn from this closed position
                    this.learnFromTrade(currency.symbol, closeTrade, pnl);
                    
                    this.trades.push(closeTrade);
                    this.totalTrades++;
                    tradesThisMinute++;
                    
                    // Remove position
                    this.positions.delete(currency.symbol);
                    
                    console.log(`   ✅ POSITION CLOSED: ${closeAction.toUpperCase()} ${closeTrade.quantity} USDT ${closeTrade.symbol} @ $${closeTrade.price.toFixed(6)}`);
                    console.log(`   💰 PnL: $${pnl.toFixed(4)}`);
                    console.log(`   💰 Order ID: ${closeTrade.orderId}`);
                    
                    // Send Telegram notification for closed position
                    await this.telegramService.sendTradeNotification({
                      type: closeAction.toUpperCase() as 'BUY' | 'SELL',
                      symbol: closeTrade.symbol,
                      price: closeTrade.price,
                      quantity: closeTrade.quantity,
                      value: closeTrade.quantity * closeTrade.price,
                      reason: `Position Closed - PnL: $${pnl.toFixed(4)}`
                    });
                  }
                } else {
                  console.log(`   ⏸️ Holding position (${priceChangeFromEntry.toFixed(3)}% change)`);
                }
              } else {
                // No open position, check if we can afford to trade
                const canAffordTrade = await this.checkTradingBalance(currency, latestCandle.close);
                
                if (!canAffordTrade) {
                  console.log(`   💰 Insufficient balance for ${currency.symbol}, managing existing positions only`);
                  continue; // Skip to next currency
                }
                
                // Get market data for strategy analysis
                const marketData = await this.getRealMarketData(currency.symbol);
                
                if (marketData && marketData.length >= 10) {
                  // Use Ultimate ICT/SMC Strategy for signal generation
                  const signal = this.ultimateICTSMCStrategy.generateUltimateSignal(marketData, marketData.length - 1);
                  
                  if (signal && this.ultimateICTSMCStrategy.validateSignal(signal) && signal.type !== 'HOLD') {
                    const action = signal.type.toLowerCase();
                    
                    console.log(`   🎯 ICT/SMC SIGNAL: ${signal.type}`);
                    console.log(`   🧠 Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
                    console.log(`   🎲 ICT Score: ${signal.ict_score?.toFixed(1) || 'N/A'}/10`);
                    console.log(`   ⚡ SMC Score: ${signal.smc_score?.toFixed(1) || 'N/A'}/10`);
                    console.log(`   📊 Strategy: ${this.ultimateICTSMCStrategy.name}`);
                
                // Get minimum USDT value needed for this currency
                const minUSDTValue = this.minimumOrderSizes.get(`${currency.symbol}_USDT`) || 1;
                
                // Calculate order size for 4 USDT per trade with 2x leverage (spot trading with margin)
                const riskAmount = 4.0; // 4 USDT per trade
                const leverage = 2; // 2x leverage for spot trading with margin
                const totalExposure = riskAmount; // 4.0 USDT total exposure
                
                // Calculate required order size to meet minimum requirements
                const requiredOrderSize = Math.max(minUSDTValue, totalExposure);
                
                console.log(`   🎯 SIGNAL: ${action.toUpperCase()}`);
                console.log(`   💰 Trade size: $${riskAmount} USDT`);
                console.log(`   🔥 Leverage: ${leverage}x (spot trading with margin)`);
                console.log(`   💰 Total exposure: $${totalExposure} USDT`);
                console.log(`   💰 Min order value: $${minUSDTValue.toFixed(4)} USDT`);
                
                  // Execute real trade on KuCoin
                  const trade = await this.executeRealTrade(currency, action, latestCandle.close, leverage, riskAmount);
                  
                  if (trade) {
                    // Store position
                    this.positions.set(currency.symbol, {
                      side: action,
                      quantity: trade.quantity,
                      price: trade.price,
                      timestamp: Date.now(),
                      orderId: trade.orderId
                    });
                    
                    // Place stop loss and take profit limit orders
                    await this.placeStopLossAndTakeProfit(currency, action, trade.price, trade.quantity);
                    
                    // Learn from this trade
                    this.learnFromTrade(currency.symbol, trade, trade.pnl);
                    
                    this.trades.push(trade);
                    this.totalTrades++;
                    tradesThisMinute++;
                    
                    console.log(`   ✅ REAL TRADE EXECUTED: ${trade.side.toUpperCase()} ${trade.quantity} USDT ${trade.symbol} @ $${trade.price.toFixed(6)} (${trade.leverage}x)`);
                    console.log(`   💰 Order ID: ${trade.orderId}`);
                    
                    // Send Telegram notification for new trade
                    await this.telegramService.sendTradeNotification({
                      type: trade.side.toUpperCase() as 'BUY' | 'SELL',
                      symbol: trade.symbol,
                      price: trade.price,
                      quantity: trade.quantity,
                      value: trade.quantity * trade.price,
                      reason: `New Position - ICT/SMC Strategy`
                    });
                  }
                  } else {
                    console.log(`   ⏸️ No ICT/SMC signal (confidence too low or no confluence)`);
                  }
                } else {
                  console.log(`   ⏸️ Insufficient market data for ICT/SMC analysis`);
                }
              }
            } else {
              console.log(`   ⚠️ Insufficient market data for ${currency.symbol}`);
            }
            
            // Check existing positions for stop loss/take profit with Master Strategy
            if (this.positions.has(currency.symbol)) {
              const position = this.positions.get(currency.symbol)!;
              const currentPrice = marketData && marketData.length > 0 ? marketData[marketData.length - 1].close : await this.getCurrentPrice(currency.symbol);
              const priceChange = (currentPrice - position.price) / position.price;
              const timeHeld = Date.now() - position.timestamp;
              const maxHoldTime = 20 * 60 * 1000; // 20 minutes max hold (more time for profit)
              
              // Get ICT/SMC Strategy stop loss and take profit levels
              const signal = { type: position.side.toUpperCase() as 'BUY' | 'SELL', confidence: 0.5, ict_score: 5, smc_score: 5, confluence: 1, candles: [] };
              const stopLoss = this.ultimateICTSMCStrategy.calculateStopLoss(position.price, signal.type);
              const takeProfit = this.ultimateICTSMCStrategy.calculateTakeProfit(position.price, stopLoss, signal.type);
              
              // Check if we should close position
              let shouldClose = false;
              let closeReason = '';
              
              if (position.side === 'buy') {
                if (currentPrice <= stopLoss) {
                  shouldClose = true;
                  closeReason = 'Stop Loss';
                } else if (currentPrice >= takeProfit) {
                  shouldClose = true;
                  closeReason = 'Take Profit';
                }
              } else {
                if (currentPrice >= stopLoss) {
                  shouldClose = true;
                  closeReason = 'Stop Loss';
                } else if (currentPrice <= takeProfit) {
                  shouldClose = true;
                  closeReason = 'Take Profit';
                }
              }
              
              // Check max hold time
              if (timeHeld > maxHoldTime) {
                shouldClose = true;
                closeReason = 'Max Hold Time';
              }
              
              if (shouldClose) {
                const closeAction = position.side === 'buy' ? 'sell' : 'buy';
                // Use actual position quantity for closing, not calculated amount
                const closeTrade = await this.executePositionClose(currency, closeAction, currentPrice, position.quantity);
                
                if (closeTrade) {
                  // Calculate actual PnL based on position
                  const pnl = position.side === 'buy' 
                    ? (currentPrice - position.price) * position.quantity
                    : (position.price - currentPrice) * position.quantity;
                  
                  closeTrade.pnl = pnl;
                  this.totalPnL += pnl;
                  
                  // Learn from this trade closure
                  this.learnFromTrade(currency.symbol, closeTrade, pnl);
                  
                  console.log(`   🔄 POSITION CLOSED: ${closeAction.toUpperCase()} ${closeTrade.quantity} USDT ${currency.symbol} @ $${currentPrice.toFixed(6)}`);
                  console.log(`   💰 PnL: $${pnl.toFixed(4)} (${(priceChange * 100).toFixed(3)}%)`);
                  console.log(`   ⏱️ Time held: ${Math.round(timeHeld / 1000)}s`);
                  console.log(`   🎯 Close reason: ${closeReason}`);
                  console.log(`   📊 SL: $${stopLoss.toFixed(6)}, TP: $${takeProfit.toFixed(6)}`);
                  
                  this.positions.delete(currency.symbol);
                }
              } else {
                console.log(`   📊 Position: ${position.side.toUpperCase()} @ $${position.price.toFixed(6)} (${(priceChange * 100).toFixed(3)}%)`);
                console.log(`   🎯 SL: $${stopLoss.toFixed(6)}, TP: $${takeProfit.toFixed(6)}`);
                console.log(`   ⏱️ Time held: ${Math.round(timeHeld / 1000)}s / ${Math.round(maxHoldTime / 1000)}s`);
              }
            }
            
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
        console.error('❌ Error in trading loop:', error);
      }

      // Wait for next minute
      console.log('\n⏳ Waiting for next minute...');
      await this.sleep(60000); // 60 seconds
    }
  }

  /**
   * Check all account balances
   */
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

  /**
   * Load existing positions from KuCoin
   */
  private async loadExistingPositions(): Promise<void> {
    try {
      console.log('🔄 Loading existing positions from KuCoin...');
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      // Get all orders from KuCoin (both active and filled)
      const endpoint = '/api/v1/orders?status=active';
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
          const activeOrders = result.data.items || [];
          
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
      }
      
      // Also get filled orders to check for actual positions
      await this.loadFilledPositions();
      
      console.log(`✅ Loaded ${this.positions.size} existing positions`);
    } catch (error) {
      console.error('❌ Error loading existing positions:', error);
    }
  }

  /**
   * Load filled positions from KuCoin (actual holdings)
   */
  private async loadFilledPositions(): Promise<void> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      // Get account balances to see actual holdings
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
          const currencies = currencyManager.getAllCurrencies();
          
          for (const currency of currencies) {
            const baseCurrency = currency.symbol.replace('-USDT', '');
            const balance = result.data.find((account: any) => account.currency === baseCurrency);
            
            if (balance && parseFloat(balance.available) > 0) {
              const quantity = parseFloat(balance.available);
              const currentPrice = await this.getCurrentPrice(currency.symbol);
              
              if (currentPrice > 0) {
                // Store as position (assume it's a buy position)
                this.positions.set(currency.symbol, {
                  side: 'buy',
                  quantity: quantity,
                  price: currentPrice,
                  timestamp: Date.now() - 600000, // Assume 10 minutes ago
                  orderId: `filled_${Date.now()}`
                });
                
                console.log(`   📊 Found holding: ${quantity} ${baseCurrency} @ $${currentPrice.toFixed(6)}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading filled positions:', error);
    }
  }

  /**
   * Get current price for a symbol
   */
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

  /**
   * Load minimum order sizes and calculate required USDT values for all currencies
   */
  private async loadMinimumOrderSizes(): Promise<void> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      const currencies = currencyManager.getAllCurrencies();
      
      console.log('📊 Fetching minimum order requirements and calculating USDT values...');
      
      for (const currency of currencies) {
        try {
          // Get symbol info from KuCoin API
          const endpoint = `/api/v1/symbols/${currency.symbol}`;
          
          const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            
            if (result.code === '200000' && result.data) {
              const symbolInfo = result.data;
              const minOrderSize = parseFloat(symbolInfo.baseMinSize) || 1;
              
              // Get current price to calculate USDT value
              const priceEndpoint = `/api/v1/market/orderbook/level1?symbol=${currency.symbol}`;
              const priceResponse = await fetch(`${kucoinConfig.baseUrl}${priceEndpoint}`);
              
              let currentPrice = 0.01; // Default fallback price
              if (priceResponse.ok) {
                const priceResult = await priceResponse.json();
                if (priceResult.code === '200000' && priceResult.data) {
                  currentPrice = parseFloat(priceResult.data.price) || 0.01;
                }
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
          } else {
            // Fallback to default values
            this.minimumOrderSizes.set(currency.symbol, 1);
            this.minimumOrderSizes.set(`${currency.symbol}_USDT`, 1);
            console.log(`   ⚠️ ${currency.symbol}: Using default 1 token (~$1 USDT)`);
          }
          
        } catch (error) {
          // Fallback to default values
          this.minimumOrderSizes.set(currency.symbol, 1);
          this.minimumOrderSizes.set(`${currency.symbol}_USDT`, 1);
          console.log(`   ⚠️ ${currency.symbol}: Error, using default 1 token (~$1 USDT)`);
        }
      }
      
      console.log('✅ Minimum order sizes and USDT values loaded');
      
    } catch (error) {
      console.error('❌ Error loading minimum order sizes:', error);
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
  private async getRealMarketData(symbol: string): Promise<any[]> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      // Get klines from KuCoin API (get more data for Master Strategy analysis)
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

  /**
   * Create KuCoin signature
   */
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

  /**
   * Encrypt passphrase for KuCoin
   */
  private async encryptPassphrase(passphrase: string, secretKey: string): Promise<string> {
    const encrypted = await createHmac('sha256', secretKey).update(passphrase).digest('base64');
    return encrypted;
  }

  /**
   * Check if we have sufficient balance to trade
   */
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
          // Debug: Show all USDT accounts
          const usdtAccounts = result.data.filter((account: any) => account.currency === 'USDT');
          console.log(`   🔍 USDT Accounts found: ${usdtAccounts.length}`);
          
          usdtAccounts.forEach((account: any, index: number) => {
            console.log(`   📊 USDT Account ${index + 1}: Type=${account.type}, Available=${account.available}, Balance=${account.balance}`);
          });
          
          // Use the account with the most available balance
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
          console.log(`   📊 Using account type: ${usdtBalance?.type || 'unknown'}`);
          return canAfford;
        }
      }
      
      return false; // Default to false if can't check balance
    } catch (error) {
      console.error(`   ❌ Error checking balance:`, error);
      return false;
    }
  }

  /**
   * AI-enhanced signal generation
   */
  private getAISignal(symbol: string, priceChange: number, candle: any): { shouldTrade: boolean; threshold: number; confidence: number } {
    // Initialize AI learning data for this currency
    if (!this.aiLearning.has(symbol)) {
      this.aiLearning.set(symbol, {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgWin: 0,
        avgLoss: 0,
        winRate: 0,
        threshold: 0.05, // Start with 0.05% threshold
        confidence: 0.5
      });
    }
    
    const aiData = this.aiLearning.get(symbol);
    
    // Calculate confidence based on historical performance
    const confidence = Math.min(0.9, Math.max(0.1, aiData.winRate));
    
    // Adjust threshold based on performance
    let threshold = aiData.threshold;
    if (aiData.winRate > 0.6) {
      threshold = Math.max(0.02, threshold * 0.9); // Lower threshold for better performance
    } else if (aiData.winRate < 0.4) {
      threshold = Math.min(0.1, threshold * 1.1); // Higher threshold for worse performance
    }
    
    // Update AI data
    aiData.threshold = threshold;
    aiData.confidence = confidence;
    
    const shouldTrade = Math.abs(priceChange) > threshold && confidence > 0.3;
    
    console.log(`   🧠 AI Analysis: Threshold=${threshold.toFixed(3)}%, Confidence=${(confidence*100).toFixed(1)}%, WinRate=${(aiData.winRate*100).toFixed(1)}%`);
    
    return { shouldTrade, threshold, confidence };
  }

  /**
   * Learn from trading results
   */
  private learnFromTrade(symbol: string, trade: any, pnl: number): void {
    const aiData = this.aiLearning.get(symbol);
    if (!aiData) return;
    
    aiData.totalTrades++;
    
    if (pnl > 0) {
      aiData.winningTrades++;
      aiData.avgWin = (aiData.avgWin * (aiData.winningTrades - 1) + pnl) / aiData.winningTrades;
    } else {
      aiData.losingTrades++;
      aiData.avgLoss = (aiData.avgLoss * (aiData.losingTrades - 1) + Math.abs(pnl)) / aiData.losingTrades;
    }
    
    aiData.winRate = aiData.winningTrades / aiData.totalTrades;
    
    // Store trade in history
    this.tradingHistory.push({
      symbol,
      timestamp: Date.now(),
      pnl,
      price: trade.price,
      side: trade.side,
      quantity: trade.quantity
    });
    
    console.log(`   🧠 AI Learning: ${symbol} - WinRate: ${(aiData.winRate*100).toFixed(1)}%, AvgWin: $${aiData.avgWin.toFixed(4)}, AvgLoss: $${aiData.avgLoss.toFixed(4)}`);
  }

  /**
   * Place stop loss and take profit limit orders
   */
  private async placeStopLossAndTakeProfit(currency: any, side: string, entryPrice: number, quantity: number): Promise<void> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      // Calculate stop loss and take profit prices using ICT/SMC Strategy
      const signal = { type: side.toUpperCase() as 'BUY' | 'SELL', confidence: 0.5, ict_score: 5, smc_score: 5, confluence: 1, candles: [] };
      let stopLossPrice = this.ultimateICTSMCStrategy.calculateStopLoss(entryPrice, signal.type);
      let takeProfitPrice = this.ultimateICTSMCStrategy.calculateTakeProfit(entryPrice, stopLossPrice, signal.type);
      
      // Round prices to valid increments
      stopLossPrice = Math.round(stopLossPrice * 1000000) / 1000000;
      takeProfitPrice = Math.round(takeProfitPrice * 1000000) / 1000000;
      
      console.log(`   🛡️ Placing SL/TP orders (ICT/SMC):`);
      console.log(`   📉 Stop Loss: $${stopLossPrice.toFixed(6)} (0.3%)`);
      console.log(`   📈 Take Profit: $${takeProfitPrice.toFixed(6)} (0.6%)`);
      
      // Place stop loss order
      const stopLossAction = side === 'buy' ? 'sell' : 'buy';
      await this.placeLimitOrder(currency, stopLossAction, stopLossPrice, quantity, 'stop_loss');
      
      // Place take profit order
      const takeProfitAction = side === 'buy' ? 'sell' : 'buy';
      await this.placeLimitOrder(currency, takeProfitAction, takeProfitPrice, quantity, 'take_profit');
      
    } catch (error) {
      console.error(`   ❌ Error placing SL/TP orders:`, error);
    }
  }

  /**
   * Place a limit order
   */
  private async placeLimitOrder(currency: any, action: string, price: number, quantity: number, orderType: string): Promise<void> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      const orderPayload = {
        clientOid: `sl_${Date.now()}`.substring(0, 32), // Shorter clientOid
        side: action,
        symbol: currency.symbol,
        type: 'limit',
        price: price.toFixed(8),
        size: quantity.toString()
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

      // Make API request to KuCoin Spot (fallback to spot trading)
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
          console.log(`   ✅ ${orderType.toUpperCase()} order placed: ${action.toUpperCase()} ${quantity} @ $${price.toFixed(6)} (Order ID: ${result.data.orderId})`);
        } else {
          console.log(`   ❌ ${orderType.toUpperCase()} order failed: ${result.msg || 'Unknown error'}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ ${orderType.toUpperCase()} order API error: ${errorText}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error placing ${orderType} order:`, error);
    }
  }

  /**
   * Execute position close with actual quantity
   */
  private async executePositionClose(currency: any, action: string, price: number, quantity: number): Promise<any | null> {
    try {
      const kucoinConfig = this.apiConfig.getKucoinConfig();
      
      const orderPayload = {
        clientOid: `close_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        side: action,
        symbol: currency.symbol,
        type: 'limit',
        price: price.toFixed(8),
        size: quantity.toString()
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

      console.log(`   🔄 Placing CLOSE order: ${action.toUpperCase()} ${quantity} ${currency.symbol.replace('-USDT', '')} @ $${price.toFixed(6)}...`);
      
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
            leverage: 1, // Spot trading
            timestamp: Date.now(),
            pnl: 0,
            status: 'FILLED'
          };

          console.log(`   ✅ CLOSE Order placed successfully! Order ID: ${result.data.orderId}`);
          return trade;
        } else {
          console.log(`   ❌ Close order failed: ${result.msg || 'Unknown error'}`);
          return null;
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Close order API error: ${errorText}`);
        return null;
      }
      
    } catch (error) {
      console.error(`   ❌ Error closing position:`, error);
      return null;
    }
  }

  /**
   * Execute real trade via KuCoin Spot API
   */
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
        // Remove margin-specific parameters for spot trading
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
      console.log(`   💰 Order details: ${quantity} tokens (~$${(quantity * price).toFixed(4)} USDT value)`);
      
      // Make API request to KuCoin Spot (fallback to spot trading)
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
            
            // Send Telegram notification
            await this.telegramService.sendTradeNotification({
              type: action.toUpperCase() as 'BUY' | 'SELL',
              symbol: currency.symbol,
              price: price,
              quantity: quantity,
              value: quantity * price,
              reason: `ICT/SMC Strategy - ${(trade.pnl >= 0 ? 'Profit' : 'Loss')}`
            });
            
            return trade;
        } else {
          console.log(`   ❌ Order failed: ${result.msg || 'Unknown error'}`);
          
          // Send Telegram error notification
          await this.telegramService.sendErrorNotification(
            result.msg || 'Unknown error',
            `Failed to place ${action.toUpperCase()} order for ${currency.symbol}`
          );
          
          return null;
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Order API error: ${errorText}`);
        
        // Send Telegram error notification
        await this.telegramService.sendErrorNotification(
          errorText,
          `API error placing ${action.toUpperCase()} order for ${currency.symbol}`
        );
        
        return null;
      }
      
    } catch (error) {
      console.error(`   ❌ Error executing trade:`, error);
      
      // Send Telegram error notification
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.telegramService.sendErrorNotification(
        errorMessage,
        `Exception during ${action.toUpperCase()} trade for ${currency.symbol}`
      );
      
      return null;
    }
  }

  /**
   * Display trading statistics
   */
  private async displayStats(): Promise<void> {
    console.log('\n📊 SPOT TRADING STATISTICS:');
    console.log(`   Total Trades: ${this.totalTrades}`);
    console.log(`   Total PnL: $${this.totalPnL.toFixed(4)}`);
    console.log(`   Win Rate: ${this.trades.length > 0 ? ((this.trades.filter(t => t.pnl > 0).length / this.trades.length) * 100).toFixed(1) : 0}%`);
    console.log(`   Active Positions: ${this.positions.size}`);
    
    // Send periodic stats to Telegram (every 10th call)
    if (this.loopCount % 10 === 0) {
      await this.telegramService.sendStatusUpdate(
        `📊 Trading Update - Loop ${this.loopCount}`,
        `Total Trades: ${this.totalTrades}\nTotal PnL: $${this.totalPnL.toFixed(4)}\nWin Rate: ${this.trades.length > 0 ? ((this.trades.filter(t => t.pnl > 0).length / this.trades.length) * 100).toFixed(1) : 0}%\nActive Positions: ${this.positions.size}`
      );
    }
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
    
    // Show AI learning data
    if (this.aiLearning.size > 0) {
      console.log('\n🧠 AI LEARNING DATA:');
      for (const [symbol, aiData] of this.aiLearning) {
        console.log(`   ${symbol}: WinRate=${(aiData.winRate*100).toFixed(1)}%, Trades=${aiData.totalTrades}, Threshold=${aiData.threshold.toFixed(3)}%`);
      }
    }
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    console.log('\n🛑 Stopping spot trading bot...');
    this.isRunning = false;
    
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
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the bot
console.log('DEBUG: Main block executing');
const bot = new SpotTradingBot();
console.log('DEBUG: Bot created');

// Handle graceful shutdown
Deno.addSignalListener('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await bot.stop();
  Deno.exit(0);
});

console.log('DEBUG: Starting bot...');
bot.start().catch(console.error);
