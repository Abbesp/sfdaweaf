// Removed backtest-engine dependency

export interface MarketStructurePattern {
  id: string;
  name: string;
  description: string;
  type: 'trend_continuation' | 'trend_reversal' | 'range_breakout' | 'range_continuation' | 'volatility_expansion' | 'volatility_contraction';
  timeframe: string;
  confidence: number;
  conditions: {
    trend?: {
      direction?: 'bullish' | 'bearish' | 'ranging';
      strength?: 'strong' | 'moderate' | 'weak';
    };
    volatility?: {
      expansion?: boolean;
      contraction?: boolean;
      level?: 'high' | 'medium' | 'low';
    };
    volume?: {
      aboveAverage?: boolean;
      spike?: boolean;
      declining?: boolean;
    };
    priceAction?: {
      breakout?: boolean;
      pullback?: boolean;
      consolidation?: boolean;
    };
  };
  expectedOutcome: 'BUY' | 'SELL' | 'HOLD';
  successRate: number;
}

export interface MarketStructureSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  ms_score: number;
  price: number;
  confluence: number;
  strategy: string;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  patterns: MarketStructurePattern[];
  marketStructure: {
    trend: 'bullish' | 'bearish' | 'ranging';
    strength: 'strong' | 'moderate' | 'weak';
    volatility: 'high' | 'medium' | 'low';
    phase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  };
  supportResistance: {
    support: number[];
    resistance: number[];
    keyLevels: number[];
  };
  volumeProfile: {
    highVolumeNodes: number[];
    lowVolumeNodes: number[];
    valueArea: { upper: number; lower: number };
  };
}

export interface MarketStructureAnalysis {
  trend: 'bullish' | 'bearish' | 'ranging';
  strength: 'strong' | 'moderate' | 'weak';
  volatility: 'high' | 'medium' | 'low';
  phase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  supportResistance: {
    support: number[];
    resistance: number[];
    keyLevels: number[];
  };
  volumeProfile: {
    highVolumeNodes: number[];
    lowVolumeNodes: number[];
    valueArea: { upper: number; lower: number };
  };
  marketCycles: {
    current: 'bull' | 'bear' | 'sideways';
    duration: number;
    strength: number;
  };
  lastUpdate: number;
}

