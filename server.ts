/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google Gen AI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Ensure server endpoints are declared FIRST before Vite static routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

/**
 * Endpoint to auto-generate a sample bank/credit-card statement
 * so his father or the user can test the "No Manual Entry" import
 * without having to copy paste their real personal data immediately!
 */
app.post('/api/ai/generate-mock-source', async (req, res) => {
  try {
    const { type } = req.body; // 'hdfc_bank' | 'sbi_bank' | 'icici_cc' | 'mutual_fund'
    
    let mockText = '';
    if (type === 'hdfc_bank') {
      mockText = `
HDFC Bank Limited - Savings Account Statement
Account Name: SUBBARAO KOTTURI
Account Number: XXXXXX4829
Statement Period: May 1 2026 to June 5 2026
Available Balance: INR 1,24,500.28

Transactions:
05 May 2026   UPI-SALARY-GOVT IND- 93820293       95,000.00 Cr
10 May 2026   ACH DIRECT-MUTUAL FUND SIP-NIPPON   15,000.00 Dr
15 May 2026   UPI-RELIANCE-MART-PROVISIONS         3,420.00 Dr
18 May 2026   INT.RECEIVED-M4829                     820.00 Cr
24 May 2026   CHG-MINIMUM BAL FEES-00                  0.00 Dr
28 May 2026   UPI-INDANE-GAS-CYLINDER              1,150.00 Dr
02 June 2026  TRFR FROM FIXED DEPOSIT             25,000.00 Cr
03 June 2026  TFR-CREDITCARD BILL PAYMENT-ICICI   18,450.00 Dr
      `.trim();
    } else if (type === 'icici_cc') {
      mockText = `
ICICI Bank - Coral Credit Card Statement
Cardholder: SUBBARAO KOTTURI
Card Number: XXXX-XXXX-XXXX-9921
Payment Due Date: 20 June 2026
Minimum Due: INR 900.00
Total Amount Due: INR 18,450.00
Credit Limit: INR 3,000,000.00

Recent Transactions:
08 May 2026   AMAZON INDIA-RECHARGE-DTH            450.00 Dr
12 May 2026   SHELL PETROLEUM-DELHI              3,500.00 Dr
19 May 2026   APOLLO PHARMACY-MEDICINE           1,250.00 Dr
24 May 2026   SWIGGY-DELIVERY-BANGALORE            850.00 Dr
26 May 2026   AIRTEL BILL PAYMENT-WIFI           1,150.00 Dr
30 May 2026   Croma Digital-NEW TABLET          11,250.00 Dr
      `.trim();
    } else {
      mockText = `
Nippon India Mutual Fund & SBI Mutual Fund Portfolio Report
Folio Number: 2839/102-A
Investor Name: SUBBARAO KOTTURI
As of 5 June 2026

Nippon India Large Cap Fund - Direct Growth
Invested Value: INR 2,00,000.00
Current Value: INR 2,38,450.12
Units: 1,248.910
Current NAV: INR 190.92

SBI Contra Fund - Direct Plan - Growth
Invested Value: INR 1,50,000.00
Current Value: INR 1,84,920.80
Units: 1,023.100
Current NAV: INR 180.74

Monthly Active SIP Details:
- SBI Contra Fund: INR 10,000.00 on 10th of every month
- Nippon India Large Cap: INR 5,000.00 on 12th of every month
      `.trim();
    }
    
    res.json({ success: true, text: mockText });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Automated text & receipt parser utilizing gemini-3.5-flash
 * It parses natural text paste of financial statements/messages,
 * extracts transactions, accounts, mutual fund details, and credit cards
 * with no manual entry required.
 */
app.post('/api/ai/parse-statement', async (req, res) => {
  try {
    const { textContent } = req.body;
    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No text content provided' });
    }

    let ai;
    try {
      ai = getAiClient();
    } catch (err: any) {
      // Return a friendly fallback if API key is not configured yet
      console.warn("Gemini Client initialization failed: API key missing.");
      return res.status(200).json({
        success: true,
        isDemoMock: true,
        message: 'No API key configured. The server returned simulated parsed metrics for demonstration.',
        data: getSimulatedParseResult(textContent),
      });
    }

    const systemInstruction = `
You are an expert AI financial advisor and document extraction utility. 
Your primary task is to parse a text block representing an account statement, Credit Card bill, SMS alert notification, or Mutual Fund statement.
Analyze the details and extract structured financial data in JSON form matching the schema.

Important Parsing Guidelines:
1. Identify the name of Bank Accounts, Credit Cards, or Mutual Funds mentioned.
2. Calculate current balances, limits, and due dates where reported. If not explicitly found, make a smart estimate or omit it if unavailable.
3. Extract transactions list:
   - Debit (Dr) transactions should be classified as type: "expense" (amount must be a positive number).
   - Credit (Cr) transactions should be classified as type: "income" (amount must be a positive number).
   - Carefully identify the date (standardize to YYYY-MM-DD or standard ISO date relative to the current year 2026), amount, clear friendly description/merchant, category (Food, Utilities, Salary, Investments, Shopping, Travel, Taxes, Medical, Rent, Other), source (e.g. HDFC Bank, ICICI CC), and set isAutomated=true.
4. If Mutual Fund or SIP balances are present, extract their details, fundName, folioNumber, units, investedValue, and currentValue. Try to interpret SIP frequency as Monthly, Quarterly, or Weekly.
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Please parse this text and structure the extracted information: \n\n${textContent}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['bankAccounts', 'creditCards', 'transactions', 'mutualFunds', 'sips', 'assets'],
          properties: {
            bankAccounts: {
              type: Type.ARRAY,
              description: 'Bank accounts extracted from statement text',
              items: {
                type: Type.OBJECT,
                required: ['name', 'accountNumber', 'balance', 'type'],
                properties: {
                  name: { type: Type.STRING, description: 'Bank Name e.g. HDFC Bank, SBI Bank' },
                  accountNumber: { type: Type.STRING, description: 'Masked version of the account number, e.g. *2910' },
                  balance: { type: Type.NUMBER, description: 'Balance of account' },
                  type: { type: Type.STRING, description: 'Savings, Current, or Fixed Deposit' },
                }
              }
            },
            creditCards: {
              type: Type.ARRAY,
              description: 'Credit Cards extracted from statement text',
              items: {
                type: Type.OBJECT,
                required: ['name', 'cardNumber', 'currentBill', 'limit', 'dueDate'],
                properties: {
                  name: { type: Type.STRING, description: 'Credit Card name e.g. ICICI Coral' },
                  cardNumber: { type: Type.STRING, description: 'Masked version of the card number, e.g. *9921' },
                  currentBill: { type: Type.NUMBER, description: 'Total Due amount / current outstanding billing' },
                  limit: { type: Type.NUMBER, description: 'Total limit' },
                  dueDate: { type: Type.STRING, description: 'Date due in format YYYY-MM-DD' },
                }
              }
            },
            transactions: {
              type: Type.ARRAY,
              description: 'Individual transactions, logs, or payment line-items extracted',
              items: {
                type: Type.OBJECT,
                required: ['description', 'amount', 'date', 'category', 'type', 'source'],
                properties: {
                  description: { type: Type.STRING, description: 'Beneficiary, Merchant or Transaction label' },
                  amount: { type: Type.NUMBER, description: 'Amount of the transaction' },
                  date: { type: Type.STRING, description: 'Transaction Date as YYYY-MM-DD' },
                  category: { type: Type.STRING, description: 'Category (Salary, Investments, Food, Shopping, Rent, Travel, Utilities, Taxes, Medical, Other)' },
                  type: { type: Type.STRING, description: 'income or expense' },
                  source: { type: Type.STRING, description: 'Account or CC linked, e.g. HDFC Savings, ICICI Card' },
                }
              }
            },
            mutualFunds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['fundName', 'folioNumber', 'units', 'investedValue', 'currentValue'],
                properties: {
                  fundName: { type: Type.STRING, description: 'Name of Mutual Fund' },
                  folioNumber: { type: Type.STRING, description: 'Folio identifier' },
                  units: { type: Type.NUMBER, description: 'Number of units owned' },
                  investedValue: { type: Type.NUMBER, description: 'Original invested cash amount' },
                  currentValue: { type: Type.NUMBER, description: 'Current valuation as of statement' }
                }
              }
            },
            sips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['fundName', 'amount', 'frequency', 'startDate', 'nextPaymentDate'],
                properties: {
                  fundName: { type: Type.STRING, description: 'Name of Fund' },
                  amount: { type: Type.NUMBER, description: 'Monthly or active SIP installment size' },
                  frequency: { type: Type.STRING, description: 'Monthly, Quarterly, or Weekly' },
                  startDate: { type: Type.STRING, description: 'SIP registration date e.g. YYYY-MM-DD' },
                  nextPaymentDate: { type: Type.STRING, description: 'Next date due YYYY-MM-DD' }
                }
              }
            },
            assets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['name', 'category', 'value', 'purchaseValue'],
                properties: {
                  name: { type: Type.STRING, description: 'Asset title e.g. Residential Apartment, Ancestral Gold' },
                  category: { type: Type.STRING, description: 'Gold, Real Estate, Equities, PPF / EPF, Bonds, Cash / Others' },
                  value: { type: Type.NUMBER, description: 'Current valuation' },
                  purchaseValue: { type: Type.NUMBER, description: 'Acquisition cost' },
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    res.json({
      success: true,
      isDemoMock: false,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in parse-statement API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during parsing',
    });
  }
});

/**
 * Chatbot API endpoint utilizing gemini-3.5-flash
 * It receives message history and returns the AI's response.
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'No message provided' });
    }

    let ai;
    try {
      ai = getAiClient();
    } catch (err: any) {
       return res.status(200).json({
         success: true,
         text: "I am a simulated AI. Please configure your GEMINI_API_KEY to enable full chat capabilities.",
       });
    }

    const systemInstruction = `
You are Jan Dhan Assistant, an intelligent financial companion for this secure sandbox environment. 
Your role is to help the user understand their finances, give helpful budgeting tips, and answer questions about typical Indian financial contexts (taxes, mutual funds, saving schemes).
Keep your answers brief, professional, polite, and well-formatted. Avoid giving strictly regulated investment advice, suggest consulting professionals.
    `.trim();

    // Map the history to the format required by the SDK for Chats, or just use ai.models.generateContent directly depending on if we recreate a chat object or just pass a whole block of text.
    // We will use ai.chats.create 
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // If there is history, we could initialize it or just pass history in a single shot prompt. Since SDK chat history initialization is specific, let's just use generateContent with appended history array, but the chat object doesn't easily set history. So let's use generateContent with the full conversation array.
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: { systemInstruction, temperature: 0.7 }
    });

    res.json({
      success: true,
      text: response.text || '',
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during chat generation',
    });
  }
});

/**
 * Fallback static scraper simulation if Gemini API Key is not set or failed.
 * This looks for keywords in the user's text and maps them to clean records.
 * Ensures the UX is flawless even before they input their API key.
 */
function getSimulatedParseResult(text: string) {
  const lowercase = text.toLowerCase();
  
  const bankAccounts: any[] = [];
  const creditCards: any[] = [];
  const transactions: any[] = [];
  const mutualFunds: any[] = [];
  const sips: any[] = [];
  const assets: any[] = [];

  // Match HDFC bank mock triggers
  if (lowercase.includes('hdfc') || lowercase.includes('subbarao')) {
    bankAccounts.push({
      name: 'HDFC Bank',
      accountNumber: '*4829',
      balance: 124500.28,
      type: 'Savings',
    });
    transactions.push(
      { date: '2026-05-05', description: 'UPI-SALARY-GOVT IND', amount: 95000.0, category: 'Salary', type: 'income', source: 'HDFC Bank' },
      { date: '2026-05-10', description: 'ACH DIRECT-NIPPON SIP', amount: 15000.0, category: 'Investments', type: 'expense', source: 'HDFC Bank' },
      { date: '2026-05-15', description: 'UPI-RELIANCE-MART-PROVISIONS', amount: 3420.0, category: 'Food', type: 'expense', source: 'HDFC Bank' },
      { date: '2026-05-18', description: 'Interest Received M4829', amount: 820.0, category: 'Salary', type: 'income', source: 'HDFC Bank' },
      { date: '2026-05-28', description: 'UPI-INDANE-GAS-CYLINDER', amount: 1150.0, category: 'Utilities', type: 'expense', source: 'HDFC Bank' },
      { date: '2026-06-02', description: 'TRFR FROM FIXED DEPOSIT', amount: 25000.0, category: 'Salary', type: 'income', source: 'HDFC Bank' },
      { date: '2026-06-03', description: 'TFR-CREDITCARD BILL PAYMENT-ICICI', amount: 18450.0, category: 'Taxes', type: 'expense', source: 'HDFC Bank' }
    );
  }

  // Match ICICI Credit Card triggers
  if (lowercase.includes('icici') || lowercase.includes('coral') || lowercase.includes('credit card')) {
    creditCards.push({
      name: 'ICICI Coral Credit Card',
      cardNumber: '*9921',
      currentBill: 18450.0,
      limit: 300000.0,
      dueDate: '2026-06-20',
    });
    // If we didn't add transactions prior, add CC transactions
    if (transactions.length < 5) {
      transactions.push(
        { date: '2026-05-08', description: 'AMAZON INDIA-RECHARGE-DTH', amount: 450.0, category: 'Utilities', type: 'expense', source: 'ICICI Coral Card' },
        { date: '2026-05-12', description: 'SHELL PETROLEUM-DELHI', amount: 3500.0, category: 'Travel', type: 'expense', source: 'ICICI Coral Card' },
        { date: '2026-05-19', description: 'APOLLO PHARMACY-MEDICINE', amount: 1250.0, category: 'Medical', type: 'expense', source: 'ICICI Coral Card' },
        { date: '2026-05-24', description: 'SWIGGY-DELIVERY-BANGALORE', amount: 850.0, category: 'Food', type: 'expense', source: 'ICICI Coral Card' },
        { date: '2026-05-26', description: 'AIRTEL BILL PAYMENT-WIFI', amount: 1150.0, category: 'Utilities', type: 'expense', source: 'ICICI Coral Card' },
        { date: '2026-05-30', description: 'Croma Digital-NEW TABLET', amount: 11250.0, category: 'Shopping', type: 'expense', source: 'ICICI Coral Card' }
      );
    }
  }

  // Match Mutual funds and SIP
  if (lowercase.includes('nippon') || lowercase.includes('mutual fund') || lowercase.includes('contra')) {
    mutualFunds.push(
      {
        fundName: 'Nippon India Large Cap Fund - Direct Growth',
        folioNumber: '2839/102-A',
        units: 1248.91,
        investedValue: 200000.00,
        currentValue: 238450.12
      },
      {
        fundName: 'SBI Contra Fund - Direct Plan - Growth',
        folioNumber: '2839/102-A',
        units: 1023.1,
        investedValue: 150000.0,
        currentValue: 184920.8
      }
    );

    sips.push(
      {
        fundName: 'SBI Contra Fund',
        amount: 10000,
        frequency: 'Monthly',
        startDate: '2025-01-10',
        nextPaymentDate: '2026-06-10'
      },
      {
        fundName: 'Nippon India Large Cap',
        amount: 5000,
        frequency: 'Monthly',
        startDate: '2025-01-12',
        nextPaymentDate: '2026-06-12'
      }
    );
  }

  // Fallback default parser if user pasted random text that doesn't have names
  if (bankAccounts.length === 0 && creditCards.length === 0) {
    bankAccounts.push({
      name: 'Simulated Savings Account',
      accountNumber: '*1234',
      balance: 75000.0,
      type: 'Savings',
    });
    creditCards.push({
      name: 'Simulated Credit Card',
      cardNumber: '*9999',
      currentBill: 12400.0,
      limit: 150000.0,
      dueDate: '2026-06-25',
    });
    transactions.push({
      date: '2026-06-01',
      description: 'Pasted Statement Transaction',
      amount: 4500.0,
      category: 'Other',
      type: 'expense',
      source: 'Simulated Savings Account',
    });
  }

  return { bankAccounts, creditCards, transactions, mutualFunds, sips, assets };
}

// Vite integration with Express middleware
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || 
    (typeof __dirname !== 'undefined' && __dirname.includes('dist')) || 
    (typeof __filename !== 'undefined' && !__filename.endsWith('server.ts'));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML page
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Server booted on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer();
