// Removed backtest-engine dependency

export interface SMCPattern {
  id: string;
  name: string;
  description: string;
  type: 'liquidity_grab' | 'order_block' | 'fair_value_gap' | 'break_of_structure' | 'change_of_character';
  timeframe: string;
  confidence: number;
  conditions: {
    priceAction?: {
      liquidityGrab?: boolean;
      orderBlock?: boolean;
      fairValueGap?: boolean;
      breakOfStructure?: boolean;
      changeOfCharacter?: boolean;
    };
    volume?: {
      aboveAverage?: boolean;
      spike?: boolean;
    };
    marketStructure?: {
      bullish?: boolean;
      bearish?: boolean;
      ranging?: boolean;
    };
  };
  expectedOutcome: 'BUY' | 'SELL' | 'HOLD';
  successRate: number;
}

export interface SMCSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  smc_score: number;
  price: number;
  confluence: number;
  strategy: string;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  patterns: SMCPattern[];
  marketStructure: 'bullish' | 'bearish' | 'ranging';
  liquidityLevels: number[];
  orderBlocks: { price: number; type: 'bullish' | 'bearish'; strength: number }[];
}

export interface MarketStructure {
  trend: 'bullish' | 'bearish' | 'ranging';
  structure: 'break_of_structure' | 'change_of_character' | 'continuation';
  liquidityLevels: {
    high: number[];
    low: number[];
    recent: number[];
  };
  orderBlocks: {
    bullish: { price: number; strength: number; age: number }[];
    bearish: { price: number; strength: number; age: number }[];
  };
  fairValueGaps: {
    bullish: { start: number; end: number; strength: number }[];
    bearish: { start: number; end: number; strength: number }[];
  };
  lastUpdate: number;
}

