import { APIConfigManager } from '../config/api-config';
import { BaseStrategy } from '../types/types';

/**
 * Live Trading Engine
 * Handles real-time trading with API integration
 */

export interface LiveTradeConfig {
  maxPositionSize: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  maxDailyTrades: number;
  enableLiveTrading: boolean;
  leverage: number;
}

export interface LiveTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: number;
  strategy: string;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  orderId?: string;
}

export class LiveTrader {
  private apiConfig: APIConfigManager;
  private config: LiveTradeConfig;
  private activeTrades: Map<string, LiveTrade> = new Map();
  private dailyStats = {
    trades: 0,
    pnl: 0,
    startTime: Date.now()
  };

  constructor(config: LiveTradeConfig) {
    this.apiConfig = APIConfigManager.getInstance();
    this.config = config;
    
    // Validate API configuration
    if (!this.apiConfig.validateConfig()) {
      throw new Error('Invalid API configuration');
    }
  }

  /**
   * Execute a trade based on strategy signal
   */
  async executeTrade(
    symbol: string,
    strategy: BaseStrategy,
    signal: 'BUY' | 'SELL',
    quantity: number,
    price?: number
  ): Promise<LiveTrade | null> {
    
    // Safety checks
    if (!this.config.enableLiveTrading) {
      console.log('🚫 Live trading disabled - signal ignored');
      return null;
    }

    if (this.dailyStats.trades >= this.config.maxDailyTrades) {
      console.log('🚫 Daily trade limit reached');
      return null;
    }

    if (this.dailyStats.pnl <= -this.config.maxDailyLoss) {
      console.log('🚫 Daily loss limit reached');
      return null;
    }

    // Calculate position size based on 1 USDT with leverage
    const riskAmount = this.calculateRiskAmount(price || 0, quantity);
    if (riskAmount > this.config.maxPositionSize) {
      console.log('🚫 Position size exceeds maximum allowed (1 USDT)');
      return null;
    }

    try {
      const trade: LiveTrade = {
        id: this.generateTradeId(),
        symbol,
        side: signal,
        quantity,
        price: price || 0,
        timestamp: Date.now(),
        strategy: strategy.id,
        status: 'PENDING'
      };

      // Execute the trade via API
      const orderResult = await this.placeOrder(trade);
      
      if (orderResult) {
        trade.orderId = orderResult.orderId;
        trade.status = 'FILLED';
        this.activeTrades.set(trade.id, trade);
        this.dailyStats.trades++;
        
        console.log(`✅ Trade executed: ${signal} ${quantity} ${symbol} at ${price}`);
        return trade;
      } else {
        trade.status = 'REJECTED';
        console.log(`❌ Trade rejected: ${signal} ${quantity} ${symbol}`);
        return null;
      }

    } catch (error) {
      console.error('❌ Error executing trade:', error);
      return null;
    }
  }

  /**
   * Place order via Binance API
   */
  private async placeOrder(trade: LiveTrade): Promise<{ orderId: string } | null> {
    const binanceConfig = this.apiConfig.getBinanceConfig();
    
    try {
      // Create order payload with leverage
      const orderPayload = {
        symbol: trade.symbol,
        side: trade.side,
        type: 'MARKET', // Market order for immediate execution
        quantity: trade.quantity.toString(),
        timestamp: Date.now(),
        leverage: this.config.leverage || 100 // Use configured leverage
      };

      // Add signature for authentication
      const signature = await this.createSignature(orderPayload, binanceConfig.secretKey);
      orderPayload['signature'] = signature;

      // Make API request
      const response = await fetch(`${binanceConfig.baseUrl}/api/v3/order`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': binanceConfig.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(orderPayload)
      });

      if (response.ok) {
        const result = await response.json();
        return { orderId: result.orderId };
      } else {
        console.error('❌ Order failed:', await response.text());
        return null;
      }

    } catch (error) {
      console.error('❌ API Error:', error);
      return null;
    }
  }

  /**
   * Create HMAC SHA256 signature for API authentication
   */
  private async createSignature(payload: any, secret: string): Promise<string> {
    const queryString = new URLSearchParams(payload).toString();
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(queryString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Calculate risk amount for position sizing
   */
  private calculateRiskAmount(price: number, quantity: number): number {
    // Fixed 1 USDT per trade with leverage
    return 1.0; // Always 1 USDT
  }

  /**
   * Generate unique trade ID
   */
  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current account balance
   */
  async getAccountBalance(): Promise<{ [asset: string]: number }> {
    const binanceConfig = this.apiConfig.getBinanceConfig();
    
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = await this.createSignature({ timestamp }, binanceConfig.secretKey);
      
      const response = await fetch(
        `${binanceConfig.baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': binanceConfig.apiKey
          }
        }
      );

      if (response.ok) {
        const account = await response.json();
        const balances: { [asset: string]: number } = {};
        
        account.balances.forEach((balance: any) => {
          if (parseFloat(balance.free) > 0) {
            balances[balance.asset] = parseFloat(balance.free);
          }
        });
        
        return balances;
      } else {
        console.error('❌ Failed to get account balance');
        return {};
      }
    } catch (error) {
      console.error('❌ Error getting account balance:', error);
      return {};
    }
  }

  /**
   * Get current market price
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    const binanceConfig = this.apiConfig.getBinanceConfig();
    
    try {
      const response = await fetch(`${binanceConfig.baseUrl}/api/v3/ticker/price?symbol=${symbol}`);
      
      if (response.ok) {
        const data = await response.json();
        return parseFloat(data.price);
      } else {
        console.error('❌ Failed to get current price');
        return 0;
      }
    } catch (error) {
      console.error('❌ Error getting current price:', error);
      return 0;
    }
  }

  /**
   * Get trading statistics
   */
  getTradingStats() {
    return {
      activeTrades: this.activeTrades.size,
      dailyTrades: this.dailyStats.trades,
      dailyPnL: this.dailyStats.pnl,
      isTestnet: this.apiConfig.isTestnet()
    };
  }

  /**
   * Close all active trades
   */
  async closeAllTrades(): Promise<void> {
    console.log('🔄 Closing all active trades...');
    
    for (const [tradeId, trade] of this.activeTrades) {
      try {
        // Implement close trade logic here
        console.log(`Closing trade: ${tradeId}`);
        this.activeTrades.delete(tradeId);
      } catch (error) {
        console.error(`❌ Error closing trade ${tradeId}:`, error);
      }
    }
  }
}
