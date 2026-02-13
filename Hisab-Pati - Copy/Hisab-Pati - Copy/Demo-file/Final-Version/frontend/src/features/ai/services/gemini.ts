
import { GoogleGenAI } from "@google/genai";
import { Account, Transaction } from "../../../core/types";
import { isOnline } from "../../../utils/networkService";
import { APP_CONFIG } from '../../../../../../shared/constants';

/**
 * Get AI-powered financial advice
 * ✅ Offline-safe: Returns fallback advice when offline
 * ✅ Timeout-safe: Uses try/catch with online detection
 * 
 * @param accounts - Array of accounts
 * @param transactions - Array of transactions
 * @returns Promise<string> - AI-generated advice or fallback message
 */
export const getFinancialAdvice = async (accounts: Account[], transactions: Transaction[]): Promise<string> => {
  // ✅ FIX: Check network before attempting API call
  if (!isOnline()) {
    console.warn('⚠️ Offline mode: Returning cached financial advice');
    return generateOfflineAdvice(accounts, transactions);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GOOGLE_API_KEY || process.env.API_KEY });

    const accountSummary = accounts.map(a => `${a.name} (${a.type}): ৳${a.balance.toLocaleString()}`).join('\n');
    const recentTransactions = transactions.slice(-5).map(t => `${t.date}: ${t.description}`).join('\n');

    const prompt = `
      As a professional financial advisor, analyze these accounts:
      ${accountSummary}
      
      Recent activities:
      ${recentTransactions}
      
      Provide a 3-sentence summary of the business health and one actionable advice.
    `;

    const response = await Promise.race([
      // Actual API call
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a concise financial consultant for small businesses. Focus on liquidity, profit, and debt management."
        }
      }),
      // Timeout: 10 seconds max
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API request timeout')), 10000)
      )
    ]);

    return (response as any).text || 'Could not generate financial advice.';
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn("❌ Gemini API error:", errorMsg);

    // ✅ FIX: Graceful fallback with local analysis
    return generateOfflineAdvice(accounts, transactions);
  }
};

/**
 * Generate basic financial advice using local data (no API needed)
 * Used when offline or when API fails
 * ✅ No network dependency
 * ✅ Instant response
 */
function generateOfflineAdvice(accounts: Account[], transactions: Transaction[]): string {
  try {
    // Calculate basic metrics
    const assets = accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0);
    const liabilities = accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0);
    const income = accounts.filter(a => a.type === 'INCOME').reduce((sum, a) => sum + a.balance, 0);
    const expenses = accounts.filter(a => a.type === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0);

    const equity = assets - liabilities;
    const netIncome = income - expenses;
    const transactionCount = transactions.length;

    // Generate simple advice based on local analysis
    let advice = `📊 Based on your current data:\n\n`;

    if (transactionCount === 0) {
      advice += `Your business hasn't recorded any transactions yet. Start by entering your first income or expense entry to begin tracking your finances.\n\n`;
    } else {
      // Financial health assessment
      if (equity > assets * 0.5) {
        advice += `✅ Your financial position is strong with ৳${equity.toLocaleString()} in equity.\n`;
      } else if (equity > 0) {
        advice += `⚠️ Your equity is positive at ৳${equity.toLocaleString()}, but consider increasing it.\n`;
      } else {
        advice += `🔴 Your liabilities exceed assets. Focus on profitability to restore balance.\n`;
      }

      // Profitability assessment
      if (netIncome > 0) {
        advice += `📈 You've earned ৳${netIncome.toLocaleString()} net income. Maintain this momentum.\n`;
      } else if (netIncome < 0) {
        advice += `📉 Your expenses exceed income by ৳${Math.abs(netIncome).toLocaleString()}. Review expense categories.\n`;
      } else {
        advice += `→ You're at breakeven. Look for opportunities to increase revenue.\n`;
      }
    }

    advice += `\n💡 Tip: For detailed AI analysis, enable an internet connection to unlock advanced insights.`;

    return advice;
  } catch (error) {
    console.error('Error generating offline advice:', error);
    // Absolute fallback
    return `📊 Financial data loaded from local storage.\n\n💡 To get AI-powered insights, please connect to the internet and try again.`;
  }
}
