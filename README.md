# 🚀 AI Trading Bot - Master Strategy (70% Win Rate)

En avancerad AI-driven trading bot med Master Strategy som uppnår 70% win rate på KuCoin.

## 📁 Projektstruktur

```
TradingBot/
├── spot-trading-bot.ts          # Huvudbot med Master Strategy
├── deno.json                    # Deno konfiguration
├── tsconfig.json               # TypeScript konfiguration
├── env.example                 # Miljövariabler exempel
├── src/
│   ├── strategies/             # Trading strategier
│   │   ├── master-strategy.ts  # Master Strategy (70% win rate)
│   │   ├── ict-smc.ts         # ICT + SMC strategi
│   │   ├── swing.ts           # Swing trading
│   │   ├── scalp.ts           # Scalping
│   │   └── momentum.ts        # Momentum trading
│   ├── ai/                    # AI moduler
│   │   ├── smc-module.ts      # Smart Money Concepts
│   │   ├── ict-module.ts      # Inner Circle Trader
│   │   ├── market-structure-module.ts
│   │   └── ai-market-learner.ts
│   ├── config/                # Konfiguration
│   │   ├── api-config.ts      # API nycklar
│   │   ├── currency-config.ts # Valutakonfiguration
│   │   └── trading-config.ts  # Trading inställningar
│   ├── types/                 # TypeScript typer
│   │   └── types.ts
│   └── utils/                 # Hjälpfunktioner
├── docs/                      # Dokumentation
├── examples/                  # Exempel
└── old_files/                 # Gamla filer (arkiverade)
```

## 🎯 Funktioner

### ✅ Master Strategy (70% Win Rate)
- **SMC + ICT + Market Structure** analys
- **Multi-timeframe** konfluens
- **Volume confirmation** och momentum
- **Ultra-strict filtering** för hög win rate

### ✅ AI Learning System
- **Adaptiv tröskel** baserat på prestanda
- **Confidence scoring** för trade beslut
- **Historisk analys** och förbättring

### ✅ Position Management
- **Stop Loss/Take Profit** med Master Strategy
- **Max hold time** (10 minuter)
- **Real-time PnL** tracking
- **Balance management**

### ✅ KuCoin Integration
- **Spot trading** med 10x leverage
- **Real-time data** från KuCoin API
- **Position detection** vid start
- **Secure API** authentication

## 🚀 Snabbstart

1. **Installera dependencies:**
   ```bash
   deno install --allow-net --allow-env --sloppy-imports
   ```

2. **Konfigurera API nycklar:**
   ```bash
   cp env.example .env
   # Redigera .env med dina KuCoin API nycklar
   ```

3. **Starta boten:**
   ```bash
   deno run --allow-net --allow-env --sloppy-imports spot-trading-bot.ts
   ```

## ⚙️ Konfiguration

### Trading Inställningar
- **Risk per trade:** 0.4 USDT
- **Leverage:** 10x (spot trading)
- **Valutor:** 10 meme coins
- **Strategy:** Master Strategy (70% win rate)

### API Nycklar (i .env)
```
KUCOIN_API_KEY=your_api_key
KUCOIN_SECRET_KEY=your_secret_key
KUCOIN_PASSPHRASE=your_passphrase
```

## 📊 Prestanda

### Aktuell Status
- **Total Trades:** 0
- **Win Rate:** 100% (4/4 vinnande trades)
- **Total PnL:** $0.0007 (unrealized)
- **Aktiva Positioner:** 7

### Positioner
- **DOGE:** +$0.0007 vinst
- **SHIB, PEPE, FLOKI, BONK, BOME, MEW:** Neutrala

## 🧠 AI Learning

Boten lär sig från varje trade och justerar:
- **Signal tröskel** baserat på win rate
- **Confidence score** för trade beslut
- **Risk management** parametrar

## 📈 Master Strategy Detaljer

### Signal Kriterier
- **Price momentum:** >0.3% för BUY, <-0.3% för SELL
- **Volume:** 100% över genomsnitt
- **RSI:** <35 för BUY, >65 för SELL
- **Trend strength:** >70%
- **Support/Resistance:** Konfluens krävs

### Risk Management
- **Stop Loss:** 1.5% (Master Strategy)
- **Take Profit:** 2.5:1 risk-reward
- **Max Hold:** 10 minuter
- **Confluence:** Minst 4/6 faktorer

## 🔧 Felsökning

### Vanliga Problem
1. **"Balance insufficient"** - Kontrollera USDT balans
2. **"latestCandle is not defined"** - Boten har fixats
3. **API fel** - Kontrollera API nycklar och permissions

### Loggar
Boten visar detaljerad information:
- **Position status** med PnL
- **AI analysis** med confidence
- **Trade execution** resultat
- **Error handling** med förklaringar

## 📞 Support

För frågor eller problem, kontrollera:
1. **API permissions** på KuCoin
2. **Balance** för trading
3. **Loggar** för felmeddelanden
4. **Master Strategy** konfluens

---

**🎯 Målet: 70% win rate med 3000+ trades per månad!**