// Removed backtest-engine dependency

export interface ICTPattern {
  id: string;
  name: string;
  description: string;
  type: 'killzone' | 'liquidity_sweep' | 'order_block' | 'fair_value_gap' | 'market_structure' | 'time_based';
  timeframe: string;
  confidence: number;
  conditions: {
    timeBased?: {
      killzone?: 'london' | 'new_york' | 'asian';
      session?: 'london_open' | 'new_york_open' | 'asian_session';
    };
    priceAction?: {
      liquiditySweep?: boolean;
      orderBlock?: boolean;
      fairValueGap?: boolean;
      marketStructure?: boolean;
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

export interface ICTSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  ict_score: number;
  price: number;
  confluence: number;
  strategy: string;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  patterns: ICTPattern[];
  killzone: 'london' | 'new_york' | 'asian' | 'none';
  session: 'london_open' | 'new_york_open' | 'asian_session' | 'none';
  marketStructure: 'bullish' | 'bearish' | 'ranging';
  liquidityLevels: number[];
  orderBlocks: { price: number; type: 'bullish' | 'bearish'; strength: number }[];
  fairValueGaps: { start: number; end: number; type: 'bullish' | 'bearish' }[];
}

export interface ICTMarketAnalysis {
  currentKillzone: 'london' | 'new_york' | 'asian' | 'none';
  currentSession: 'london_open' | 'new_york_open' | 'asian_session' | 'none';
  marketStructure: 'bullish' | 'bearish' | 'ranging';
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

export class ICTModule {
  private patterns: ICTPattern[] = [];
  private marketAnalyses: { [key: string]: ICTMarketAnalysis } = {};
  private isAnalyzing = false;

  // ICT Killzones (UTC times)
  private readonly KILLZONES = {
    london: { start: 7, end: 10 }, // 7:00-10:00 UTC
    new_york: { start: 13, end: 16 }, // 13:00-16:00 UTC
    asian: { start: 0, end: 3 } // 00:00-03:00 UTC
  };

  // ICT Sessions
  private readonly SESSIONS = {
    london_open: { start: 7, end: 8 }, // 7:00-8:00 UTC
    new_york_open: { start: 13, end: 14 }, // 13:00-14:00 UTC
    asian_session: { start: 0, end: 8 } // 00:00-8:00 UTC
  };

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    this.patterns = [
      {
        id: 'london-killzone-bullish',
        name: 'London Killzone Bullish',
        description: 'Bullish setup during London killzone (7:00-10:00 UTC)',
        type: 'killzone',
        timeframe: '15m',
        confidence: 0.85,
        conditions: {
          timeBased: {
            killzone: 'london'
          },
          priceAction: {
            liquiditySweep: true,
            orderBlock: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.82
      },
      {
        id: 'london-killzone-bearish',
        name: 'London Killzone Bearish',
        description: 'Bearish setup during London killzone (7:00-10:00 UTC)',
        type: 'killzone',
        timeframe: '15m',
        confidence: 0.85,
        conditions: {
          timeBased: {
            killzone: 'london'
          },
          priceAction: {
            liquiditySweep: true,
            orderBlock: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.82
      },
      {
        id: 'new-york-killzone-bullish',
        name: 'New York Killzone Bullish',
        description: 'Bullish setup during New York killzone (13:00-16:00 UTC)',
        type: 'killzone',
        timeframe: '15m',
        confidence: 0.88,
        conditions: {
          timeBased: {
            killzone: 'new_york'
          },
          priceAction: {
            liquiditySweep: true,
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
        successRate: 0.85
      },
      {
        id: 'new-york-killzone-bearish',
        name: 'New York Killzone Bearish',
        description: 'Bearish setup during New York killzone (13:00-16:00 UTC)',
        type: 'killzone',
        timeframe: '15m',
        confidence: 0.88,
        conditions: {
          timeBased: {
            killzone: 'new_york'
          },
          priceAction: {
            liquiditySweep: true,
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
        successRate: 0.85
      },
      {
        id: 'asian-killzone-bullish',
        name: 'Asian Killzone Bullish',
        description: 'Bullish setup during Asian killzone (00:00-03:00 UTC)',
        type: 'killzone',
        timeframe: '1h',
        confidence: 0.75,
        conditions: {
          timeBased: {
            killzone: 'asian'
          },
          priceAction: {
            fairValueGap: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.78
      },
      {
        id: 'asian-killzone-bearish',
        name: 'Asian Killzone Bearish',
        description: 'Bearish setup during Asian killzone (00:00-03:00 UTC)',
        type: 'killzone',
        timeframe: '1h',
        confidence: 0.75,
        conditions: {
          timeBased: {
            killzone: 'asian'
          },
          priceAction: {
            fairValueGap: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.78
      },
      {
        id: 'london-open-bullish',
        name: 'London Open Bullish',
        description: 'Bullish setup during London open (7:00-8:00 UTC)',
        type: 'time_based',
        timeframe: '15m',
        confidence: 0.9,
        conditions: {
          timeBased: {
            session: 'london_open'
          },
          priceAction: {
            liquiditySweep: true,
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
        successRate: 0.88
      },
      {
        id: 'london-open-bearish',
        name: 'London Open Bearish',
        description: 'Bearish setup during London open (7:00-8:00 UTC)',
        type: 'time_based',
        timeframe: '15m',
        confidence: 0.9,
        conditions: {
          timeBased: {
            session: 'london_open'
          },
          priceAction: {
            liquiditySweep: true,
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
        successRate: 0.88
      },
      {
        id: 'new-york-open-bullish',
        name: 'New York Open Bullish',
        description: 'Bullish setup during New York open (13:00-14:00 UTC)',
        type: 'time_based',
        timeframe: '15m',
        confidence: 0.92,
        conditions: {
          timeBased: {
            session: 'new_york_open'
          },
          priceAction: {
            liquiditySweep: true,
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
        successRate: 0.90
      },
      {
        id: 'new-york-open-bearish',
        name: 'New York Open Bearish',
        description: 'Bearish setup during New York open (13:00-14:00 UTC)',
        type: 'time_based',
        timeframe: '15m',
        confidence: 0.92,
        conditions: {
          timeBased: {
            session: 'new_york_open'
          },
          priceAction: {
            liquiditySweep: true,
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
        successRate: 0.90
      },
      {
        id: 'ict-order-block-bullish',
        name: 'ICT Bullish Order Block',
        description: 'ICT bullish order block with liquidity sweep',
        type: 'order_block',
        timeframe: '1h',
        confidence: 0.8,
        conditions: {
          priceAction: {
            orderBlock: true,
            liquiditySweep: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.80
      },
      {
        id: 'ict-order-block-bearish',
        name: 'ICT Bearish Order Block',
        description: 'ICT bearish order block with liquidity sweep',
        type: 'order_block',
        timeframe: '1h',
        confidence: 0.8,
        conditions: {
          priceAction: {
            orderBlock: true,
            liquiditySweep: true
          },
          volume: {
            aboveAverage: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.80
      },
      {
        id: 'ict-fair-value-gap-bullish',
        name: 'ICT Bullish Fair Value Gap',
        description: 'ICT bullish fair value gap that needs to be filled',
        type: 'fair_value_gap',
        timeframe: '4h',
        confidence: 0.75,
        conditions: {
          priceAction: {
            fairValueGap: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.75
      },
      {
        id: 'ict-fair-value-gap-bearish',
        name: 'ICT Bearish Fair Value Gap',
        description: 'ICT bearish fair value gap that needs to be filled',
        type: 'fair_value_gap',
        timeframe: '4h',
        confidence: 0.75,
        conditions: {
          priceAction: {
            fairValueGap: true
          },
          marketStructure: {
            bearish: true
          }
        },
        expectedOutcome: 'SELL',
        successRate: 0.75
      },
      {
        id: 'ict-market-structure-bullish',
        name: 'ICT Bullish Market Structure',
        description: 'ICT bullish market structure break',
        type: 'market_structure',
        timeframe: '1d',
        confidence: 0.85,
        conditions: {
          priceAction: {
            marketStructure: true
          },
          volume: {
            spike: true
          },
          marketStructure: {
            bullish: true
          }
        },
        expectedOutcome: 'BUY',
        successRate: 0.85
      },
      {
        id: 'ict-market-structure-bearish',
        name: 'ICT Bearish Market Structure',
        description: 'ICT bearish market structure break',
        type: 'market_structure',
        timeframe: '1d',
        confidence: 0.85,
        conditions: {
          priceAction: {
            marketStructure: true
          },
          volume: {
            spike: true
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
   * Analyserar marknaden enligt ICT-principer
   */
  analyzeICTMarket(data: OHLCV[], index: number, timeframe: string): ICTMarketAnalysis {
    if (index < 50) {
      return this.getDefaultICTMarketAnalysis();
    }

    const key = `${timeframe}_${index}`;
    
    if (this.marketAnalyses[key]) {
      return this.marketAnalyses[key];
    }

    const analysis = this.calculateICTMarketAnalysis(data, index, timeframe);
    this.marketAnalyses[key] = analysis;
    
    return analysis;
  }

  /**
   * Genererar ICT-signaler baserat på marknadsanalys
   */
  generateICTSignals(data: OHLCV[], index: number, timeframe: string): ICTSignal[] {
    if (index < 50) return [];

    const signals: ICTSignal[] = [];
    const marketAnalysis = this.analyzeICTMarket(data, index, timeframe);

    // Generera signaler från alla ICT-mönster
    for (const pattern of this.patterns) {
      if (pattern.timeframe === timeframe || this.isTimeframeCompatible(timeframe, pattern.timeframe)) {
        const signal = this.generatePatternSignal(pattern, data, index, marketAnalysis);
        if (signal) {
          signals.push(signal);
        }
      }
    }

    // Sortera efter confidence och confluence
    return signals.sort((a, b) => (b.confidence * b.confluence) - (a.confidence * a.confluence));
  }

  /**
   * Beräknar ICT-marknadsanalys
   */
  private calculateICTMarketAnalysis(data: OHLCV[], index: number, timeframe: string): ICTMarketAnalysis {
    const currentTime = new Date(data[index].timestamp);
    const currentKillzone = this.getCurrentKillzone(currentTime);
    const currentSession = this.getCurrentSession(currentTime);
    
    const recentData = data.slice(Math.max(0, index - 100), index + 1);
    
    // Beräkna marknadsstruktur
    const marketStructure = this.calculateMarketStructure(recentData);
    
    // Hitta liquidity levels
    const liquidityLevels = this.findLiquidityLevels(recentData);
    
    // Hitta order blocks
    const orderBlocks = this.findOrderBlocks(recentData);
    
    // Hitta fair value gaps
    const fairValueGaps = this.findFairValueGaps(recentData);

    return {
      currentKillzone,
      currentSession,
      marketStructure,
      liquidityLevels,
      orderBlocks,
      fairValueGaps,
      lastUpdate: Date.now()
    };
  }

  /**
   * Hämtar aktuell killzone baserat på tid
   */
  private getCurrentKillzone(time: Date): 'london' | 'new_york' | 'asian' | 'none' {
    const hour = time.getUTCHours();
    
    if (hour >= this.KILLZONES.london.start && hour < this.KILLZONES.london.end) {
      return 'london';
    } else if (hour >= this.KILLZONES.new_york.start && hour < this.KILLZONES.new_york.end) {
      return 'new_york';
    } else if (hour >= this.KILLZONES.asian.start && hour < this.KILLZONES.asian.end) {
      return 'asian';
    }
    
    return 'none';
  }

  /**
   * Hämtar aktuell session baserat på tid
   */
  private getCurrentSession(time: Date): 'london_open' | 'new_york_open' | 'asian_session' | 'none' {
    const hour = time.getUTCHours();
    
    if (hour >= this.SESSIONS.london_open.start && hour < this.SESSIONS.london_open.end) {
      return 'london_open';
    } else if (hour >= this.SESSIONS.new_york_open.start && hour < this.SESSIONS.new_york_open.end) {
      return 'new_york_open';
    } else if (hour >= this.SESSIONS.asian_session.start && hour < this.SESSIONS.asian_session.end) {
      return 'asian_session';
    }
    
    return 'none';
  }

  /**
   * Beräknar marknadsstruktur
   */
  private calculateMarketStructure(data: OHLCV[]): 'bullish' | 'bearish' | 'ranging' {
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
   * Genererar signal från ett specifikt mönster
   */
  private generatePatternSignal(
    pattern: ICTPattern, 
    data: OHLCV[], 
    index: number, 
    marketAnalysis: ICTMarketAnalysis
  ): ICTSignal | null {
    if (!this.patternMatches(pattern, data, index, marketAnalysis)) {
      return null;
    }

    const currentPrice = data[index].close;
    const signalType = pattern.expectedOutcome;
    const confidence = pattern.confidence;
    const ictScore = pattern.successRate * 10;

    // Hitta matchande patterns
    const matchingPatterns = [pattern];
    const confluence = matchingPatterns.length;

    return {
      type: signalType,
      confidence,
      ict_score: ictScore,
      price: currentPrice,
      confluence,
      strategy: `ICT ${pattern.name}`,
      stopLoss: this.calculateStopLoss(currentPrice, signalType, marketAnalysis),
      takeProfit: this.calculateTakeProfit(currentPrice, signalType, marketAnalysis),
      reasoning: `ICT Pattern: ${pattern.name}, Killzone: ${marketAnalysis.currentKillzone}, Session: ${marketAnalysis.currentSession}`,
      patterns: matchingPatterns,
      killzone: marketAnalysis.currentKillzone,
      session: marketAnalysis.currentSession,
      marketStructure: marketAnalysis.marketStructure,
      liquidityLevels: marketAnalysis.liquidityLevels.recent,
      orderBlocks: this.formatOrderBlocks(marketAnalysis.orderBlocks),
      fairValueGaps: this.formatFairValueGaps(marketAnalysis.fairValueGaps)
    };
  }

  /**
   * Kontrollerar om ett mönster matchar
   */
  private patternMatches(
    pattern: ICTPattern, 
    data: OHLCV[], 
    index: number, 
    marketAnalysis: ICTMarketAnalysis
  ): boolean {
    const conditions = pattern.conditions;
    
    // Kontrollera time-based conditions
    if (conditions.timeBased) {
      if (conditions.timeBased.killzone && marketAnalysis.currentKillzone !== conditions.timeBased.killzone) {
        return false;
      }
      if (conditions.timeBased.session && marketAnalysis.currentSession !== conditions.timeBased.session) {
        return false;
      }
    }
    
    // Kontrollera price action
    if (conditions.priceAction) {
      if (conditions.priceAction.liquiditySweep && !this.isLiquiditySweep(data, index)) return false;
      if (conditions.priceAction.orderBlock && !this.isOrderBlock(data, index)) return false;
      if (conditions.priceAction.fairValueGap && !this.isFairValueGap(data, index)) return false;
      if (conditions.priceAction.marketStructure && !this.isMarketStructureBreak(data, index)) return false;
    }
    
    // Kontrollera volume
    if (conditions.volume) {
      const volumeRatio = this.calculateVolumeRatio(data, index, 20);
      if (conditions.volume.aboveAverage && volumeRatio <= 1.2) return false;
      if (conditions.volume.spike && volumeRatio <= 2.0) return false;
    }
    
    // Kontrollera market structure
    if (conditions.marketStructure) {
      if (conditions.marketStructure.bullish && marketAnalysis.marketStructure !== 'bullish') return false;
      if (conditions.marketStructure.bearish && marketAnalysis.marketStructure !== 'bearish') return false;
      if (conditions.marketStructure.ranging && marketAnalysis.marketStructure !== 'ranging') return false;
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

  private isLiquiditySweep(data: OHLCV[], index: number): boolean {
    if (index < 10) return false;
    
    const current = data[index];
    const recentLows = data.slice(index - 10, index).map(d => d.low);
    const recentHighs = data.slice(index - 10, index).map(d => d.high);
    
    const minLow = Math.min(...recentLows);
    const maxHigh = Math.max(...recentHighs);
    
    // Liquidity sweep: price sweeps beyond recent levels then reverses
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

  private isMarketStructureBreak(data: OHLCV[], index: number): boolean {
    if (index < 20) return false;
    
    const recent = data.slice(index - 10, index + 1);
    const previous = data.slice(index - 20, index - 10);
    
    const recentHigh = Math.max(...recent.map(d => d.high));
    const recentLow = Math.min(...recent.map(d => d.low));
    const previousHigh = Math.max(...previous.map(d => d.high));
    const previousLow = Math.min(...previous.map(d => d.low));
    
    return recentHigh > previousHigh || recentLow < previousLow;
  }

  private calculateVolumeRatio(data: OHLCV[], index: number, period: number): number {
    if (index < period) return 1;
    
    const currentVolume = data[index].volume;
    const avgVolume = data.slice(index - period + 1, index + 1)
      .reduce((sum, d) => sum + d.volume, 0) / period;
    
    return currentVolume / avgVolume;
  }

  private calculateStopLoss(price: number, signal: 'BUY' | 'SELL', marketAnalysis: ICTMarketAnalysis): number {
    const baseStop = 0.02; // 2% base stop
    const killzoneMultiplier = marketAnalysis.currentKillzone !== 'none' ? 0.8 : 1.0;
    const sessionMultiplier = marketAnalysis.currentSession !== 'none' ? 0.7 : 1.0;
    
    const stopPercentage = baseStop * killzoneMultiplier * sessionMultiplier;
    
    return signal === 'BUY' 
      ? price * (1 - stopPercentage)
      : price * (1 + stopPercentage);
  }

  private calculateTakeProfit(price: number, signal: 'BUY' | 'SELL', marketAnalysis: ICTMarketAnalysis): number {
    const baseProfit = 0.04; // 4% base profit
    const killzoneMultiplier = marketAnalysis.currentKillzone !== 'none' ? 1.2 : 1.0;
    const sessionMultiplier = marketAnalysis.currentSession !== 'none' ? 1.3 : 1.0;
    
    const profitPercentage = baseProfit * killzoneMultiplier * sessionMultiplier;
    
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

  private formatFairValueGaps(fairValueGaps: any): { start: number; end: number; type: 'bullish' | 'bearish' }[] {
    const formatted: { start: number; end: number; type: 'bullish' | 'bearish' }[] = [];
    
    fairValueGaps.bullish.forEach((gap: any) => {
      formatted.push({ start: gap.start, end: gap.end, type: 'bullish' });
    });
    
    fairValueGaps.bearish.forEach((gap: any) => {
      formatted.push({ start: gap.start, end: gap.end, type: 'bearish' });
    });
    
    return formatted;
  }

  private isTimeframeCompatible(current: string, pattern: string): boolean {
    const timeframes = ['15m', '1h', '4h', '1d'];
    const currentIndex = timeframes.indexOf(current);
    const patternIndex = timeframes.indexOf(pattern);
    
    return Math.abs(currentIndex - patternIndex) <= 1;
  }

  private getDefaultICTMarketAnalysis(): ICTMarketAnalysis {
    return {
      currentKillzone: 'none',
      currentSession: 'none',
      marketStructure: 'ranging',
      liquidityLevels: { high: [], low: [], recent: [] },
      orderBlocks: { bullish: [], bearish: [] },
      fairValueGaps: { bullish: [], bearish: [] },
      lastUpdate: Date.now()
    };
  }

  /**
   * Hämtar ICT-statistik
   */
  getICTStats(): { [key: string]: any } {
    return {
      patterns: this.patterns.length,
      marketAnalyses: Object.keys(this.marketAnalyses).length,
      lastAnalysis: this.isAnalyzing ? 'In Progress' : 'Completed',
      killzones: Object.keys(this.KILLZONES),
      sessions: Object.keys(this.SESSIONS)
    };
  }

  /**
   * Rensar gamla marknadsanalyser
   */
  cleanupOldAnalyses(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, analysis] of Object.entries(this.marketAnalyses)) {
      if (now - analysis.lastUpdate > maxAge) {
        delete this.marketAnalyses[key];
      }
    }
  }
}
