/**
 * Main Trading Bot Index
 * Exports all trading bot functionality
 */

// Core Bot
export { SpotTradingBot } from './TradingBot/spot-trading-bot';

// Strategies
export { MasterStrategy } from './TradingBot/src/strategies/master-strategy';

// AI Modules
export { SMCModule } from './TradingBot/src/ai/smc-module';
export { ICTModule } from './TradingBot/src/ai/ict-module';
export { MarketStructureModule } from './TradingBot/src/ai/market-structure-module';

// Configuration
export { currencyManager } from './TradingBot/src/config/currency-config';
export { APIConfigManager } from './TradingBot/src/config/api-config';

// Types
export type { CurrencyConfig } from './TradingBot/src/config/currency-config';
export type { APIConfig } from './TradingBot/src/config/api-config';

// Import for use in this file
import { MasterStrategy } from './TradingBot/src/strategies/master-strategy';
import { currencyManager } from './TradingBot/src/config/currency-config';
import { APIConfigManager } from './TradingBot/src/config/api-config';
import type { CurrencyConfig } from './TradingBot/src/config/currency-config';
import type { APIConfig } from './TradingBot/src/config/api-config';

// Strategy Types
export interface BaseStrategy {
  id: string;
  name: string;
  description: string;
  timeframes: string[];
  riskReward: { min: number; max: number };
  features: string[];
  color: string;
  calculateStopLoss(entryPrice: number, signal: 'BUY' | 'SELL'): number;
  calculateTakeProfit(entryPrice: number, stopLoss: number, signal: 'BUY' | 'SELL'): number;
  validateSignal(signal: any): boolean;
  getAnalysisTemplate(symbol: string, signal: 'BUY' | 'SELL'): string;
}

export type StrategyType = 'master';

export interface StrategyConfig {
  [key: string]: BaseStrategy;
}

// Strategy Registry
export const strategies: StrategyConfig = {
  master: new MasterStrategy(),
};

// Strategy Manager
export class StrategyManager {
  static getStrategy(type: StrategyType): BaseStrategy {
    const strategy = strategies[type];
    if (!strategy) {
      throw new Error(`Strategy '${type}' not found`);
    }
    return strategy;
  }

  static getAllStrategies(): BaseStrategy[] {
    return Object.values(strategies);
  }

  static getStrategyTypes(): StrategyType[] {
    return Object.keys(strategies) as StrategyType[];
  }

  static validateStrategy(type: StrategyType): boolean {
    return type in strategies;
  }

  static getMasterStrategy(): MasterStrategy {
    return strategies.master as unknown as MasterStrategy;
  }
}

// Trading Manager
export class TradingManager {
  private static instance: TradingManager;
  private bot: SpotTradingBot;

  private constructor() {
    this.bot = new SpotTradingBot();
  }

  public static getInstance(): TradingManager {
    if (!TradingManager.instance) {
      TradingManager.instance = new TradingManager();
    }
    return TradingManager.instance;
  }

  public async startTrading(): Promise<void> {
    await this.bot.start();
  }

  public async stopTrading(): Promise<void> {
    await this.bot.stop();
  }

  public getBot(): SpotTradingBot {
    return this.bot;
  }

  public getStats(): any {
    // Access private properties through any type
    const botAny = this.bot as any;
    return {
      totalTrades: botAny.trades?.length || 0,
      totalPnL: botAny.trades?.reduce((sum: number, trade: any) => sum + trade.pnl, 0) || 0,
      winRate: botAny.trades?.length > 0 ? (botAny.trades.filter((t: any) => t.pnl > 0).length / botAny.trades.length) * 100 : 0,
      activePositions: botAny.positions?.size || 0,
    };
  }
}

// Currency Manager
export class CurrencyManager {
  public static getSupportedCurrencies(): CurrencyConfig[] {
    return currencyManager.getAllCurrencies();
  }

  public static getCurrency(symbol: string): CurrencyConfig | undefined {
    return currencyManager.getCurrency(symbol);
  }

  public static getCurrenciesByCategory(category: string): CurrencyConfig[] {
    return currencyManager.getCurrenciesByCategory(category);
  }

  public static getCurrenciesByVolatility(volatility: 'low' | 'medium' | 'high'): CurrencyConfig[] {
    return currencyManager.getCurrenciesByVolatility(volatility);
  }

  public static isSupported(symbol: string): boolean {
    return currencyManager.isSupported(symbol);
  }

  public static getRandomCurrency(): CurrencyConfig {
    return currencyManager.getRandomCurrency();
  }

  public static getAITradingCurrencies(): CurrencyConfig[] {
    return currencyManager.getAITradingCurrencies();
  }
}

// API Manager
export class APIManager {
  public static getKucoinConfig(): any {
    return APIConfigManager.getInstance().getKucoinConfig();
  }

  public static validateCredentials(): boolean {
    try {
      APIConfigManager.getInstance().getKucoinConfig();
      return true;
    } catch {
      return false;
    }
  }
}

// Main Bot Instance
import { SpotTradingBot } from './TradingBot/spot-trading-bot';

export const bot = new SpotTradingBot();
export const tradingManager = TradingManager.getInstance();

// Utility Functions
export const utils = {
  // Format currency
  formatCurrency: (amount: number, currency: string = 'USDT'): string => {
    return `${amount.toFixed(4)} ${currency}`;
  },

  // Format percentage
  formatPercentage: (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  },

  // Calculate risk amount
  calculateRiskAmount: (balance: number, riskPercentage: number = 0.4): number => {
    return balance * (riskPercentage / 100);
  },

  // Calculate position size
  calculatePositionSize: (riskAmount: number, entryPrice: number, stopLoss: number): number => {
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    return riskAmount / riskPerUnit;
  },

  // Get current timestamp
  getCurrentTimestamp: (): number => {
    return Date.now();
  },

  // Format timestamp
  formatTimestamp: (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  }
};

// Export everything
export * from './TradingBot/spot-trading-bot';
export * from './TradingBot/src/strategies/master-strategy';
export * from './TradingBot/src/config/currency-config';
export * from './TradingBot/src/config/api-config';
export * from './TradingBot/src/ai/smc-module';
export * from './TradingBot/src/ai/ict-module';
export * from './TradingBot/src/ai/market-structure-module';

// Default export
export default {
  bot,
  tradingManager,
  StrategyManager,
  CurrencyManager,
  APIManager,
  utils,
  strategies
};
