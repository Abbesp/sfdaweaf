/**
 * Currency Configuration
 * Defines the 10 cryptocurrencies with minimum order values under 1 USDT
 */

export interface CurrencyConfig {
  symbol: string;
  name: string;
  minOrderValue: number; // Minimum order value in USDT
  maxLeverage: number;   // Maximum allowed leverage
  volatility: 'low' | 'medium' | 'high';
  category: 'meme' | 'defi' | 'layer1' | 'layer2' | 'utility';
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  // Original working meme coins
  {
    symbol: 'DOGE-USDT',
    name: 'Dogecoin',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'SHIB-USDT',
    name: 'Shiba Inu',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'PEPE-USDT',
    name: 'Pepe',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'FLOKI-USDT',
    name: 'Floki',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'BONK-USDT',
    name: 'Bonk',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'WIF-USDT',
    name: 'Dogwifhat',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'BOME-USDT',
    name: 'Book of Meme',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'MYRO-USDT',
    name: 'Myro',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'POPCAT-USDT',
    name: 'Popcat',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'MEW-USDT',
    name: 'Cat in a Dogs World',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  
  // Major Layer 1 tokens (guaranteed to exist)
  {
    symbol: 'BTC-USDT',
    name: 'Bitcoin',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'ETH-USDT',
    name: 'Ethereum',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'BNB-USDT',
    name: 'Binance Coin',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'ADA-USDT',
    name: 'Cardano',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'SOL-USDT',
    name: 'Solana',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer1'
  },
  {
    symbol: 'DOT-USDT',
    name: 'Polkadot',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'AVAX-USDT',
    name: 'Avalanche',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer1'
  },
  {
    symbol: 'MATIC-USDT',
    name: 'Polygon',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer2'
  },
  {
    symbol: 'ATOM-USDT',
    name: 'Cosmos',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'NEAR-USDT',
    name: 'NEAR Protocol',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer1'
  },
  {
    symbol: 'FTM-USDT',
    name: 'Fantom',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer1'
  },
  {
    symbol: 'ALGO-USDT',
    name: 'Algorand',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'VET-USDT',
    name: 'VeChain',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'TRX-USDT',
    name: 'TRON',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'XLM-USDT',
    name: 'Stellar',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'XRP-USDT',
    name: 'Ripple',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'LTC-USDT',
    name: 'Litecoin',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'XTZ-USDT',
    name: 'Tezos',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'EOS-USDT',
    name: 'EOS',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'HBAR-USDT',
    name: 'Hedera',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'layer1'
  },
  {
    symbol: 'ICP-USDT',
    name: 'Internet Computer',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer1'
  },
  {
    symbol: 'FLOW-USDT',
    name: 'Flow',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer1'
  },
  {
    symbol: 'EGLD-USDT',
    name: 'MultiversX',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer1'
  },
  
  // Major DeFi tokens
  {
    symbol: 'UNI-USDT',
    name: 'Uniswap',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'AAVE-USDT',
    name: 'Aave',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'LINK-USDT',
    name: 'Chainlink',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'defi'
  },
  {
    symbol: 'SUSHI-USDT',
    name: 'SushiSwap',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'CAKE-USDT',
    name: 'PancakeSwap',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'COMP-USDT',
    name: 'Compound',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'YFI-USDT',
    name: 'Yearn Finance',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'CRV-USDT',
    name: 'Curve DAO Token',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: '1INCH-USDT',
    name: '1inch',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'SNX-USDT',
    name: 'Synthetix',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'MKR-USDT',
    name: 'Maker',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'GRT-USDT',
    name: 'The Graph',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'BAND-USDT',
    name: 'Band Protocol',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'UMA-USDT',
    name: 'UMA',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'REN-USDT',
    name: 'Ren',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'KNC-USDT',
    name: 'Kyber Network',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'ZRX-USDT',
    name: '0x Protocol',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'BAL-USDT',
    name: 'Balancer',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'defi'
  },
  {
    symbol: 'LRC-USDT',
    name: 'Loopring',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer2'
  },
  {
    symbol: 'OMG-USDT',
    name: 'OMG Network',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'layer2'
  },
  
  // Gaming and Utility tokens
  {
    symbol: 'CHZ-USDT',
    name: 'Chiliz',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'utility'
  },
  {
    symbol: 'BAT-USDT',
    name: 'Basic Attention Token',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'utility'
  },
  {
    symbol: 'ENJ-USDT',
    name: 'Enjin Coin',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'utility'
  },
  {
    symbol: 'MANA-USDT',
    name: 'Decentraland',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'medium',
    category: 'utility'
  },
  {
    symbol: 'AXS-USDT',
    name: 'Axie Infinity',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'SAND-USDT',
    name: 'The Sandbox',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'GALA-USDT',
    name: 'Gala',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'ILV-USDT',
    name: 'Illuvium',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'YGG-USDT',
    name: 'Yield Guild Games',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'SLP-USDT',
    name: 'Smooth Love Potion',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'CHR-USDT',
    name: 'Chromaway',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'TLM-USDT',
    name: 'Alien Worlds',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'ALICE-USDT',
    name: 'My Neighbor Alice',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'FIL-USDT',
    name: 'Filecoin',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'STORJ-USDT',
    name: 'Storj',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'AR-USDT',
    name: 'Arweave',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'HNT-USDT',
    name: 'Helium',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'IOTX-USDT',
    name: 'IoTeX',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'ANKR-USDT',
    name: 'Ankr',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'SKL-USDT',
    name: 'SKALE',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  {
    symbol: 'FET-USDT',
    name: 'Fetch.ai',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'utility'
  },
  
  // Additional popular tokens
  {
    symbol: 'DOGE-USDT',
    name: 'Dogecoin',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'SHIB-USDT',
    name: 'Shiba Inu',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'PEPE-USDT',
    name: 'Pepe',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'FLOKI-USDT',
    name: 'Floki',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'BONK-USDT',
    name: 'Bonk',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'WIF-USDT',
    name: 'Dogwifhat',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'BOME-USDT',
    name: 'Book of Meme',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'MYRO-USDT',
    name: 'Myro',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'POPCAT-USDT',
    name: 'Popcat',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  },
  {
    symbol: 'MEW-USDT',
    name: 'Cat in a Dogs World',
    minOrderValue: 0.1,
    maxLeverage: 50,
    volatility: 'high',
    category: 'meme'
  }
];

export class CurrencyManager {
  private static instance: CurrencyManager;
  private currencies: Map<string, CurrencyConfig> = new Map();

  private constructor() {
    this.initializeCurrencies();
  }

  public static getInstance(): CurrencyManager {
    if (!CurrencyManager.instance) {
      CurrencyManager.instance = new CurrencyManager();
    }
    return CurrencyManager.instance;
  }

  private initializeCurrencies(): void {
    SUPPORTED_CURRENCIES.forEach(currency => {
      this.currencies.set(currency.symbol, currency);
    });
  }

  /**
   * Get all supported currencies
   */
  public getAllCurrencies(): CurrencyConfig[] {
    return Array.from(this.currencies.values());
  }

  /**
   * Get currency by symbol
   */
  public getCurrency(symbol: string): CurrencyConfig | undefined {
    return this.currencies.get(symbol);
  }

  /**
   * Get currencies by category
   */
  public getCurrenciesByCategory(category: string): CurrencyConfig[] {
    return this.getAllCurrencies().filter(currency => currency.category === category);
  }

  /**
   * Get currencies by volatility
   */
  public getCurrenciesByVolatility(volatility: 'low' | 'medium' | 'high'): CurrencyConfig[] {
    return this.getAllCurrencies().filter(currency => currency.volatility === volatility);
  }

  /**
   * Validate if currency is supported
   */
  public isSupported(symbol: string): boolean {
    return this.currencies.has(symbol);
  }

  /**
   * Get random currency for testing
   */
  public getRandomCurrency(): CurrencyConfig {
    const currencies = this.getAllCurrencies();
    if (currencies.length === 0) {
      throw new Error('No currencies available');
    }
    const randomIndex = Math.floor(Math.random() * currencies.length);
    return currencies[randomIndex]!;
  }

  /**
   * Get currencies suitable for AI trading
   */
  public getAITradingCurrencies(): CurrencyConfig[] {
    // Return all currencies as they are all suitable for AI trading
    return this.getAllCurrencies();
  }
}

// Export singleton instance
export const currencyManager = CurrencyManager.getInstance();