export class SMCModule {
  private patterns: SMCPattern[] = [];
  private marketStructures: { [key: string]: MarketStructure } = {};
  private isAnalyzing = false;

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    this.patterns = [
      {
        id: 'liquidity-grab-bullish',
        name: 'Bullish Liquidity Grab',
        description: 'Price sweeps liquidity below previous low then reverses',
        type: 'liquidity_grab',
        timeframe: '15m',
        confidence: 0.8,
        conditions: {
          priceAction: {
            liquidityGrab: true,
            breakOfStructure: false
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.75
      },
      {
        id: 'liquidity-grab-bearish',
        name: 'Bearish Liquidity Grab',
        description: 'Price sweeps liquidity above previous high then reverses',
        type: 'liquidity_grab',
        timeframe: '15m',
        confidence: 0.8,
        conditions: {
          priceAction: {
            liquidityGrab: true,
            breakOfStructure: false
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.75
      },
      {
        id: 'order-block-bullish',
        name: 'Bullish Order Block',
        description: 'Strong bullish candle followed by pullback to order block',
        type: 'order_block',
        timeframe: '1h',
        confidence: 0.85,
        conditions: {
          priceAction: {
            orderBlock: true
          },
          volume: {
            spike: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.78
      },
      {
        id: 'order-block-bearish',
        name: 'Bearish Order Block',
        description: 'Strong bearish candle followed by pullback to order block',
        type: 'order_block',
        timeframe: '1h',
        confidence: 0.85,
        conditions: {
          priceAction: {
            orderBlock: true
          },
          volume: {
            spike: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.78
      },
      {
        id: 'fair-value-gap-bullish',
        name: 'Bullish Fair Value Gap',
        description: 'Gap between candles that needs to be filled',
        type: 'fair_value_gap',
        timeframe: '4h',
        confidence: 0.7,
        conditions: {
          priceAction: {
            fairValueGap: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.72
      },
      {
        id: 'fair-value-gap-bearish',
        name: 'Bearish Fair Value Gap',
        description: 'Gap between candles that needs to be filled',
        type: 'fair_value_gap',
        timeframe: '4h',
        confidence: 0.7,
        conditions: {
          priceAction: {
            fairValueGap: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.72
      },
      {
        id: 'break-of-structure-bullish',
        name: 'Bullish Break of Structure',
        description: 'Price breaks above previous high with volume',
        type: 'break_of_structure',
        timeframe: '1d',
        confidence: 0.9,
        conditions: {
          priceAction: {
            breakOfStructure: true
          },
          volume: {
            spike: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.82
      },
      {
        id: 'break-of-structure-bearish',
        name: 'Bearish Break of Structure',
        description: 'Price breaks below previous low with volume',
        type: 'break_of_structure',
        timeframe: '1d',
        confidence: 0.9,
        conditions: {
          priceAction: {
            breakOfStructure: true
          },
          volume: {
            spike: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.82
      },
      {
        id: 'change-of-character-bullish',
        name: 'Bullish Change of Character',
        description: 'Market structure changes from bearish to bullish',
        type: 'change_of_character',
        timeframe: '1d',
        confidence: 0.88,
        conditions: {
          priceAction: {
            changeOfCharacter: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.85
      },
      {
        id: 'change-of-character-bearish',
        name: 'Bearish Change of Character',
        description: 'Market structure changes from bullish to bearish',
        type: 'change_of_character',
        timeframe: '1d',
        confidence: 0.88,
        conditions: {
          priceAction: {
            changeOfCharacter: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.85
      }
    ];
  }

  /**
   * Analyserar marknadsstruktur och genererar SMC-signaler
   */
  analyzeMarketStructure(data: OHLCV[], index: number, timeframe: string): MarketStructure {
    if (index < 50) {
      return this.getDefaultMarketStructure();
    }

    const key = `${timeframe}_${index}`;
    
    if (this.marketStructures[key]) {
      return this.marketStructures[key];
    }

    const structure = this.calculateMarketStructure(data, index, timeframe);
    this.marketStructures[key] = structure;
    
    return structure;
  }

  /**
   * Genererar SMC-signaler baserat på marknadsanalys
   */
  generateSMCSignals(data: OHLCV[], index: number, timeframe: string): SMCSignal[] {
    if (index < 50) return [];

    const signals: SMCSignal[] = [];
    const marketStructure = this.analyzeMarketStructure(data, index, timeframe);

    // Generera signaler från alla SMC-mönster
    for (const pattern of this.patterns) {
      if (pattern.timeframe === timeframe || this.isTimeframeCompatible(timeframe, pattern.timeframe)) {
        const signal = this.generatePatternSignal(pattern, data, index, marketStructure);
        if (signal) {
          signals.push(signal);
        }
      }
    }

    // Sortera efter confidence och confluence
    return signals.sort((a, b) => (b.confidence * b.confluence) - (a.confidence * a.confluence));
  }

  /**
   * Beräknar marknadsstruktur
   */
  private calculateMarketStructure(data: OHLCV[], index: number, timeframe: string): MarketStructure {
    const recentData = data.slice(Math.max(0, index - 100), index + 1);
    
    // Beräkna trend
    const trend = this.calculateTrend(recentData);
    
    // Hitta liquidity levels
    const liquidityLevels = this.findLiquidityLevels(recentData);
    
    // Hitta order blocks
    const orderBlocks = this.findOrderBlocks(recentData);
    
    // Hitta fair value gaps
    const fairValueGaps = this.findFairValueGaps(recentData);
    
    // Bestäm struktur
    const structure = this.determineStructure(recentData, trend);

    return {
      trend,
      structure,
      liquidityLevels,
      orderBlocks,
      fairValueGaps,
      lastUpdate: Date.now()
    };
  }

  /**
   * Beräknar trend baserat på högre highs/lows
   */
  private calculateTrend(data: OHLCV[]): 'bullish' | 'bearish' | 'ranging' {
    if (data.length < 20) return 'ranging';

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Hitta swing highs och lows
    const swingHighs = this.findSwingHighs(highs);
    const swingLows = this.findSwingLows(lows);
    
    if (swingHighs.length < 2 || swingLows.length < 2) return 'ranging';
    
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
   * Hittar liquidity levels
   */
  private findLiquidityLevels(data: OHLCV[]): { high: number[]; low: number[]; recent: number[] } {
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    const swingHighs = this.findSwingHighs(highs);
    const swingLows = this.findSwingLows(lows);
    
    const recentHighs = swingHighs.slice(-5);
    const recentLows = swingLows.slice(-5);
    
    return {
      high: swingHighs,
      low: swingLows,
      recent: [...recentHighs, ...recentLows]
    };
  }

  /**
   * Hittar order blocks
   */
  private findOrderBlocks(data: OHLCV[]): {
    bullish: { price: number; strength: number; age: number }[];
    bearish: { price: number; strength: number; age: number }[];
  } {
    const bullishBlocks: { price: number; strength: number; age: number }[] = [];
    const bearishBlocks: { price: number; strength: number; age: number }[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      const current = data[i];
      const previous = data[i - 1];
      const next = data[i + 1];
      
      // Bullish order block: strong bullish candle followed by pullback
      if (this.isStrongBullishCandle(current) && next.close < current.close) {
        const strength = this.calculateOrderBlockStrength(current, data, i);
        bullishBlocks.push({
          price: current.low,
          strength,
          age: data.length - i
        });
      }
      
      // Bearish order block: strong bearish candle followed by pullback
      if (this.isStrongBearishCandle(current) && next.close > current.close) {
        const strength = this.calculateOrderBlockStrength(current, data, i);
        bearishBlocks.push({
          price: current.high,
          strength,
          age: data.length - i
        });
      }
    }
    
    return { bullish: bullishBlocks, bearish: bearishBlocks };
  }

  /**
   * Hittar fair value gaps
   */
  private findFairValueGaps(data: OHLCV[]): {
    bullish: { start: number; end: number; strength: number }[];
    bearish: { start: number; end: number; strength: number }[];
  } {
    const bullishGaps: { start: number; end: number; strength: number }[] = [];
    const bearishGaps: { start: number; end: number; strength: number }[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      const current = data[i];
      const previous = data[i - 1];
      const next = data[i + 1];
      
      // Bullish FVG: gap between previous high and next low
      if (current.high > previous.high && next.low > current.low) {
        const gapSize = next.low - previous.high;
        if (gapSize > 0) {
          bullishGaps.push({
            start: previous.high,
            end: next.low,
            strength: gapSize / current.close
          });
        }
      }
      
      // Bearish FVG: gap between previous low and next high
      if (current.low < previous.low && next.high < current.high) {
        const gapSize = previous.low - next.high;
        if (gapSize > 0) {
          bearishGaps.push({
            start: next.high,
            end: previous.low,
            strength: gapSize / current.close
          });
        }
      }
    }
    
    return { bullish: bullishGaps, bearish: bearishGaps };
  }

  /**
   * Bestämmer marknadsstruktur
   */
  private determineStructure(data: OHLCV[], trend: 'bullish' | 'bearish' | 'ranging'): 'break_of_structure' | 'change_of_character' | 'continuation' {
    if (data.length < 10) return 'continuation';
    
    const recent = data.slice(-10);
    const previous = data.slice(-20, -10);
    
    // Kontrollera för break of structure
    if (this.isBreakOfStructure(recent, previous, trend)) {
      return 'break_of_structure';
    }
    
    // Kontrollera för change of character
    if (this.isChangeOfCharacter(recent, previous, trend)) {
      return 'change_of_character';
    }
    
    return 'continuation';
  }

  /**
   * Genererar signal från ett specifikt mönster
   */
  private generatePatternSignal(
    pattern: SMCPattern, 
    data: OHLCV[], 
    index: number, 
    marketStructure: MarketStructure
  ): SMCSignal | null {
    if (!this.patternMatches(pattern, data, index, marketStructure)) {
      return null;
    }

    const currentPrice = data[index].close;
    const signalType = pattern.expectedOutcome;
    const confidence = pattern.confidence;
    const smcScore = pattern.successRate * 10;

    // Hitta matchande patterns
    const matchingPatterns = [pattern];
    const confluence = matchingPatterns.length;

    return {
      type: signalType,
      confidence,
      smc_score: smcScore,
      price: currentPrice,
      confluence,
      strategy: `SMC ${pattern.name}`,
      stopLoss: this.calculateStopLoss(currentPrice, signalType, marketStructure),
      takeProfit: this.calculateTakeProfit(currentPrice, signalType, marketStructure),
      reasoning: `SMC Pattern: ${pattern.name}, Market Structure: ${marketStructure.trend}`,
      patterns: matchingPatterns,
      marketStructure: marketStructure.trend,
      liquidityLevels: marketStructure.liquidityLevels.recent,
      orderBlocks: this.formatOrderBlocks(marketStructure.orderBlocks)
    };
  }

  /**
   * Kontrollerar om ett mönster matchar
   */
  private patternMatches(
    pattern: SMCPattern, 
    data: OHLCV[], 
    index: number, 
    marketStructure: MarketStructure
  ): boolean {
    const conditions = pattern.conditions;
    
    // Kontrollera price action
    if (conditions.priceAction) {
      if (conditions.priceAction.liquidityGrab && !this.isLiquidityGrab(data, index)) return false;
      if (conditions.priceAction.orderBlock && !this.isOrderBlock(data, index)) return false;
      if (conditions.priceAction.fairValueGap && !this.isFairValueGap(data, index)) return false;
      if (conditions.priceAction.breakOfStructure && marketStructure.structure !== 'break_of_structure') return false;
      if (conditions.priceAction.changeOfCharacter && marketStructure.structure !== 'change_of_character') return false;
    }
    
    // Kontrollera volume
    if (conditions.volume) {
      const volumeRatio = this.calculateVolumeRatio(data, index, 20);
      if (conditions.volume.aboveAverage && volumeRatio <= 1.2) return false;
      if (conditions.volume.spike && volumeRatio <= 2.0) return false;
    }
    
    // Kontrollera market structure
    if (conditions.marketStructure) {
      if (conditions.marketStructure.bullish && marketStructure.trend !== 'bullish') return false;
      if (conditions.marketStructure.bearish && marketStructure.trend !== 'bearish') return false;
      if (conditions.marketStructure.ranging && marketStructure.trend !== 'ranging') return false;
    }
    
    return true;
  }

  /**
   * Hjälpfunktioner för tekniska analyser
   */
  private findSwingHighs(highs: number[]): number[] {
    const swingHighs: number[] = [];
    
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        swingHighs.push(highs[i]);
      }
    }
    
    return swingHighs;
  }

  private findSwingLows(lows: number[]): number[] {
    const swingLows: number[] = [];
    
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
          lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
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

  private isStrongBullishCandle(candle: OHLCV): boolean {
    const bodySize = candle.close - candle.open;
    const totalSize = candle.high - candle.low;
    return bodySize > totalSize * 0.7 && bodySize > 0;
  }

  private isStrongBearishCandle(candle: OHLCV): boolean {
    const bodySize = candle.open - candle.close;
    const totalSize = candle.high - candle.low;
    return bodySize > totalSize * 0.7 && bodySize > 0;
  }

  private calculateOrderBlockStrength(candle: OHLCV, data: OHLCV[], index: number): number {
    const volumeRatio = this.calculateVolumeRatio(data, index, 20);
    const bodySize = Math.abs(candle.close - candle.open);
    const totalSize = candle.high - candle.low;
    const bodyRatio = bodySize / totalSize;
    
    return (volumeRatio * bodyRatio) / 2;
  }

  private isLiquidityGrab(data: OHLCV[], index: number): boolean {
    if (index < 10) return false;
    
    const current = data[index];
    const recentLows = data.slice(index - 10, index).map(d => d.low);
    const recentHighs = data.slice(index - 10, index).map(d => d.high);
    
    const minLow = Math.min(...recentLows);
    const maxHigh = Math.max(...recentHighs);
    
    // Liquidity grab: price sweeps beyond recent levels then reverses
    return (current.low < minLow && current.close > minLow) || 
           (current.high > maxHigh && current.close < maxHigh);
  }

  private isOrderBlock(data: OHLCV[], index: number): boolean {
    if (index < 2) return false;
    
    const current = data[index];
    const previous = data[index - 1];
    
    // Order block: strong candle followed by pullback
    return (this.isStrongBullishCandle(previous) && current.close < previous.close) ||
           (this.isStrongBearishCandle(previous) && current.close > previous.close);
  }

  private isFairValueGap(data: OHLCV[], index: number): boolean {
    if (index < 2) return false;
    
    const current = data[index];
    const previous = data[index - 1];
    
    // FVG: gap between candles
    return current.low > previous.high || current.high < previous.low;
  }

  private isBreakOfStructure(recent: OHLCV[], previous: OHLCV[], trend: 'bullish' | 'bearish' | 'ranging'): boolean {
    if (recent.length < 5 || previous.length < 5) return false;
    
    const recentHigh = Math.max(...recent.map(d => d.high));
    const recentLow = Math.min(...recent.map(d => d.low));
    const previousHigh = Math.max(...previous.map(d => d.high));
    const previousLow = Math.min(...previous.map(d => d.low));
    
    if (trend === 'bullish') {
      return recentHigh > previousHigh;
    } else if (trend === 'bearish') {
      return recentLow < previousLow;
    }
    
    return false;
  }

  private isChangeOfCharacter(recent: OHLCV[], previous: OHLCV[], trend: 'bullish' | 'bearish' | 'ranging'): boolean {
    if (recent.length < 5 || previous.length < 5) return false;
    
    const recentTrend = this.calculateTrend(recent);
    const previousTrend = this.calculateTrend(previous);
    
    return recentTrend !== previousTrend && recentTrend !== 'ranging' && previousTrend !== 'ranging';
  }

  private calculateVolumeRatio(data: OHLCV[], index: number, period: number): number {
    if (index < period) return 1;
    
    const currentVolume = data[index].volume;
    const avgVolume = data.slice(index - period + 1, index + 1)
      .reduce((sum, d) => sum + d.volume, 0) / period;
    
    return currentVolume / avgVolume;
  }

  private calculateStopLoss(price: number, signal: 'BUY' | 'SELL', marketStructure: MarketStructure): number {
    const baseStop = 0.02; // 2% base stop
    const structureMultiplier = marketStructure.trend === 'ranging' ? 1.5 : 1.0;
    
    const stopPercentage = baseStop * structureMultiplier;
    
    return signal === 'BUY' 
      ? price * (1 - stopPercentage)
      : price * (1 + stopPercentage);
  }

  private calculateTakeProfit(price: number, signal: 'BUY' | 'SELL', marketStructure: MarketStructure): number {
    const baseProfit = 0.04; // 4% base profit
    const structureMultiplier = marketStructure.trend === 'ranging' ? 0.8 : 1.2;
    
    const profitPercentage = baseProfit * structureMultiplier;
    
    return signal === 'BUY'
      ? price * (1 + profitPercentage)
      : price * (1 - profitPercentage);
  }

  private formatOrderBlocks(orderBlocks: any): { price: number; type: 'bullish' | 'bearish'; strength: number }[] {
    const formatted: { price: number; type: 'bullish' | 'bearish'; strength: number }[] = [];
    
    orderBlocks.bullish.forEach((block: any) => {
      formatted.push({ price: block.price, type: 'bullish', strength: block.strength });
    });
    
    orderBlocks.bearish.forEach((block: any) => {
      formatted.push({ price: block.price, type: 'bearish', strength: block.strength });
    });
    
    return formatted;
  }

  private isTimeframeCompatible(current: string, pattern: string): boolean {
    const timeframes = ['15m', '1h', '4h', '1d'];
    const currentIndex = timeframes.indexOf(current);
    const patternIndex = timeframes.indexOf(pattern);
    
    return Math.abs(currentIndex - patternIndex) <= 1;
  }

  private getDefaultMarketStructure(): MarketStructure {
    return {
      trend: 'ranging',
      structure: 'continuation',
      liquidityLevels: { high: [], low: [], recent: [] },
      orderBlocks: { bullish: [], bearish: [] },
      fairValueGaps: { bullish: [], bearish: [] },
      lastUpdate: Date.now()
    };
  }

  /**
   * Hämtar SMC-statistik
   */
  getSMCStats(): { [key: string]: any } {
    return {
      patterns: this.patterns.length,
      marketStructures: Object.keys(this.marketStructures).length,
      lastAnalysis: this.isAnalyzing ? 'In Progress' : 'Completed'
    };
  }

  /**
   * Rensar gamla marknadsstrukturer
   */
  cleanupOldStructures(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, structure] of Object.entries(this.marketStructures)) {
      if (now - structure.lastUpdate > maxAge) {
        delete this.marketStructures[key];
      }
    }
  }
}
