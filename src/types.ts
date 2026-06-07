/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string; // Masked like *4829
  upiId?: string; // UPI ID associated with account
  balance: number;
  type: 'Savings' | 'Current' | 'Fixed Deposit';
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  cardNumber: string; // Masked like *9921
  currentBill: number;
  limit: number;
  dueDate: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  source: string; // Named Bank Account or Credit Card used
  isAutomated: boolean; // True if parsed by AI
}

export interface MutualFund {
  id: string;
  fundName: string;
  folioNumber: string;
  units: number;
  investedValue: number;
  currentValue: number;
  lastNavUpdate: string;
}

export interface SIP {
  id: string;
  fundName: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Weekly';
  startDate: string;
  nextPaymentDate: string;
  investedValue: number;
  currentValue: number;
}

export interface Asset {
  id: string;
  name: string;
  category: 'Gold' | 'Real Estate' | 'Equities' | 'PPF / EPF' | 'Bonds' | 'Cash / Others';
  value: number;
  purchaseValue: number;
}

export interface TaxCalculation {
  regime: 'New' | 'Old';
  assessmentYear: string;
  grossSalary: number;
  otherIncome: number;
  exemptions: {
    section80C: number;  // Max 1.5 Lakhs in Old
    section80D: number;  // Max 25k/50k for health insurance
    hra: number;
    standardDeduction: number; // 50k or 75k (Budget changes)
    otherDeductions: number;
  };
}

export interface WorkspaceState {
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  mutualFunds: MutualFund[];
  sips: SIP[];
  assets: Asset[];
  developerSignature: string;
}
