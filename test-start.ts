// Test start function
import { SpotTradingBot } from './spot-trading-bot';

console.log('Testing SpotTradingBot start...');

const bot = new SpotTradingBot();
console.log('✅ Bot created');

bot.start().then(() => {
  console.log('✅ Bot started successfully');
}).catch((error) => {
  console.error('❌ Bot start error:', error);
});
