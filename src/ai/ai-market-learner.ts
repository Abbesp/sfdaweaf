export interface MarketPattern {
  id: string;
  name: string;
  description: string;
  confidence: number;
  timeframe: string;
  conditions: {
    rsi?: { min: number; max: number };
    macd?: { bullish: boolean; bearish: boolean };
    bollinger?: { position: 'upper' | 'middle' | 'lower' };
    volume?: { aboveAverage: boolean };
    priceAction?: { bullish: boolean; bearish: boolean };
  };
  expectedOutcome: 'BUY' | 'SELL' | 'HOLD';
  successRate: number;
}

export interface AISignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  ai_score: number;
  price: number;
  confluence: number;
  strategy: string;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  patterns: MarketPattern[];
}

export interface AIModel {
  id: string;
  name: string;
  type: 'trend_following' | 'mean_reversion' | 'volatility_based' | 'multi_timeframe';
  weights: number[];
  bias: number;
  learningRate: number;
  accuracy: number;
  lastUpdated: number;
}

export class AIMarketLearner {
  private models: { [key: string]: AIModel } = {};
  private patterns: MarketPattern[] = [];
  private trainingData: { features: number[]; labels: number[] }[] = [];
  private isTraining = false;

  constructor() {
    this.initializeModels();
    this.initializePatterns();
  }

  private initializeModels(): void {
    // Trend Following Model - Enhanced for 100 days
    this.models['trend-follower'] = {
      id: 'trend-follower',
      name: 'Trend Following AI',
      type: 'trend_following',
      weights: [0.3, 0.2, 0.2, 0.15, 0.15], // RSI, MACD, Bollinger, Volume, Price Action
      bias: 0.1,
      learningRate: 0.005, // Lower learning rate for 100 days stability
      accuracy: 0.65,
      lastUpdated: Date.now()
    };

    // Mean Reversion Model - Enhanced for 100 days
    this.models['mean-reversion'] = {
      id: 'mean-reversion',
      name: 'Mean Reversion AI',
      type: 'mean_reversion',
      weights: [0.4, 0.3, 0.2, 0.1], // RSI, Bollinger, Volume, Price Action
      bias: -0.05,
      learningRate: 0.008, // Lower learning rate for 100 days stability
      accuracy: 0.62,
      lastUpdated: Date.now()
    };

    // Volatility Based Model - Enhanced for 100 days
    this.models['volatility-based'] = {
      id: 'volatility-based',
      name: 'Volatility Based AI',
      type: 'volatility_based',
      weights: [0.25, 0.25, 0.25, 0.25], // ATR, Volume, Price Action, Bollinger
      bias: 0.0,
      learningRate: 0.01, // Lower learning rate for 100 days stability
      accuracy: 0.58,
      lastUpdated: Date.now()
    };

    // Multi Timeframe Model - Enhanced for 100 days
    this.models['multi-timeframe'] = {
      id: 'multi-timeframe',
      name: 'Multi Timeframe AI',
      type: 'multi_timeframe',
      weights: [0.2, 0.2, 0.2, 0.2, 0.2], // All indicators equally weighted
      bias: 0.05,
      learningRate: 0.006, // Lower learning rate for 100 days stability
      accuracy: 0.68,
      lastUpdated: Date.now()
    };
  }

  private initializePatterns(): void {
    this.patterns = [
      {
        id: 'trend-continuation',
        name: 'Trend Continuation',
        description: 'Price continuing in the direction of the trend',
        confidence: 0.75,
        timeframe: '1h',
        conditions: {
          rsi: { min: 30, max: 70 },
          macd: { bullish: true, bearish: false },
          volume: { aboveAverage: true }
        },
        expectedOutcome: 'BUY',
        successRate: 0.72
      },
      {
        id: 'mean-reversion',
        name: 'Mean Reversion',
        description: 'Price returning to average after extreme moves',
        confidence: 0.68,
        timeframe: '4h',
        conditions: {
          rsi: { min: 70, max: 100 },
          bollinger: { position: 'upper' },
          volume: { aboveAverage: false }
        },
        expectedOutcome: 'SELL',
        successRate: 0.65
      },
      {
        id: 'breakout',
        name: 'Breakout Pattern',
        description: 'Price breaking out of consolidation',
        confidence: 0.82,
        timeframe: '1h',
        conditions: {
          volume: { aboveAverage: true },
          priceAction: { bullish: true }
        },
        expectedOutcome: 'BUY',
        successRate: 0.78
      }
    ];
  }

