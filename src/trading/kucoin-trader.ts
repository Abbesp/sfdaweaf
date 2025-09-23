import { APIConfigManager } from '../config/api-config';
import { BaseStrategy } from '../types/types';

/**
 * KuCoin Trading Engine
 * Handles real-time trading with KuCoin API integration
 */

export interface KuCoinTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  timestamp: number;
  strategy: string;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  orderId?: string;
  leverage?: number;
  marginMode?: 'isolated' | 'cross';
  positionSide?: 'long' | 'short';
}

export class KuCoinTrader {
  private apiConfig: APIConfigManager;
  private activeTrades: Map<string, KuCoinTrade> = new Map();
  private dailyStats = {
    trades: 0,
    pnl: 0,
    startTime: Date.now()
  };

  constructor() {
    this.apiConfig = APIConfigManager.getInstance();
    
    // Validate API configuration
    if (!this.apiConfig.validateConfig()) {
      throw new Error('Invalid API configuration');
    }
  }

  /**
   * Execute a futures trade via KuCoin API
   */
  async executeTrade(
    symbol: string,
    strategy: BaseStrategy,
    side: 'buy' | 'sell',
    size: number,
    price?: number,
    leverage?: number
  ): Promise<KuCoinTrade | null> {
    
    try {
      const trade: KuCoinTrade = {
        id: this.generateTradeId(),
        symbol,
        side,
        size,
        price: price || 0,
        timestamp: Date.now(),
        strategy: strategy.id,
        status: 'pending',
        leverage: leverage || 1,
        marginMode: 'isolated',
        positionSide: side === 'buy' ? 'long' : 'short'
      };

      // Set leverage first
      await this.setLeverage(symbol, trade.leverage);

      // Execute the futures trade via KuCoin API
      const orderResult = await this.placeFuturesOrder(trade);
      
      if (orderResult) {
        trade.orderId = orderResult.orderId;
        trade.status = 'filled';
        this.activeTrades.set(trade.id, trade);
        this.dailyStats.trades++;
        
        console.log(`✅ KuCoin futures trade executed: ${side} ${size} ${symbol} at ${price} with ${leverage}x leverage`);
        return trade;
      } else {
        trade.status = 'rejected';
        console.log(`❌ KuCoin futures trade rejected: ${side} ${size} ${symbol}`);
        return null;
      }

    } catch (error) {
      console.error('❌ Error executing KuCoin futures trade:', error);
      return null;
    }
  }

  /**
   * Set leverage for futures trading
   */
  private async setLeverage(symbol: string, leverage: number): Promise<boolean> {
    const kucoinConfig = this.apiConfig.getKucoinConfig();
    
    try {
      const timestamp = Date.now();
      const method = 'POST';
      const endpoint = '/api/v1/position/risk-limit-level/change';
      const body = JSON.stringify({
        symbol: symbol,
        level: leverage.toString()
      });
      
      const signature = await this.createKuCoinSignature(
        method,
        endpoint,
        body,
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );

      const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': kucoinConfig.passphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        },
        body: body
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error setting leverage:', error);
      return false;
    }
  }

  /**
   * Place futures order via KuCoin API
   */
  private async placeFuturesOrder(trade: KuCoinTrade): Promise<{ orderId: string } | null> {
    const kucoinConfig = this.apiConfig.getKucoinConfig();
    
    try {
      // Create futures order payload
      const orderPayload = {
        clientOid: trade.id,
        side: trade.side,
        symbol: trade.symbol,
        type: 'market', // Market order for immediate execution
        size: trade.size.toString(),
        leverage: trade.leverage?.toString() || '1',
        marginMode: trade.marginMode || 'isolated'
      };

      // Create KuCoin signature
      const timestamp = Date.now();
      const method = 'POST';
      const endpoint = '/api/v1/orders'; // KuCoin futures orders endpoint
      const body = JSON.stringify(orderPayload);
      
      const signature = await this.createKuCoinSignature(
        method,
        endpoint,
        body,
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );

      // Make API request
      const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': kucoinConfig.passphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        },
        body: body
      });

      if (response.ok) {
        const result = await response.json();
        return { orderId: result.data.orderId };
      } else {
        console.error('❌ KuCoin futures order failed:', await response.text());
        return null;
      }

    } catch (error) {
      console.error('❌ KuCoin futures API Error:', error);
      return null;
    }
  }

  /**
   * Create KuCoin HMAC SHA256 signature
   */
  private async createKuCoinSignature(
    method: string,
    endpoint: string,
    body: string,
    timestamp: number,
    secret: string,
    passphrase: string
  ): Promise<string> {
    const strForSign = timestamp + method + endpoint + body;
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(strForSign);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hashArray = Array.from(new Uint8Array(signature));
    return btoa(hashArray.map(b => String.fromCharCode(b)).join(''));
  }

  /**
   * Get current account balance from KuCoin
   */
  async getAccountBalance(): Promise<{ [asset: string]: number }> {
    const kucoinConfig = this.apiConfig.getKucoinConfig();
    
    try {
      const timestamp = Date.now();
      const method = 'GET';
      const endpoint = '/api/v1/accounts';
      const body = '';
      
      const signature = await this.createKuCoinSignature(
        method,
        endpoint,
        body,
        timestamp,
        kucoinConfig.secretKey,
        kucoinConfig.passphrase
      );
      
      const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'KC-API-KEY': kucoinConfig.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp.toString(),
          'KC-API-PASSPHRASE': kucoinConfig.passphrase,
          'KC-API-KEY-VERSION': '2'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const balances: { [asset: string]: number } = {};
        
        result.data.forEach((account: any) => {
          if (parseFloat(account.available) > 0) {
            balances[account.currency] = parseFloat(account.available);
          }
        });
        
        return balances;
      } else {
        console.error('❌ Failed to get KuCoin account balance');
        return {};
      }
    } catch (error) {
      console.error('❌ Error getting KuCoin account balance:', error);
      return {};
    }
  }

  /**
   * Get current market price from KuCoin
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    const kucoinConfig = this.apiConfig.getKucoinConfig();
    
    try {
      const response = await fetch(`${kucoinConfig.baseUrl}/api/v1/market/orderbook/level1?symbol=${symbol}`);
      
      if (response.ok) {
        const data = await response.json();
        return parseFloat(data.data.price);
      } else {
        console.error('❌ Failed to get KuCoin current price');
        return 0;
      }
    } catch (error) {
      console.error('❌ Error getting KuCoin current price:', error);
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
      exchange: 'KuCoin'
    };
  }

  /**
   * Generate unique trade ID
   */
  private generateTradeId(): string {
    return `kucoin_trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close all active trades
   */
  async closeAllTrades(): Promise<void> {
    console.log('🔄 Closing all KuCoin trades...');
    
    for (const [tradeId, trade] of this.activeTrades) {
      try {
        // Implement close trade logic here
        console.log(`Closing KuCoin trade: ${tradeId}`);
        this.activeTrades.delete(tradeId);
      } catch (error) {
        console.error(`❌ Error closing KuCoin trade ${tradeId}:`, error);
      }
    }
  }
}
