/**
 * Telegram Service for sending trading notifications
 */

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private enabled: boolean;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.enabled = botToken && chatId ? true : false;
    
    if (this.enabled) {
      console.log('✅ Telegram service initialized');
    } else {
      console.log('⚠️  Telegram service disabled - missing token or chat ID');
    }
  }

  async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    if (!this.enabled) {
      console.log('📱 Telegram disabled - message not sent:', text);
      return false;
    }

    try {
      const message: TelegramMessage = {
        chat_id: this.chatId,
        text: text,
        parse_mode: parseMode
      };

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        console.log('✅ Telegram message sent successfully');
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Telegram API error:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Telegram send failed:', error);
      return false;
    }
  }

  async sendTradeNotification(tradeData: {
    type: 'BUY' | 'SELL';
    symbol: string;
    price: number;
    quantity: number;
    value: number;
    reason?: string;
  }): Promise<boolean> {
    const emoji = tradeData.type === 'BUY' ? '🟢' : '🔴';
    const action = tradeData.type === 'BUY' ? 'KÖPT' : 'SÅLT';
    
    const message = `
${emoji} <b>${action} ${tradeData.symbol}</b>

💰 <b>Pris:</b> $${tradeData.price.toFixed(6)}
📊 <b>Antal:</b> ${tradeData.quantity.toFixed(2)}
💵 <b>Värde:</b> $${tradeData.value.toFixed(2)}
${tradeData.reason ? `📝 <b>Anledning:</b> ${tradeData.reason}` : ''}

⏰ <b>Tid:</b> ${new Date().toLocaleString('sv-SE')}
    `.trim();

    return await this.sendMessage(message);
  }

  async sendErrorNotification(error: string, context?: string): Promise<boolean> {
    const message = `
🚨 <b>TRADING ERROR</b>

❌ <b>Fel:</b> ${error}
${context ? `📍 <b>Kontext:</b> ${context}` : ''}

⏰ <b>Tid:</b> ${new Date().toLocaleString('sv-SE')}
    `.trim();

    return await this.sendMessage(message);
  }

  async sendStatusUpdate(status: string, details?: string): Promise<boolean> {
    const message = `
📊 <b>BOT STATUS</b>

${status}
${details ? `\n${details}` : ''}

⏰ <b>Tid:</b> ${new Date().toLocaleString('sv-SE')}
    `.trim();

    return await this.sendMessage(message);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