  /**
   * Genererar AI-signaler baserat på marknadsdata
   */
  generateAISignals(data: any[], index: number): AISignal[] {
    if (index < 20) return [];

    const signals: AISignal[] = [];
    const currentPrice = data[index].close;

    // Generera signaler från alla AI-modeller
    for (const [modelId, model] of Object.entries(this.models)) {
      const signal = this.generateModelSignal(model, data, index, currentPrice);
      if (signal) {
        signals.push(signal);
      }
    }

    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Bestämmer optimal leverage baserat på AI-analys
   */
  determineOptimalLeverage(data: any[], index: number, symbol: string): number {
    if (index < 20) return 1;

    const currentPrice = data[index].close;
    const volatility = this.calculateVolatility(data, index);
    const trend = this.calculateTrend(data, index);
    const volume = this.calculateVolumeRatio(data, index);

    // Base leverage calculation
    let leverage = 1;

    // Volatility-based leverage adjustment
    if (volatility < 0.02) {
      leverage = 50; // High leverage for low volatility
    } else if (volatility < 0.05) {
      leverage = 25; // Medium leverage for medium volatility
    } else {
      leverage = 10; // Low leverage for high volatility
    }

    // Trend-based adjustment
    if (Math.abs(trend) > 0.1) {
      leverage = Math.min(leverage * 1.5, 50); // Increase leverage for strong trends
    }

    // Volume-based adjustment
    if (volume > 1.5) {
      leverage = Math.min(leverage * 1.2, 50); // Increase leverage for high volume
    }

    // Symbol-specific adjustments
    const symbolLower = symbol.toLowerCase();
    if (symbolLower.includes('doge') || symbolLower.includes('shib')) {
      leverage = Math.min(leverage, 30); // Limit leverage for meme coins
    }

    // Ensure leverage is within bounds
    leverage = Math.max(1, Math.min(leverage, 50));

    console.log(`🤖 AI determined leverage for ${symbol}: ${leverage}x (volatility: ${(volatility * 100).toFixed(2)}%, trend: ${(trend * 100).toFixed(2)}%, volume: ${volume.toFixed(2)})`);

    return leverage;
  }

  /**
   * Calculate market volatility
   */
  private calculateVolatility(data: any[], index: number): number {
    if (index < 10) return 0;

    const prices = data.slice(index - 10, index + 1).map(d => d.close);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate trend strength
   */
  private calculateTrend(data: any[], index: number): number {
    if (index < 20) return 0;

    const shortMA = this.calculateSMA(data, index, 5);
    const longMA = this.calculateSMA(data, index, 20);
    
    return (shortMA - longMA) / longMA;
  }

  /**
   * Genererar signal från en specifik AI-modell
   */
  private generateModelSignal(model: AIModel, data: any[], index: number, currentPrice: number): AISignal | null {
    const features = this.extractFeatures(data, index);
    const prediction = this.makePrediction(model, features);
    
    if (Math.abs(prediction) < 0.1) return null; // För svag signal

    const signalType = prediction > 0 ? 'BUY' : 'SELL';
    const confidence = Math.min(Math.abs(prediction), 0.95);
    const aiScore = model.accuracy * confidence;

    return {
      type: signalType,
      confidence,
      ai_score: aiScore,
      price: currentPrice,
      confluence: this.calculateConfluence(data, index),
      strategy: `AI ${model.name}`,
      stopLoss: this.calculateStopLoss(currentPrice, signalType),
      takeProfit: this.calculateTakeProfit(currentPrice, signalType),
      reasoning: `AI ${model.name} signal: ${signalType} with ${(confidence * 100).toFixed(1)}% confidence`,
      patterns: this.findMatchingPatterns(data, index)
    };
  }

  /**
   * Extraherar features från marknadsdata
   */
  private extractFeatures(data: any[], index: number): number[] {
    const features: number[] = [];
    
    // RSI (Relative Strength Index)
    const rsi = this.calculateRSI(data, index, 14);
    features.push(rsi / 100); // Normalisera till 0-1

    // MACD
    const macd = this.calculateMACD(data, index);
    features.push(macd);

    // Bollinger Bands position
    const bbPosition = this.calculateBollingerPosition(data, index);
    features.push(bbPosition);

    // Volume ratio
    const volumeRatio = this.calculateVolumeRatio(data, index);
    features.push(volumeRatio);

    // Price momentum
    const momentum = this.calculateMomentum(data, index);
    features.push(momentum);

    return features;
  }

  /**
   * Gör prediktion med AI-modell
   */
  private makePrediction(model: AIModel, features: number[]): number {
    if (features.length !== model.weights.length) return 0;

    let prediction = model.bias;
    for (let i = 0; i < features.length; i++) {
      prediction += features[i] * model.weights[i];
    }

    return Math.tanh(prediction); // Normalisera till -1 till 1
  }

  /**
   * Beräknar confluence (flera indikatorer som stödjer signalen)
   */
  private calculateConfluence(data: any[], index: number): number {
    let confluence = 0;
    let totalIndicators = 0;

    // RSI confluence
    const rsi = this.calculateRSI(data, index, 14);
    if (rsi < 30 || rsi > 70) {
      confluence += 0.3;
      totalIndicators++;
    }

    // Volume confluence
    const volumeRatio = this.calculateVolumeRatio(data, index);
    if (volumeRatio > 1.5) {
      confluence += 0.25;
      totalIndicators++;
    }

    // Price action confluence
    const momentum = this.calculateMomentum(data, index);
    if (Math.abs(momentum) > 0.02) {
      confluence += 0.25;
      totalIndicators++;
    }

    // MACD confluence
    const macd = this.calculateMACD(data, index);
    if (Math.abs(macd) > 0.01) {
      confluence += 0.2;
      totalIndicators++;
    }

    return totalIndicators > 0 ? confluence / totalIndicators : 0;
  }

  /**
   * Hittar matchande mönster
   */
  private findMatchingPatterns(data: any[], index: number): MarketPattern[] {
    const matchingPatterns: MarketPattern[] = [];

    for (const pattern of this.patterns) {
      if (this.patternMatches(pattern, data, index)) {
        matchingPatterns.push(pattern);
      }
    }

    return matchingPatterns;
  }

  /**
   * Kontrollerar om ett mönster matchar
   */
  private patternMatches(pattern: MarketPattern, data: any[], index: number): boolean {
    const conditions = pattern.conditions;
    
    if (conditions.rsi) {
      const rsi = this.calculateRSI(data, index, 14);
      if (rsi < conditions.rsi.min || rsi > conditions.rsi.max) return false;
    }

    if (conditions.macd) {
      const macd = this.calculateMACD(data, index);
      if (conditions.macd.bullish && macd <= 0) return false;
      if (conditions.macd.bearish && macd >= 0) return false;
    }

    if (conditions.volume) {
      const volumeRatio = this.calculateVolumeRatio(data, index);
      if (conditions.volume.aboveAverage && volumeRatio <= 1.2) return false;
    }

    return true;
  }

  /**
   * Beräknar RSI
   */
  private calculateRSI(data: any[], index: number, period: number): number {
    if (index < period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = index - period + 1; i <= index; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Beräknar MACD
   */
  private calculateMACD(data: any[], index: number): number {
    if (index < 26) return 0;

    const ema12 = this.calculateEMA(data, index, 12);
    const ema26 = this.calculateEMA(data, index, 26);
    
    return ema12 - ema26;
  }

  /**
   * Beräknar EMA (Exponential Moving Average)
   */
  private calculateEMA(data: any[], index: number, period: number): number {
    if (index < period - 1) return data[index].close;

    const multiplier = 2 / (period + 1);
    let ema = data[index - period + 1].close;

    for (let i = index - period + 2; i <= index; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Beräknar Bollinger Bands position
   */
  private calculateBollingerPosition(data: any[], index: number): number {
    if (index < 20) return 0.5;

    const sma = this.calculateSMA(data, index, 20);
    const stdDev = this.calculateStandardDeviation(data, index, 20);
    
    const upperBand = sma + (2 * stdDev);
    const lowerBand = sma - (2 * stdDev);
    
    const currentPrice = data[index].close;
    return (currentPrice - lowerBand) / (upperBand - lowerBand);
  }

  /**
   * Beräknar SMA (Simple Moving Average)
   */
  private calculateSMA(data: any[], index: number, period: number): number {
    if (index < period - 1) return data[index].close;

    let sum = 0;
    for (let i = index - period + 1; i <= index; i++) {
      sum += data[i].close;
    }

    return sum / period;
  }

  /**
   * Beräknar standardavvikelse
   */
  private calculateStandardDeviation(data: any[], index: number, period: number): number {
    if (index < period - 1) return 0;

    const sma = this.calculateSMA(data, index, period);
    let sum = 0;

    for (let i = index - period + 1; i <= index; i++) {
      sum += Math.pow(data[i].close - sma, 2);
    }

    return Math.sqrt(sum / period);
  }

  /**
   * Beräknar volume ratio
   */
  private calculateVolumeRatio(data: any[], index: number): number {
    if (index < 20) return 1;

    const currentVolume = data[index].volume;
    let avgVolume = 0;

    for (let i = index - 19; i <= index; i++) {
      avgVolume += data[i].volume;
    }
    avgVolume /= 20;

    return currentVolume / avgVolume;
  }

  /**
   * Beräknar momentum
   */
  private calculateMomentum(data: any[], index: number): number {
    if (index < 10) return 0;

    const currentPrice = data[index].close;
    const pastPrice = data[index - 10].close;
    
    return (currentPrice - pastPrice) / pastPrice;
  }

  /**
   * Beräknar stop loss
   */
  private calculateStopLoss(price: number, signal: 'BUY' | 'SELL'): number {
    const stopPercentage = 0.02; // 2%
    return signal === 'BUY' 
      ? price * (1 - stopPercentage)
      : price * (1 + stopPercentage);
  }

  /**
   * Beräknar take profit
   */
  private calculateTakeProfit(price: number, signal: 'BUY' | 'SELL'): number {
    const profitPercentage = 0.04; // 4%
    return signal === 'BUY'
      ? price * (1 + profitPercentage)
      : price * (1 - profitPercentage);
  }

  /**
   * Uppdaterar AI-modeller med ny data
   */
  async updateModels(data: any[], trades: any[]): Promise<void> {
    if (this.isTraining) return;

    this.isTraining = true;
    console.log('🤖 Updating AI models...');

    try {
      // Skapa träningsdata
      this.trainingData = this.generateTrainingData(data, trades);
      
      // Uppdatera varje modell
      for (const [modelId, model] of Object.entries(this.models)) {
        await this.updateModel(modelId, this.trainingData);
      }

      console.log('✅ AI models updated successfully');
    } catch (error) {
      console.error('❌ Error updating AI models:', error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Genererar träningsdata
   */
  private generateTrainingData(data: any[], trades: any[]): { features: number[]; labels: number[] }[] {
    const trainingData: { features: number[]; labels: number[] }[] = [];

    for (let i = 20; i < data.length; i++) {
      const features = this.extractFeatures(data, i);
      const label = this.generateLabel(data, i, trades);
      
      if (label !== null) {
        trainingData.push({ features, labels: [label] });
      }
    }

    return trainingData;
  }

  /**
   * Genererar labels för träning
   */
  private generateLabel(data: any[], index: number, trades: any[]): number | null {
    // Hitta närmaste trade efter denna index
    const futureTrades = trades.filter(t => t.entryTime >= data[index].timestamp);
    
    if (futureTrades.length === 0) return null;

    const nextTrade = futureTrades[0];
    const currentPrice = data[index].close;
    
    if (nextTrade.signal === 'BUY') {
      return nextTrade.exitPrice > currentPrice ? 1 : -1;
    } else {
      return nextTrade.exitPrice < currentPrice ? 1 : -1;
    }
  }

  /**
   * Uppdaterar en specifik modell
   */
  private async updateModel(modelId: string, trainingData: { features: number[]; labels: number[] }[]): Promise<void> {
    const model = this.models[modelId];
    if (!model) return;

    // Gradient descent träning
    const learningRate = model.learningRate;
    const epochs = 10;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;

      for (const sample of trainingData) {
        const prediction = this.makePrediction(model, sample.features);
        const target = sample.labels[0];
        
        // Beräkna loss
        const loss = Math.pow(prediction - target, 2);
        totalLoss += loss;

        // Uppdatera vikter (gradient descent)
        for (let i = 0; i < model.weights.length; i++) {
          const gradient = 2 * (prediction - target) * sample.features[i];
          model.weights[i] -= learningRate * gradient;
        }

        // Uppdatera bias
        const biasGradient = 2 * (prediction - target);
        model.bias -= learningRate * biasGradient;
      }

      // Uppdatera accuracy baserat på genomsnittlig loss
      const avgLoss = totalLoss / trainingData.length;
      model.accuracy = Math.max(0.5, 1 - avgLoss);
    }

    model.lastUpdated = Date.now();
  }

  /**
   * Hämtar modellstatistik
   */
  getModelStats(): { [key: string]: any } {
    const stats: { [key: string]: any } = {};
    
    for (const [modelId, model] of Object.entries(this.models)) {
      stats[modelId] = {
        name: model.name,
        accuracy: (model.accuracy * 100).toFixed(1),
        lastUpdated: new Date(model.lastUpdated).toLocaleString(),
        type: model.type
      };
    }

    return stats;
  }

  /**
   * Hämtar alla mönster
   */
  getPatterns(): MarketPattern[] {
    return [...this.patterns];
  }

  /**
   * Lägger till nytt mönster
   */
  addPattern(pattern: MarketPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Rensar gamla träningsdata
   */
  cleanupOldData(): void {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dagar
    const now = Date.now();
    
    this.trainingData = this.trainingData.filter(sample => {
      // Här kan vi lägga till logik för att filtrera gamla samples
      return true; // För nu behåller vi allt
    });
  }
}