export class MarketStructureModule {
  private patterns: MarketStructurePattern[] = [];
  private analyses: { [key: string]: MarketStructureAnalysis } = {};
  private isAnalyzing = false;

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    this.patterns = [
      {
        id: 'trend-continuation-bullish',
        name: 'Bullish Trend Continuation',
        description: 'Strong bullish trend continuing with higher highs and higher lows',
        type: 'trend_continuation',
        timeframe: '1h',
        confidence: 0.8,
        conditions: {
          trend: {
            direction: 'bullish',
            strength: 'strong'
          },
          volatility: {
            level: 'medium'
          },
          volume: {
            aboveAverage: true
          },
          priceAction: {
            pullback: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.78
      },
      {
        id: 'trend-continuation-bearish',
        name: 'Bearish Trend Continuation',
        description: 'Strong bearish trend continuing with lower highs and lower lows',
        type: 'trend_continuation',
        timeframe: '1h',
        confidence: 0.8,
        conditions: {
          trend: {
            direction: 'bearish',
            strength: 'strong'
          },
          volatility: {
            level: 'medium'
          },
          volume: {
            aboveAverage: true
          },
          priceAction: {
            pullback: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.78
      },
      {
        id: 'trend-reversal-bullish',
        name: 'Bullish Trend Reversal',
        description: 'Market structure changing from bearish to bullish',
        type: 'trend_reversal',
        timeframe: '4h',
        confidence: 0.85,
        conditions: {
          trend: {
            direction: 'bullish',
            strength: 'moderate'
          },
          volatility: {
            expansion: true
          },
          volume: {
            spike: true
          },
          priceAction: {
            breakout: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.82
      },
      {
        id: 'trend-reversal-bearish',
        name: 'Bearish Trend Reversal',
        description: 'Market structure changing from bullish to bearish',
        type: 'trend_reversal',
        timeframe: '4h',
        confidence: 0.85,
        conditions: {
          trend: {
            direction: 'bearish',
            strength: 'moderate'
          },
          volatility: {
            expansion: true
          },
          volume: {
            spike: true
          },
          priceAction: {
            breakout: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.82
      },
      {
        id: 'range-breakout-bullish',
        name: 'Bullish Range Breakout',
        description: 'Price breaking out of range to the upside',
        type: 'range_breakout',
        timeframe: '1d',
        confidence: 0.75,
        conditions: {
          trend: {
            direction: 'ranging'
          },
          volatility: {
            expansion: true
          },
          volume: {
            spike: true
          },
          priceAction: {
            breakout: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.75
      },
      {
        id: 'range-breakout-bearish',
        name: 'Bearish Range Breakout',
        description: 'Price breaking out of range to the downside',
        type: 'range_breakout',
        timeframe: '1d',
        confidence: 0.75,
        conditions: {
          trend: {
            direction: 'ranging'
          },
          volatility: {
            expansion: true
          },
          volume: {
            spike: true
          },
          priceAction: {
            breakout: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.75
      },
      {
        id: 'range-continuation-bullish',
        name: 'Bullish Range Continuation',
        description: 'Price bouncing off support in range',
        type: 'range_continuation',
        timeframe: '1h',
        confidence: 0.7,
        conditions: {
          trend: {
            direction: 'ranging'
          },
          volatility: {
            level: 'low'
          },
          volume: {
            aboveAverage: false
          },
          priceAction: {
            pullback: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.70
      },
      {
        id: 'range-continuation-bearish',
        name: 'Bearish Range Continuation',
        description: 'Price rejecting from resistance in range',
        type: 'range_continuation',
        timeframe: '1h',
        confidence: 0.7,
        conditions: {
          trend: {
            direction: 'ranging'
          },
          volatility: {
            level: 'low'
          },
          volume: {
            aboveAverage: false
          },
          priceAction: {
            pullback: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.70
      },
      {
        id: 'volatility-expansion-bullish',
        name: 'Bullish Volatility Expansion',
        description: 'Volatility expanding with bullish bias',
        type: 'volatility_expansion',
        timeframe: '4h',
        confidence: 0.8,
        conditions: {
          volatility: {
            expansion: true,
            level: 'high'
          },
          volume: {
            spike: true
          },
          priceAction: {
            breakout: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.80
      },
      {
        id: 'volatility-expansion-bearish',
        name: 'Bearish Volatility Expansion',
        description: 'Volatility expanding with bearish bias',
        type: 'volatility_expansion',
        timeframe: '4h',
        confidence: 0.8,
        conditions: {
          volatility: {
            expansion: true,
            level: 'high'
          },
          volume: {
            spike: true
          },
          priceAction: {
            breakout: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.80
      },
      {
        id: 'volatility-contraction-bullish',
        name: 'Bullish Volatility Contraction',
        description: 'Volatility contracting with bullish bias',
        type: 'volatility_contraction',
        timeframe: '1h',
        confidence: 0.65,
        conditions: {
          volatility: {
            contraction: true,
            level: 'low'
          },
          volume: {
            declining: true
          },
          priceAction: {
            consolidation: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.65
      },
      {
        id: 'volatility-contraction-bearish',
        name: 'Bearish Volatility Contraction',
        description: 'Volatility contracting with bearish bias',
        type: 'volatility_contraction',
        timeframe: '1h',
        confidence: 0.65,
        conditions: {
          volatility: {
            contraction: true,
            level: 'low'
          },
          volume: {
            declining: true
          },
          priceAction: {
            consolidation: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.65
      }
    ];
  }

  /**
   * Analyserar marknadsstruktur
   */
  analyzeMarketStructure(data: OHLCV[], index: number, timeframe: string): MarketStructureAnalysis {
    if (index < 100) {
      return this.getDefaultMarketStructureAnalysis();
    }

    const key = `${timeframe}_${index}`;
    
    if (this.analyses[key]) {
      return this.analyses[key];
    }

    const analysis = this.calculateMarketStructureAnalysis(data, index, timeframe);
    this.analyses[key] = analysis;
    
    return analysis;
  }

  /**
   * Genererar Market Structure-signaler
   */
  generateMarketStructureSignals(data: OHLCV[], index: number, timeframe: string): MarketStructureSignal[] {
    if (index < 100) return [];

    const signals: MarketStructureSignal[] = [];
    const analysis = this.analyzeMarketStructure(data, index, timeframe);

    // Generera signaler från alla Market Structure-mönster
    for (const pattern of this.patterns) {
      if (pattern.timeframe === timeframe || this.isTimeframeCompatible(timeframe, pattern.timeframe)) {
        const signal = this.generatePatternSignal(pattern, data, index, analysis);
        if (signal) {
          signals.push(signal);
        }
      }
    }

    // Sortera efter confidence och confluence
    return signals.sort((a, b) => (b.confidence * b.confluence) - (a.confidence * a.confluence));
  }

  /**
   * Beräknar marknadsstrukturanalys
   */
  private calculateMarketStructureAnalysis(data: OHLCV[], index: number, timeframe: string): MarketStructureAnalysis {
    const recentData = data.slice(Math.max(0, index - 200), index + 1);
    
    // Beräkna trend
    const trend = this.calculateTrend(recentData);
    const strength = this.calculateTrendStrength(recentData, trend);
    
    // Beräkna volatilitet
    const volatility = this.calculateVolatility(recentData);
    
    // Bestäm marknadsfas
    const phase = this.determineMarketPhase(recentData, trend, volatility);
    
    // Hitta support och resistance
    const supportResistance = this.findSupportResistance(recentData);
    
    // Beräkna volume profile
    const volumeProfile = this.calculateVolumeProfile(recentData);
    
    // Analysera marknadscykler
    const marketCycles = this.analyzeMarketCycles(recentData);

    return {
      trend,
      strength,
      volatility,
      phase,
      supportResistance,
      volumeProfile,
      marketCycles,
      lastUpdate: Date.now()
    };
  }

  /**
   * Beräknar trend
   */
  private calculateTrend(data: OHLCV[]): 'bullish' | 'bearish' | 'ranging' {
    if (data.length < 50) return 'ranging';

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Hitta swing highs och lows
    const swingHighs = this.findSwingHighs(highs);
    const swingLows = this.findSwingLows(lows);
    
    if (swingHighs.length < 3 || swingLows.length < 3) return 'ranging';
    
    // Kontrollera högre highs och högre lows
    const higherHighs = this.checkHigherHighs(swingHighs);
    const higherLows = this.checkHigherLows(swingLows);
    const lowerHighs = this.checkLowerHighs(swingHighs);
    const lowerLows = this.checkLowerLows(swingLows);
    
    if (higherHighs && higherLows) return 'bullish';
    if (lowerHighs && lowerLows) return 'bearish';
    
    return 'ranging';
  }

  /**
   * Beräknar trendstyrka
   */
  private calculateTrendStrength(data: OHLCV[], trend: 'bullish' | 'bearish' | 'ranging'): 'strong' | 'moderate' | 'weak' {
    if (trend === 'ranging') return 'weak';
    
    const recentData = data.slice(-20);
    const priceChange = Math.abs(recentData[recentData.length - 1].close - recentData[0].close);
    const avgPrice = recentData.reduce((sum, d) => sum + d.close, 0) / recentData.length;
    const percentageChange = (priceChange / avgPrice) * 100;
    
    if (percentageChange > 5) return 'strong';
    if (percentageChange > 2) return 'moderate';
    return 'weak';
  }

  /**
   * Beräknar volatilitet
   */
  private calculateVolatility(data: OHLCV[]): 'high' | 'medium' | 'low' {
    if (data.length < 20) return 'medium';
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const return_ = Math.abs((data[i].close - data[i - 1].close) / data[i - 1].close);
      returns.push(return_);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = avgReturn * 100;
    
    if (volatility > 3) return 'high';
    if (volatility > 1.5) return 'medium';
    return 'low';
  }

  /**
   * Bestämmer marknadsfas
   */
  private determineMarketPhase(
    data: OHLCV[], 
    trend: 'bullish' | 'bearish' | 'ranging', 
    volatility: 'high' | 'medium' | 'low'
  ): 'accumulation' | 'markup' | 'distribution' | 'markdown' {
    if (trend === 'bullish') {
      if (volatility === 'low') return 'accumulation';
      return 'markup';
    } else if (trend === 'bearish') {
      if (volatility === 'low') return 'distribution';
      return 'markdown';
    } else {
      if (volatility === 'low') return 'accumulation';
      return 'distribution';
    }
  }

  /**
   * Hittar support och resistance
   */
  private findSupportResistance(data: OHLCV[]): {
    support: number[];
    resistance: number[];
    keyLevels: number[];
  } {
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    const swingHighs = this.findSwingHighs(highs);
    const swingLows = this.findSwingLows(lows);
    
    // Gruppera liknande nivåer
    const resistance = this.groupSimilarLevels(swingHighs);
    const support = this.groupSimilarLevels(swingLows);
    
    // Hitta nyckelvärden
    const keyLevels = [...resistance, ...support].sort((a, b) => b - a);
    
    return {
      support,
      resistance,
      keyLevels
    };
  }

  /**
   * Beräknar volume profile
   */
  private calculateVolumeProfile(data: OHLCV[]): {
    highVolumeNodes: number[];
    lowVolumeNodes: number[];
    valueArea: { upper: number; lower: number };
  } {
    if (data.length < 20) {
      return {
        highVolumeNodes: [],
        lowVolumeNodes: [],
        valueArea: { upper: 0, lower: 0 }
      };
    }
    
    const volumes = data.map(d => d.volume);
    const prices = data.map(d => d.close);
    
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const highVolumeThreshold = avgVolume * 1.5;
    const lowVolumeThreshold = avgVolume * 0.5;
    
    const highVolumeNodes: number[] = [];
    const lowVolumeNodes: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (volumes[i] > highVolumeThreshold) {
        highVolumeNodes.push(prices[i]);
      } else if (volumes[i] < lowVolumeThreshold) {
        lowVolumeNodes.push(prices[i]);
      }
    }
    
    // Beräkna value area (70% av volymen)
    const sortedPrices = prices.sort((a, b) => a - b);
    const valueAreaSize = Math.floor(sortedPrices.length * 0.7);
    const startIndex = Math.floor((sortedPrices.length - valueAreaSize) / 2);
    
    const valueArea = {
      upper: sortedPrices[startIndex + valueAreaSize - 1],
      lower: sortedPrices[startIndex]
    };
    
    return {
      highVolumeNodes,
      lowVolumeNodes,
      valueArea
    };
  }

  /**
   * Analyserar marknadscykler
   */
  private analyzeMarketCycles(data: OHLCV[]): {
    current: 'bull' | 'bear' | 'sideways';
    duration: number;
    strength: number;
  } {
    if (data.length < 50) {
      return { current: 'sideways', duration: 0, strength: 0 };
    }
    
    const recentData = data.slice(-50);
    const trend = this.calculateTrend(recentData);
    const strength = this.calculateTrendStrength(recentData, trend);
    
    let current: 'bull' | 'bear' | 'sideways';
    if (trend === 'bullish') current = 'bull';
    else if (trend === 'bearish') current = 'bear';
    else current = 'sideways';
    
    // Beräkna cykelns längd
    let duration = 0;
    for (let i = recentData.length - 1; i > 0; i--) {
      const currentTrend = this.calculateTrend(recentData.slice(0, i + 1));
      if (currentTrend === trend) {
        duration++;
      } else {
        break;
      }
    }
    
    // Beräkna styrka
    const strengthValue = strength === 'strong' ? 3 : strength === 'moderate' ? 2 : 1;
    
    return {
      current,
      duration,
      strength: strengthValue
    };
  }

  /**
   * Genererar signal från ett specifikt mönster
   */
  private generatePatternSignal(
    pattern: MarketStructurePattern, 
    data: OHLCV[], 
    index: number, 
    analysis: MarketStructureAnalysis
  ): MarketStructureSignal | null {
    if (!this.patternMatches(pattern, data, index, analysis)) {
      return null;
    }

    const currentPrice = data[index].close;
    const signalType = pattern.expectedOutcome;
    const confidence = pattern.confidence;
    const msScore = pattern.successRate * 10;

    // Hitta matchande patterns
    const matchingPatterns = [pattern];
    const confluence = matchingPatterns.length;

    return {
      type: signalType,
      confidence,
      ms_score: msScore,
      price: currentPrice,
      confluence,
      strategy: `Market Structure ${pattern.name}`,
      stopLoss: this.calculateStopLoss(currentPrice, signalType, analysis),
      takeProfit: this.calculateTakeProfit(currentPrice, signalType, analysis),
      reasoning: `Market Structure Pattern: ${pattern.name}, Trend: ${analysis.trend}, Phase: ${analysis.phase}`,
      patterns: matchingPatterns,
      marketStructure: {
        trend: analysis.trend,
        strength: analysis.strength,
        volatility: analysis.volatility,
        phase: analysis.phase
      },
      supportResistance: analysis.supportResistance,
      volumeProfile: analysis.volumeProfile
    };
  }

  /**
   * Kontrollerar om ett mönster matchar
   */
  private patternMatches(
    pattern: MarketStructurePattern, 
    data: OHLCV[], 
    index: number, 
    analysis: MarketStructureAnalysis
  ): boolean {
    const conditions = pattern.conditions;
    
    // Kontrollera trend
    if (conditions.trend) {
      if (conditions.trend.direction && analysis.trend !== conditions.trend.direction) {
        return false;
      }
      if (conditions.trend.strength && analysis.strength !== conditions.trend.strength) {
        return false;
      }
    }
    
    // Kontrollera volatilitet
    if (conditions.volatility) {
      if (conditions.volatility.expansion && !this.isVolatilityExpanding(data, index)) return false;
      if (conditions.volatility.contraction && !this.isVolatilityContracting(data, index)) return false;
      if (conditions.volatility.level && analysis.volatility !== conditions.volatility.level) return false;
    }
    
    // Kontrollera volume
    if (conditions.volume) {
      const volumeRatio = this.calculateVolumeRatio(data, index, 20);
      if (conditions.volume.aboveAverage && volumeRatio <= 1.2) return false;
      if (conditions.volume.spike && volumeRatio <= 2.0) return false;
      if (conditions.volume.declining && volumeRatio >= 0.8) return false;
    }
    
    // Kontrollera price action
    if (conditions.priceAction) {
      if (conditions.priceAction.breakout && !this.isBreakout(data, index)) return false;
      if (conditions.priceAction.pullback && !this.isPullback(data, index)) return false;
      if (conditions.priceAction.consolidation && !this.isConsolidation(data, index)) return false;
    }
    
    return true;
  }

  /**
   * Hjälpfunktioner för tekniska analyser
   */
  private findSwingHighs(highs: number[]): number[] {
    const swingHighs: number[] = [];
    
    for (let i = 3; i < highs.length - 3; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i-3] &&
          highs[i] > highs[i+1] && highs[i] > highs[i+2] && highs[i] > highs[i+3]) {
        swingHighs.push(highs[i]);
      }
    }
    
    return swingHighs;
  }

  private findSwingLows(lows: number[]): number[] {
    const swingLows: number[] = [];
    
    for (let i = 3; i < lows.length - 3; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i-3] &&
          lows[i] < lows[i+1] && lows[i] < lows[i+2] && lows[i] < lows[i+3]) {
        swingLows.push(lows[i]);
      }
    }
    
    return swingLows;
  }

  private checkHigherHighs(highs: number[]): boolean {
    if (highs.length < 2) return false;
    return highs[highs.length - 1] > highs[highs.length - 2];
  }

  private checkHigherLows(lows: number[]): boolean {
    if (lows.length < 2) return false;
    return lows[lows.length - 1] > lows[lows.length - 2];
  }

  private checkLowerHighs(highs: number[]): boolean {
    if (highs.length < 2) return false;
    return highs[highs.length - 1] < highs[highs.length - 2];
  }

  private checkLowerLows(lows: number[]): boolean {
    if (lows.length < 2) return false;
    return lows[lows.length - 1] < lows[lows.length - 2];
  }

  private groupSimilarLevels(levels: number[]): number[] {
    if (levels.length === 0) return [];
    
    const grouped: number[] = [];
    const tolerance = 0.02; // 2% tolerance
    
    for (const level of levels) {
      let found = false;
      for (const groupedLevel of grouped) {
        if (Math.abs(level - groupedLevel) / groupedLevel < tolerance) {
          found = true;
          break;
        }
      }
      if (!found) {
        grouped.push(level);
      }
    }
    
    return grouped.sort((a, b) => b - a);
  }

  private isVolatilityExpanding(data: OHLCV[], index: number): boolean {
    if (index < 20) return false;
    
    const recent = data.slice(index - 10, index + 1);
    const previous = data.slice(index - 20, index - 10);
    
    const recentVolatility = this.calculateVolatility(recent);
    const previousVolatility = this.calculateVolatility(previous);
    
    return recentVolatility === 'high' && previousVolatility !== 'high';
  }

  private isVolatilityContracting(data: OHLCV[], index: number): boolean {
    if (index < 20) return false;
    
    const recent = data.slice(index - 10, index + 1);
    const previous = data.slice(index - 20, index - 10);
    
    const recentVolatility = this.calculateVolatility(recent);
    const previousVolatility = this.calculateVolatility(previous);
    
    return recentVolatility === 'low' && previousVolatility !== 'low';
  }

  private isBreakout(data: OHLCV[], index: number): boolean {
    if (index < 20) return false;
    
    const recent = data.slice(index - 5, index + 1);
    const previous = data.slice(index - 20, index - 5);
    
    const recentHigh = Math.max(...recent.map(d => d.high));
    const recentLow = Math.min(...recent.map(d => d.low));
    const previousHigh = Math.max(...previous.map(d => d.high));
    const previousLow = Math.min(...previous.map(d => d.low));
    
    return recentHigh > previousHigh || recentLow < previousLow;
  }

  private isPullback(data: OHLCV[], index: number): boolean {
    if (index < 10) return false;
    
    const recent = data.slice(index - 5, index + 1);
    const previous = data.slice(index - 10, index - 5);
    
    const recentTrend = this.calculateTrend(recent);
    const previousTrend = this.calculateTrend(previous);
    
    return recentTrend === 'ranging' && previousTrend !== 'ranging';
  }

  private isConsolidation(data: OHLCV[], index: number): boolean {
    if (index < 20) return false;
    
    const recent = data.slice(index - 20, index + 1);
    const trend = this.calculateTrend(recent);
    const volatility = this.calculateVolatility(recent);
    
    return trend === 'ranging' && volatility === 'low';
  }

  private calculateVolumeRatio(data: OHLCV[], index: number, period: number): number {
    if (index < period) return 1;
    
    const currentVolume = data[index].volume;
    const avgVolume = data.slice(index - period + 1, index + 1)
      .reduce((sum, d) => sum + d.volume, 0) / period;
    
    return currentVolume / avgVolume;
  }

  private calculateStopLoss(price: number, signal: 'BUY' | 'SELL', analysis: MarketStructureAnalysis): number {
    const baseStop = 0.02; // 2% base stop
    const volatilityMultiplier = analysis.volatility === 'high' ? 1.5 : analysis.volatility === 'low' ? 0.8 : 1.0;
    const strengthMultiplier = analysis.strength === 'strong' ? 0.8 : analysis.strength === 'weak' ? 1.2 : 1.0;
    
    const stopPercentage = baseStop * volatilityMultiplier * strengthMultiplier;
    
    return signal === 'BUY' 
      ? price * (1 - stopPercentage)
      : price * (1 + stopPercentage);
  }

  private calculateTakeProfit(price: number, signal: 'BUY' | 'SELL', analysis: MarketStructureAnalysis): number {
    const baseProfit = 0.04; // 4% base profit
    const volatilityMultiplier = analysis.volatility === 'high' ? 1.5 : analysis.volatility === 'low' ? 0.8 : 1.0;
    const strengthMultiplier = analysis.strength === 'strong' ? 1.2 : analysis.strength === 'weak' ? 0.8 : 1.0;
    
    const profitPercentage = baseProfit * volatilityMultiplier * strengthMultiplier;
    
    return signal === 'BUY'
      ? price * (1 + profitPercentage)
      : price * (1 - profitPercentage);
  }

  private isTimeframeCompatible(current: string, pattern: string): boolean {
    const timeframes = ['15m', '1h', '4h', '1d'];
    const currentIndex = timeframes.indexOf(current);
    const patternIndex = timeframes.indexOf(pattern);
    
    return Math.abs(currentIndex - patternIndex) <= 1;
  }

  private getDefaultMarketStructureAnalysis(): MarketStructureAnalysis {
    return {
      trend: 'ranging',
      strength: 'weak',
      volatility: 'medium',
      phase: 'accumulation',
      supportResistance: { support: [], resistance: [], keyLevels: [] },
      volumeProfile: { highVolumeNodes: [], lowVolumeNodes: [], valueArea: { upper: 0, lower: 0 } },
      marketCycles: { current: 'sideways', duration: 0, strength: 0 },
      lastUpdate: Date.now()
    };
  }

  /**
   * Hämtar Market Structure-statistik
   */
  getMarketStructureStats(): { [key: string]: any } {
    return {
      patterns: this.patterns.length,
      analyses: Object.keys(this.analyses).length,
      lastAnalysis: this.isAnalyzing ? 'In Progress' : 'Completed'
    };
  }

  /**
   * Rensar gamla analyser
   */
  cleanupOldAnalyses(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, analysis] of Object.entries(this.analyses)) {
      if (now - analysis.lastUpdate > maxAge) {
        delete this.analyses[key];
      }
    }
  }
}
