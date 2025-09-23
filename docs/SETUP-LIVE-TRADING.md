# 🚀 Live Trading Setup Guide

Detta guide visar hur du konfigurerar systemet för riktig handel med dina API-nycklar.

## 📋 Förutsättningar

1. **Exchange Accounts**: Skapa konton på [Binance](https://www.binance.com) och/eller [KuCoin](https://www.kucoin.com)
2. **API Keys**: Generera API-nycklar från valda exchanges
3. **Risk Management**: Förstå riskerna med live trading

## 🎯 KuCoin Integration (Redan Konfigurerat)

Dina KuCoin API-nycklar är redan konfigurerade i systemet:
- **API Key**: `6895a47528335c0001f6635a`
- **Secret Key**: `9acb62b6-ba6e-4eb7-8a63-d35115172829`
- **Passphrase**: `MegaGamer123`
- **Status**: ✅ Redo för live trading

## 🔑 API-nycklar Setup

### Steg 1: Skapa API-nycklar på Binance

1. Logga in på Binance
2. Gå till **Account** → **API Management**
3. Klicka **Create API**
4. Välj **Enable Trading** (viktigt!)
5. Spara din **API Key** och **Secret Key**

### Steg 2: Konfigurera miljövariabler

1. Kopiera `env.example` till `.env`:
```bash
cp env.example .env
```

2. Redigera `.env` filen:
```env
# Binance API Configuration
BINANCE_API_KEY=din_riktiga_api_key_här
BINANCE_SECRET_KEY=din_riktiga_secret_key_här
BINANCE_TESTNET=false

# Trading Configuration
MAX_POSITION_SIZE=1000
RISK_PER_TRADE=0.02
MAX_DAILY_LOSS=500
MAX_DAILY_TRADES=100
ENABLE_LIVE_TRADING=true
```

### Steg 3: Testa konfigurationen

```bash
# Kör testet för att verifiera API-nycklar
deno run --allow-net --allow-env live-trading-example.ts
```

## ⚠️ Säkerhetsåtgärder

### API-nycklar Säkerhet
- **ALDRIG** commita `.env` filen till Git
- Använd endast nödvändiga behörigheter på API-nycklar
- Aktivera IP-whitelist på Binance
- Använd testnet först för att testa

### Risk Management
- Sätt alltid stop-loss
- Begränsa position storlek
- Använd endast pengar du kan förlora
- Övervaka trades kontinuerligt

## 🎯 Live Trading Användning

### Grundläggande Setup

```typescript
import { TradingManager, LiveTradeConfig } from './index';

// Konfigurera trading parametrar
const config: LiveTradeConfig = {
  maxPositionSize: 1000,     // Max position storlek
  riskPerTrade: 0.02,        // 2% risk per trade
  maxDailyLoss: 500,         // Max daglig förlust
  maxDailyTrades: 100,       // Max trades per dag
  enableLiveTrading: true    // Aktivera live trading
};

// Skapa trading manager
const tradingManager = new TradingManager(config);

// Starta trading session
const session = await tradingManager.startTradingSession(
  'BTCUSDT',    // Symbol
  'swing',      // Strategy
  '1h'          // Timeframe
);
```

### Real-time Data Processing

```typescript
// Processera marknadsdata
await tradingManager.processMarketData(session.id, marketData);

// Hämta session statistik
const stats = tradingManager.getSessionStats(session.id);
console.log(`Win Rate: ${stats.winRate}%`);
```

## 📊 Övervakning

### Trading Statistics
```typescript
const stats = tradingManager.getTradingStats();
console.log('Active Sessions:', stats.activeSessions);
console.log('Daily Trades:', stats.dailyTrades);
console.log('Testnet Mode:', stats.isTestnet);
```

### Session Management
```typescript
// Pausa session
tradingManager.pauseTradingSession(sessionId);

// Återuppta session
tradingManager.resumeTradingSession(sessionId);

// Stoppa session
await tradingManager.stopTradingSession(sessionId);
```

## 🔧 Avancerad Konfiguration

### Anpassade Risk Parametrar

```typescript
const advancedConfig: LiveTradeConfig = {
  maxPositionSize: 5000,      // Större positioner
  riskPerTrade: 0.01,         // Mindre risk per trade
  maxDailyLoss: 1000,         // Högre daglig förlustgräns
  maxDailyTrades: 50,         // Färre trades per dag
  enableLiveTrading: true
};
```

### Multi-Exchange Support

```typescript
// Framtida utökning för fler exchanges
const multiExchangeConfig = {
  binance: {
    apiKey: 'binance_key',
    secretKey: 'binance_secret',
    testnet: false
  },
  bybit: {
    apiKey: 'bybit_key',
    secretKey: 'bybit_secret',
    testnet: true
  }
};
```

## 🚨 Viktiga Varningar

### ⚠️ Live Trading Risks
- **Du kan förlora pengar** - Använd endast riskkapital
- **Marknaden är volatil** - Priser kan ändras snabbt
- **Tekniska fel** - Systemet kan ha buggar
- **API begränsningar** - Exchanges har rate limits

### 🛡️ Säkerhetschecklista
- [ ] API-nycklar är säkra och inte committade
- [ ] Testnet testning är genomförd
- [ ] Risk management är konfigurerat
- [ ] Stop-loss är aktiverat
- [ ] Position storlek är begränsad
- [ ] Övervakning är på plats

## 📞 Support

Om du stöter på problem:

1. **Kontrollera API-nycklar** - Verifiera att de fungerar
2. **Testa på testnet** - Använd testnet först
3. **Kontrollera logs** - Läs felmeddelanden noggrant
4. **Kontakta support** - Öppna en issue på GitHub

## 🎯 Nästa Steg

1. **Testa på testnet** - Kör systemet på testnet först
2. **Starta små** - Börja med små positioner
3. **Övervaka noga** - Håll koll på alla trades
4. **Skala upp** - Öka positioner gradvis
5. **Optimera** - Justera parametrar baserat på resultat

---

**OBS**: Detta system är för avancerade användare. Se till att du förstår riskerna innan du börjar live trading.
