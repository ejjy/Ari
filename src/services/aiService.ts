import OpenAI from 'openai';
import { Transaction, BudgetCategory, FinancialGoal } from '../types/finance';
import { config } from '../config/app.config';

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

interface FinancialContext {
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  goals: FinancialGoal[];
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface FinancialHealthScore {
  score: number;
  breakdown: {
    spending: number;
    savings: number;
    budgeting: number;
    goals: number;
  };
  recommendations: string[];
}

interface EmotionalAnalysis {
  tone: 'positive' | 'neutral' | 'concerned';
  sentiment: number;
  message: string;
}

export const generateFinancialInsights = async (context: FinancialContext) => {
  try {
    const prompt = `Analyze the following financial data and provide insights:
    Monthly Income: $${context.monthlyIncome}
    Monthly Expenses: $${context.monthlyExpenses}
    Transactions: ${JSON.stringify(context.transactions)}
    Budget Categories: ${JSON.stringify(context.budgetCategories)}
    Financial Goals: ${JSON.stringify(context.goals)}
    
    Please provide:
    1. Spending patterns and trends
    2. Budget utilization analysis
    3. Progress towards financial goals
    4. Recommendations for improvement
    5. Potential savings opportunities
    6. Emotional impact of financial decisions
    
    Format the response in a friendly, encouraging tone.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating financial insights:', error);
    throw error;
  }
};

export const generateTransactionCategory = async (description: string, amount: number) => {
  try {
    const prompt = `Categorize this transaction:
    Description: ${description}
    Amount: $${amount}
    
    Choose from these categories:
    - Food & Dining
    - Transportation
    - Housing
    - Utilities
    - Entertainment
    - Shopping
    - Health & Medical
    - Education
    - Personal Care
    - Income
    - Other`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 50
    });

    return response.choices[0].message.content?.trim();
  } catch (error) {
    console.error('Error categorizing transaction:', error);
    return 'Other';
  }
};

export const generateFinancialAdvice = async (context: FinancialContext) => {
  try {
    const prompt = `Based on the following financial data, provide personalized advice:
    Monthly Income: $${context.monthlyIncome}
    Monthly Expenses: $${context.monthlyExpenses}
    Recent Transactions: ${JSON.stringify(context.transactions.slice(-10))}
    Budget Status: ${JSON.stringify(context.budgetCategories)}
    Financial Goals: ${JSON.stringify(context.goals)}
    
    Please provide:
    1. Short-term actionable advice
    2. Long-term financial planning suggestions
    3. Specific steps to achieve financial goals
    4. Potential risks and how to mitigate them
    5. Emotional support and encouragement
    
    Format the response in a warm, supportive tone.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating financial advice:', error);
    throw error;
  }
};

export const calculateFinancialHealthScore = async (context: FinancialContext): Promise<FinancialHealthScore> => {
  try {
    const prompt = `Calculate a financial health score based on:
    Monthly Income: $${context.monthlyIncome}
    Monthly Expenses: $${context.monthlyExpenses}
    Transactions: ${JSON.stringify(context.transactions)}
    Budget Categories: ${JSON.stringify(context.budgetCategories)}
    Financial Goals: ${JSON.stringify(context.goals)}
    
    Provide:
    1. Overall score (0-100)
    2. Breakdown of scores for:
       - Spending habits
       - Savings rate
       - Budget adherence
       - Goal progress
    3. Specific recommendations for improvement
    
    Format as JSON with the following structure:
    {
      "score": number,
      "breakdown": {
        "spending": number,
        "savings": number,
        "budgeting": number,
        "goals": number
      },
      "recommendations": string[]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as FinancialHealthScore;
  } catch (error) {
    console.error('Error calculating financial health score:', error);
    throw error;
  }
};

export const analyzeEmotionalImpact = async (context: FinancialContext): Promise<EmotionalAnalysis> => {
  try {
    const prompt = `Analyze the emotional impact of these financial decisions:
    Monthly Income: $${context.monthlyIncome}
    Monthly Expenses: $${context.monthlyExpenses}
    Recent Transactions: ${JSON.stringify(context.transactions.slice(-10))}
    Budget Status: ${JSON.stringify(context.budgetCategories)}
    Financial Goals: ${JSON.stringify(context.goals)}
    
    Provide:
    1. Overall emotional tone (positive/neutral/concerned)
    2. Sentiment score (-1 to 1)
    3. Supportive message
    
    Format as JSON with the following structure:
    {
      "tone": "positive" | "neutral" | "concerned",
      "sentiment": number,
      "message": string
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as EmotionalAnalysis;
  } catch (error) {
    console.error('Error analyzing emotional impact:', error);
    throw error;
  }
};

export const generateWeeklySummary = async (context: FinancialContext) => {
  try {
    const prompt = `Generate a weekly financial summary based on:
    Monthly Income: $${context.monthlyIncome}
    Monthly Expenses: $${context.monthlyExpenses}
    Recent Transactions: ${JSON.stringify(context.transactions)}
    Budget Status: ${JSON.stringify(context.budgetCategories)}
    Financial Goals: ${JSON.stringify(context.goals)}
    
    Include:
    1. Weekly spending overview
    2. Budget progress
    3. Goal achievements
    4. Positive highlights
    5. Areas for improvement
    6. Encouraging message
    
    Format in a friendly, motivational tone.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    throw error;
  }
}; 