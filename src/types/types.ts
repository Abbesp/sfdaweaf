export interface BaseStrategy {
  id: string;
  name: string;
  description: string;
  timeframes: string[];
  riskReward: {
    min: number;
    max: number;
  };
  features: string[];
  color: string;
  
  // Strategy-specific logic
  calculateStopLoss: (entryPrice: number, signal: 'BUY' | 'SELL') => number;
  calculateTakeProfit: (entryPrice: number, stopLoss: number, signal: 'BUY' | 'SELL') => number;
  validateSignal: (signal: any) => boolean;
  getAnalysisTemplate: (symbol: string, signal: 'BUY' | 'SELL') => string;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  ai_score: number;
  confluence: number;
  positionSize: number;
  timestamp: number;
  analysis: string;
}

export type StrategyType = 'swing' | 'scalp' | 'momentum' | 'ict-smc' | 'super' | 'perfect' | 'ultra' | 'master';

export interface StrategyConfig {
  [key: string]: BaseStrategy;
}
