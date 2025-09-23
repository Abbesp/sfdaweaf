/**
 * Trading Configuration
 * Centralized configuration for all trading parameters
 */

export interface TradingConfig {
  // Position sizing
  maxPositionSize: number;        // Maximum position size in USDT
  leverage: number;               // Maximum leverage multiplier
  
  // Risk management
  riskPerTrade: number;           // Risk amount per trade in USDT
  maxDailyLoss: number;           // Maximum daily loss in USDT
  maxDailyTrades: number;         // Maximum trades per day
  
  // Trading control
  enableLiveTrading: boolean;     // Enable/disable live trading
  enableLeverage: boolean;        // Enable/disable leverage
  
  // Safety limits
  minConfidence: number;          // Minimum confidence for trades
  maxDrawdown: number;            // Maximum drawdown percentage
}

export class TradingConfigManager {
  private static instance: TradingConfigManager;
  private config: TradingConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): TradingConfigManager {
    if (!TradingConfigManager.instance) {
      TradingConfigManager.instance = new TradingConfigManager();
    }
    return TradingConfigManager.instance;
  }

  private loadConfig(): TradingConfig {
    return {
      // Position sizing - 1 USDT per trade with 100x leverage
      maxPositionSize: 1.0,       // 1 USDT per trade
      leverage: 100,              // Max 100x leverage
      
      // Risk management
      riskPerTrade: 1.0,          // 1 USDT risk per trade
      maxDailyLoss: 50,           // Max 50 USDT daily loss
      maxDailyTrades: 100,        // Max 100 trades per day
      
      // Trading control
      enableLiveTrading: true,    // Enable live trading
      enableLeverage: true,       // Enable leverage
      
      // Safety limits
      minConfidence: 0.7,         // 70% minimum confidence
      maxDrawdown: 0.1            // 10% maximum drawdown
    };
  }

  public getConfig(): TradingConfig {
    return this.config;
  }

  /**
   * Calculate position size with leverage
   */
  public calculatePositionSize(price: number, confidence: number): number {
    const baseAmount = this.config.maxPositionSize; // 1 USDT
    const leverage = this.config.leverage; // 100x
    
    // Calculate leveraged amount
    const leveragedAmount = baseAmount * leverage;
    
    // Calculate quantity based on price
    const quantity = leveragedAmount / price;
    
    // Adjust based on confidence
    const confidenceMultiplier = Math.min(confidence, 1.0);
    
    return quantity * confidenceMultiplier;
  }

  /**
   * Calculate risk amount for a trade
   */
  public calculateRiskAmount(): number {
    return this.config.riskPerTrade; // Always 1 USDT
  }

  /**
   * Check if trade is within risk limits
   */
  public isTradeAllowed(currentPnL: number, dailyTrades: number): boolean {
    // Check daily loss limit
    if (currentPnL <= -this.config.maxDailyLoss) {
      return false;
    }
    
    // Check daily trade limit
    if (dailyTrades >= this.config.maxDailyTrades) {
      return false;
    }
    
    return true;
  }

  /**
   * Get leverage information
   */
  public getLeverageInfo(): { leverage: number; maxPosition: number; riskAmount: number } {
    return {
      leverage: this.config.leverage,
      maxPosition: this.config.maxPositionSize * this.config.leverage,
      riskAmount: this.config.riskPerTrade
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<TradingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Validate configuration
   */
  public validateConfig(): boolean {
    if (this.config.leverage > 100) {
      console.warn('⚠️ Leverage exceeds 100x - this is very risky!');
      return false;
    }
    
    if (this.config.maxPositionSize > 10) {
      console.warn('⚠️ Position size exceeds 10 USDT - consider reducing risk');
      return false;
    }
    
    if (this.config.maxDailyLoss > 100) {
      console.warn('⚠️ Daily loss limit exceeds 100 USDT - very risky!');
      return false;
    }
    
    console.log('✅ Trading configuration validated');
    return true;
  }
}

// Export singleton instance
export const tradingConfig = TradingConfigManager.getInstance();
