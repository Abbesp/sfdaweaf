import { APIConfigManager } from './src/config/api-config';

// Use Deno's built-in crypto for HMAC
const createHmac = (algorithm: string, key: string) => {
  return {
    update: (data: string) => {
      return {
        digest: async (encoding: string): Promise<string> => {
          const encoder = new TextEncoder();
          const keyData = encoder.encode(key);
          const dataBytes = encoder.encode(data);
          
          const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          
          const result = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
          const hashArray = new Uint8Array(result);
          
          if (encoding === 'base64') {
            return btoa(String.fromCharCode(...hashArray));
          } else if (encoding === 'hex') {
            return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
          }
          return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      };
    }
  };
};

async function checkBalance() {
  console.log('🔍 Checking KuCoin Account Balance...');
  
  const apiConfig = APIConfigManager.getInstance();
  const kucoinConfig = apiConfig.getKucoinConfig();
  
  try {
    const endpoint = '/api/v1/accounts';
    const timestamp = Date.now();
    const signature = await createHmac('sha256', kucoinConfig.secretKey).update(timestamp + 'GET' + endpoint + '').digest('base64');
    
    const encryptedPassphrase = await createHmac('sha256', kucoinConfig.secretKey).update(kucoinConfig.passphrase).digest('base64');
    
    const response = await fetch(`${kucoinConfig.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'KC-API-KEY': kucoinConfig.apiKey,
        'KC-API-SIGN': signature,
        'KC-API-TIMESTAMP': timestamp.toString(),
        'KC-API-PASSPHRASE': encryptedPassphrase,
        'KC-API-KEY-VERSION': '2',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('📊 API Response Status:', response.status);
      console.log('📊 API Response Code:', result.code);
      
      if (result.code === '200000' && result.data) {
        console.log('\n💰 All Account Balances:');
        let totalUSDT = 0;
        
        result.data.forEach((account: any) => {
          if (parseFloat(account.available) > 0 || parseFloat(account.balance) > 0) {
            console.log(`   ${account.currency}: ${account.balance} (Available: ${account.available}, Type: ${account.type})`);
            
            if (account.currency === 'USDT') {
              totalUSDT += parseFloat(account.available || '0');
            }
          }
        });
        
        console.log(`\n💵 Total USDT Available: $${totalUSDT.toFixed(2)}`);
        
        if (totalUSDT >= 0.1) {
          console.log('✅ You have enough USDT to trade!');
        } else {
          console.log('❌ Not enough USDT to trade (need at least $0.1)');
        }
      } else {
        console.log('❌ API Error:', result.msg || 'Unknown error');
      }
    } else {
      console.log('❌ HTTP Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBalance();
