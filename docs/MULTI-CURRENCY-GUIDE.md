# 🚀 Multi-Currency AI Trading Guide

Detta guide förklarar det nya multi-currency trading systemet med AI-determined leverage.

## 🎯 **System Översikt**

### **10 Stödda Valutor:**
1. **DOGE-USDT** - Dogecoin (Min: 0.1 USDT, Max Leverage: 50x)
2. **SHIB-USDT** - Shiba Inu (Min: 0.1 USDT, Max Leverage: 50x)
3. **PEPE-USDT** - Pepe (Min: 0.1 USDT, Max Leverage: 50x)
4. **FLOKI-USDT** - Floki (Min: 0.1 USDT, Max Leverage: 50x)
5. **BONK-USDT** - Bonk (Min: 0.1 USDT, Max Leverage: 50x)
6. **WIF-USDT** - Dogwifhat (Min: 0.1 USDT, Max Leverage: 50x)
7. **BOME-USDT** - Book of Meme (Min: 0.1 USDT, Max Leverage: 50x)
8. **MYRO-USDT** - Myro (Min: 0.1 USDT, Max Leverage: 50x)
9. **POPCAT-USDT** - Popcat (Min: 0.1 USDT, Max Leverage: 50x)
10. **MEW-USDT** - Cat in a Dogs World (Min: 0.1 USDT, Max Leverage: 50x)

### **AI-Determined Leverage:**
- **Låg Volatilitet** (< 2%): 50x leverage
- **Medium Volatilitet** (2-5%): 25x leverage
- **Hög Volatilitet** (> 5%): 10x leverage
- **Stark Trend**: +50% leverage boost
- **Hög Volym**: +20% leverage boost
- **Meme Coins**: Max 30x leverage

## 💰 **Trading Konfiguration**

### **Position Sizing:**
```
1 USDT × AI Leverage = Trading Power
```

**Exempel:**
- DOGE: 1 USDT × 25x = 25 USDT trading power
- SHIB: 1 USDT × 10x = 10 USDT trading power
- PEPE: 1 USDT × 50x = 50 USDT trading power

### **Risk Management:**
- **Risk per Trade**: 1 USDT
- **Max Daily Loss**: 50 USDT
- **Max Daily Trades**: 100
- **Position Size**: 1 USDT (med leverage)

## 🤖 **AI Leverage Logic**

### **Volatilitet-baserad Leverage:**
```typescript
if (volatility < 0.02) {
  leverage = 50; // Hög leverage för låg volatilitet
} else if (volatility < 0.05) {
  leverage = 25; // Medium leverage för medium volatilitet
} else {
  leverage = 10; // Låg leverage för hög volatilitet
}
```

### **Trend-baserad Justering:**
```typescript
if (Math.abs(trend) > 0.1) {
  leverage = Math.min(leverage * 1.5, 50); // Öka leverage för starka trender
}
```

### **Volym-baserad Justering:**
```typescript
if (volume > 1.5) {
  leverage = Math.min(leverage * 1.2, 50); // Öka leverage för hög volym
}
```

## 🚀 **Körning**

### **Multi-Currency Trading:**
```bash
# Kör multi-currency AI trading
deno run --allow-net --allow-env --sloppy-imports multi-currency-trading-example.ts
```

### **Testresultat:**
```
✅ Started 10 trading sessions
💰 Trade calculation for DOGE-USDT: 1 USDT × 25x leverage = 25 USDT trading power
🤖 AI determined leverage for SHIB-USDT: 10x (volatility: 8.5%, trend: 2.1%, volume: 1.2)
📈 Current prices:
   DOGE-USDT: $0.217150
   SHIB-USDT: $0.000012
   PEPE-USDT: $0.000010
   FLOKI-USDT: $0.000092
   BONK-USDT: $0.000020
   WIF-USDT: $0.812800
   BOME-USDT: $0.001916
   MYRO-USDT: $0.022190
   POPCAT-USDT: $0.250000
   MEW-USDT: $0.002759
```

## 📊 **Trading Sessions**

### **Session Management:**
- **10 Aktiva Sessions**: En per valuta
- **AI Signal Generation**: Per valuta
- **Leverage Optimization**: Per valuta
- **Risk Management**: Global

### **Session Statistics:**
```
📊 Trading Session Statistics:
   DOGE-USDT: 0 trades, 0% win rate
   SHIB-USDT: 0 trades, 0% win rate
   PEPE-USDT: 0 trades, 0% win rate
   ...
```

## ⚠️ **Risk Warnings**

### **Leverage Risks:**
- **50x leverage är EXTREMT riskabelt**
- **Meme coins är mycket volatila**
- **Små prisrörelser kan förstöra positioner**
- **Du kan förlora allt på en enda trade**

### **Multi-Currency Risks:**
- **10 valutor = 10x risk exponering**
- **Korrelation mellan valutor**
- **Liquidity risk på mindre valutor**
- **API rate limits**

## 🛡️ **Säkerhetsåtgärder**

### **Position Limits:**
- Max 1 USDT per trade
- Max 50 USDT daglig förlust
- Max 100 trades per dag
- AI-determined leverage limits

### **Currency Limits:**
- Min order value: 0.1 USDT
- Max leverage: 50x per valuta
- Meme coin leverage cap: 30x
- Volatility-based adjustments

## 🎯 **Best Practices**

### ✅ **Gör:**
- Starta med små belopp
- Övervaka AI leverage beslut
- Diversifiera över valutor
- Sätt stop-loss
- Håll känslorna under kontroll

### ❌ **Gör inte:**
- Öka position storlek
- Ignorera AI leverage warnings
- Handla utan stop-loss
- Följa FOMO
- Handla med pengar du inte kan förlora

## 📈 **Performance Tracking**

### **Metrics att övervaka:**
- **AI Leverage Decisions**: Per valuta
- **Win Rate**: Per valuta och totalt
- **Volatility Analysis**: AI accuracy
- **Risk-Adjusted Returns**: Sharpe ratio
- **Drawdown**: Max och current

### **AI Performance:**
- **Leverage Accuracy**: Hur väl AI förutspår optimal leverage
- **Signal Quality**: AI signal precision
- **Risk Management**: AI risk assessment
- **Market Adaptation**: AI learning progress

## 🔧 **Konfiguration**

### **Environment Variables:**
```env
MAX_POSITION_SIZE=1.0
RISK_PER_TRADE=1.0
MAX_DAILY_LOSS=50
MAX_DAILY_TRADES=100
LEVERAGE=50
ENABLE_LIVE_TRADING=true
```

### **Currency Configuration:**
```typescript
const currencies = [
  { symbol: 'DOGE-USDT', minOrderValue: 0.1, maxLeverage: 50 },
  { symbol: 'SHIB-USDT', minOrderValue: 0.1, maxLeverage: 50 },
  // ... 8 more currencies
];
```

## 🚨 **Emergency Procedures**

### **Om något går fel:**
1. **Stoppa alla sessions** omedelbart
2. **Kontrollera positioner** på KuCoin
3. **Stäng riskabla positioner** manuellt
4. **Analysera AI leverage beslut**
5. **Kontakta support** om nödvändigt

## 📞 **Support**

För frågor eller problem:
- Kontrollera logs för AI leverage beslut
- Verifiera currency konfiguration
- Kontrollera API permissions
- Öppna issue på GitHub

---

**OBS**: Multi-currency trading med AI-determined leverage är extremt riskabelt. Använd endast riskkapital och förstå att du kan förlora allt på en enda trade.
