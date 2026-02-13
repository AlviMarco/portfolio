import { GoogleGenAI } from "@google/genai";
import { Account, Transaction } from "../core/types";
import { isOnline } from "../utils/networkService";

export const getFinancialAdvice = async (accounts: Account[], transactions: Transaction[]): Promise<string> => {
    if (!isOnline()) {
        return generateOfflineAdvice(accounts, transactions);
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });
        const accountSummary = accounts.map(a => `${a.name} (${a.type}): ৳${a.balance.toLocaleString()}`).join('\n');
        const recentTransactions = transactions.slice(-5).map(t => `${t.date}: ${t.description}`).join('\n');

        const prompt = `
      As a professional financial advisor, analyze these accounts:
      ${accountSummary}
      
      Recent activities:
      ${recentTransactions}
      
      Provide a 3-sentence summary of the business health and one actionable advice.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a concise financial consultant for small businesses. Focus on liquidity, profit, and debt management."
            }
        });

        return (response as any).text || 'Could not generate financial advice.';
    } catch (error) {
        console.error("❌ Gemini API error:", error);
        return generateOfflineAdvice(accounts, transactions);
    }
};

function generateOfflineAdvice(accounts: Account[], transactions: Transaction[]): string {
    const assets = accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0);
    const liabilities = accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0);
    const income = accounts.filter(a => a.type === 'INCOME').reduce((sum, a) => sum + a.balance, 0);
    const expenses = accounts.filter(a => a.type === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0);

    const equity = assets - liabilities;
    const netIncome = income - expenses;

    let advice = `📊 Based on your current data:\n\n`;
    if (equity > assets * 0.5) {
        advice += `✅ Your financial position is strong.\n`;
    } else if (equity > 0) {
        advice += `⚠️ Your equity is positive, but consider increasing it.\n`;
    } else {
        advice += `🔴 Your liabilities exceed assets.\n`;
    }

    if (netIncome > 0) {
        advice += `📈 You've earned ৳${netIncome.toLocaleString()} net income.\n`;
    } else if (netIncome < 0) {
        advice += `📉 Your expenses exceed income. Review expenses.\n`;
    }

    advice += `\n💡 Tip: Connect to internet for detailed AI insights.`;
    return advice;
}
