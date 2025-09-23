import { KuCoinTrader } from './kucoin-trader';
import { AIMarketLearner } from '../ai/ai-market-learner';
import { StrategyManager } from '../../index';
import { BaseStrategy } from '../types/types';
import { currencyManager, CurrencyConfig } from '../config/currency-config';

/**
 * Trading Manager - Orchestrates live trading with AI and strategies
 */

export interface TradingSession {
  id: string;
  startTime: number;
  endTime?: number;
  strategy: string;
  symbol: string;
  timeframe: string;
  trades: any[];
  pnl: number;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
}

export class TradingManager {
  private kucoinTrader: KuCoinTrader;
  private aiLearner: AIMarketLearner;
  private activeSessions: Map<string, TradingSession> = new Map();
  private isRunning = false;

  constructor() {
    this.kucoinTrader = new KuCoinTrader();
    this.aiLearner = new AIMarketLearner();
  }

  /**
   * Start a new trading session
   */
  async startTradingSession(
    symbol: string,
    strategyId: string,
    timeframe: string = '1h'
  ): Promise<TradingSession> {
    
    const strategy = StrategyManager.getStrategy(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    // Validate currency is supported
    const currency = currencyManager.getCurrency(symbol);
    if (!currency) {
      throw new Error(`Currency ${symbol} is not supported`);
    }

    const session: TradingSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      strategy: strategyId,
      symbol,
      timeframe,
      trades: [],
      pnl: 0,
      status: 'ACTIVE'
    };

    this.activeSessions.set(session.id, session);
    console.log(`🚀 Started trading session: ${session.id} for ${symbol} with ${strategyId}`);
    console.log(`💰 Currency: ${currency.name} (Min order: ${currency.minOrderValue} USDT, Max leverage: ${currency.maxLeverage}x)`);
    
    return session;
  }

  /**
   * Start multiple trading sessions for all supported currencies
   */
  async startMultiCurrencyTrading(
    strategyId: string,
    timeframe: string = '1h'
  ): Promise<TradingSession[]> {
    
    const sessions: TradingSession[] = [];
    const currencies = currencyManager.getAITradingCurrencies();
    
    console.log(`🚀 Starting multi-currency trading with ${currencies.length} currencies...`);
    
    for (const currency of currencies) {
      try {
        const session = await this.startTradingSession(
          currency.symbol,
          strategyId,
          timeframe
        );
        sessions.push(session);
      } catch (error) {
        console.error(`❌ Failed to start session for ${currency.symbol}:`, error);
      }
    }
    
    console.log(`✅ Started ${sessions.length} trading sessions`);
    return sessions;
  }

  /**
   * Process market data and generate trades
   */
  async processMarketData(
    sessionId: string,
    marketData: any[]
  ): Promise<void> {
    
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      return;
    }

    try {
      // Get AI signals
      const aiSignals = this.aiLearner.generateAISignals(marketData, marketData.length - 1);
      
      // Get strategy signals
      const strategy = StrategyManager.getStrategy(session.strategy);
      const strategySignal = strategy.getEntrySignal(marketData, marketData.length - 1);
      
      // Combine AI and strategy signals
      const combinedSignal = this.combineSignals(aiSignals, strategySignal);
      
      if (combinedSignal && combinedSignal.action !== 'HOLD') {
        // Execute trade
        const currentPrice = marketData[marketData.length - 1].close;
        const quantity = this.calculateQuantity(currentPrice, combinedSignal.confidence, session.symbol, marketData);
        
        // Get AI-determined leverage
        const leverage = this.aiLearner.determineOptimalLeverage(marketData, marketData.length - 1, session.symbol);
        
        const trade = await this.kucoinTrader.executeTrade(
          session.symbol,
          strategy,
          combinedSignal.action,
          quantity,
          currentPrice,
          leverage
        );

        if (trade) {
          session.trades.push(trade);
          console.log(`📈 Trade executed in session ${sessionId}: ${trade.side} ${trade.quantity} ${session.symbol}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing market data for session ${sessionId}:`, error);
    }
  }

  /**
   * Combine AI signals with strategy signals
   */
  private combineSignals(aiSignals: any[], strategySignal: any): any {
    if (!strategySignal || strategySignal.action === 'HOLD') {
      return null;
    }

    // Calculate AI confidence
    const aiConfidence = aiSignals.length > 0 
      ? aiSignals.reduce((sum, signal) => sum + signal.confidence, 0) / aiSignals.length
      : 0.5;

    // Combine with strategy confidence
    const combinedConfidence = (aiConfidence + strategySignal.confidence) / 2;

    // Only proceed if combined confidence is high enough
    if (combinedConfidence < 0.7) {
      return null;
    }

    return {
      action: strategySignal.action,
      confidence: combinedConfidence,
      aiSignals: aiSignals.length,
      strategyConfidence: strategySignal.confidence
    };
  }

  /**
   * Calculate trade quantity based on 1 USDT with AI-determined leverage
   */
  private calculateQuantity(price: number, confidence: number, symbol: string, marketData: any[]): number {
    // Fixed 1 USDT per trade
    const usdtAmount = 1.0; // Always 1 USDT
    
    // Get AI-determined leverage
    const leverage = this.aiLearner.determineOptimalLeverage(marketData, marketData.length - 1, symbol);
    
    // Get currency config for max leverage limit
    const currency = currencyManager.getCurrency(symbol);
    const maxLeverage = currency ? currency.maxLeverage : 50;
    
    // Ensure leverage doesn't exceed currency limits
    const finalLeverage = Math.min(leverage, maxLeverage);
    
    // Calculate quantity based on leveraged amount
    const leveragedAmount = usdtAmount * finalLeverage;
    const quantity = leveragedAmount / price;
    
    // Adjust based on confidence (but keep within 1 USDT limit)
    const confidenceMultiplier = Math.min(confidence, 1.0);
    
    console.log(`💰 Trade calculation for ${symbol}: 1 USDT × ${finalLeverage}x leverage = ${leveragedAmount} USDT trading power`);
    
    return quantity * confidenceMultiplier;
  }

  /**
   * Stop a trading session
   */
  async stopTradingSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'STOPPED';
      session.endTime = Date.now();
      
      // Close any open positions
      await this.liveTrader.closeAllTrades();
      
      console.log(`🛑 Stopped trading session: ${sessionId}`);
    }
  }

  /**
   * Pause a trading session
   */
  pauseTradingSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'PAUSED';
      console.log(`⏸️ Paused trading session: ${sessionId}`);
    }
  }

  /**
   * Resume a trading session
   */
  resumeTradingSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'ACTIVE';
      console.log(`▶️ Resumed trading session: ${sessionId}`);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const duration = (session.endTime || Date.now()) - session.startTime;
    const winRate = session.trades.length > 0 
      ? session.trades.filter(t => t.pnl > 0).length / session.trades.length
      : 0;

    return {
      sessionId: session.id,
      symbol: session.symbol,
      strategy: session.strategy,
      duration: Math.round(duration / 1000 / 60), // minutes
      totalTrades: session.trades.length,
      winRate: Math.round(winRate * 100),
      pnl: session.pnl,
      status: session.status
    };
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TradingSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): TradingSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get trading statistics
   */
  getTradingStats() {
    const traderStats = this.liveTrader.getTradingStats();
    const sessions = this.getAllSessions();
    
    return {
      ...traderStats,
      activeSessions: sessions.filter(s => s.status === 'ACTIVE').length,
      totalSessions: sessions.length,
      isTestnet: traderStats.isTestnet
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
