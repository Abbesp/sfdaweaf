// Test imports
import { APIConfigManager } from './src/config/api-config';
import { currencyManager } from './src/config/currency-config';
import { MasterStrategy } from './src/strategies/master-strategy';

console.log('Testing imports...');

try {
  const apiConfig = APIConfigManager.getInstance();
  console.log('✅ APIConfigManager imported');
  
  const currencies = currencyManager.getAllCurrencies();
  console.log(`✅ CurrencyManager imported, found ${currencies.length} currencies`);
  
  const masterStrategy = new MasterStrategy();
  console.log('✅ MasterStrategy imported');
  
  console.log('✅ All imports successful!');
} catch (error) {
  console.error('❌ Import error:', error);
}
