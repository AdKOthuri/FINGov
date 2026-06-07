/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  Landmark, 
  TrendingUp, 
  Scale, 
  Wallet, 
  Smartphone, 
  Download, 
  Check, 
  X, 
  ChevronRight,
  Info,
  Layers,
  Clock,
  Shield,
  HelpCircle,
  Menu,
  RotateCcw,
  Plus,
  Lock,
  FileDown,
  ShieldCheck,
  Sun,
  Moon,
  Database,
  Search,
  RefreshCw,
  LogOut
} from 'lucide-react';

import { WorkspaceState, BankAccount, CreditCard, Transaction, MutualFund, SIP, Asset } from './types';
import { DashboardOverview } from './components/DashboardOverview';
import { StatementParser } from './components/StatementParser';
import { AccountsTransactions } from './components/AccountsTransactions';
import { SIPMutualFunds } from './components/SIPMutualFunds';
import { AssetsList } from './components/AssetsList';
import { TaxCalculator } from './components/TaxCalculator';
import { SecurityLock } from './components/SecurityLock';
import { exportFinancialPDF } from './utils/pdfExport';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  saveToGoogleDrive, 
  loadFromGoogleDrive,
  getAccessToken
} from './utils/googleAuth';
import { safeStorage } from './lib/storage';

// Initial pre-populated template data for demonstration
const initialDemoState: WorkspaceState = {
  bankAccounts: [
    {
      id: 'acc-hdfc',
      name: 'HDFC Savings Account',
      accountNumber: '*4829',
      balance: 124500.28,
      type: 'Savings',
      upiId: 'kotturi@hdfcbank',
      updatedAt: '2026-06-05T11:00:00.000Z'
    },
    {
      id: 'acc-sbi',
      name: 'SBI Pension Savings',
      accountNumber: '*1029',
      balance: 45000.00,
      type: 'Savings',
      updatedAt: '2026-06-05T11:00:00.000Z'
    }
  ],
  creditCards: [
    {
      id: 'cc-icici',
      name: 'ICICI Coral Credit Card',
      cardNumber: '*9921',
      currentBill: 18450.00,
      limit: 300000.00,
      dueDate: '2026-06-20',
      updatedAt: '2026-06-05T11:00:00.000Z'
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      description: 'UPI-SALARY-GOVT IND-93820293',
      amount: 95000.00,
      date: '2026-05-05',
      category: 'Salary',
      type: 'income',
      source: 'HDFC Bank',
      isAutomated: true
    },
    {
      id: 'tx-2',
      description: 'ACH DIRECT-MUTUAL FUND SIP-NIPPON',
      amount: 15000.00,
      date: '2026-05-10',
      category: 'Investments',
      type: 'expense',
      source: 'HDFC Bank',
      isAutomated: true
    },
    {
      id: 'tx-3',
      description: 'UPI-RELIANCE-MART-PROVISIONS',
      amount: 3420.00,
      date: '2026-05-15',
      category: 'Food',
      type: 'expense',
      source: 'HDFC Bank',
      isAutomated: true
    },
    {
      id: 'tx-4',
      description: 'INT.RECEIVED-M4829',
      amount: 820.00,
      date: '2026-05-18',
      category: 'Salary',
      type: 'income',
      source: 'HDFC Bank',
      isAutomated: true
    },
    {
      id: 'tx-5',
      description: 'UPI-INDANE-GAS-CYLINDER',
      amount: 1150.00,
      date: '2026-05-28',
      category: 'Utilities',
      type: 'expense',
      source: 'HDFC Bank',
      isAutomated: true
    },
    {
      id: 'tx-6',
      description: 'AMAZON-PAY-ORDER-9921',
      amount: 4500.00,
      date: '2026-04-12',
      category: 'Other',
      type: 'expense',
      source: 'ICICI Coral',
      isAutomated: false
    },
    {
      id: 'tx-7',
      description: 'UBER RIDES',
      amount: 1200.00,
      date: '2026-04-20',
      category: 'Other',
      type: 'expense',
      source: 'HDFC Bank',
      isAutomated: false
    },
    {
      id: 'tx-8',
      description: 'AIRTEL BROADBAND',
      amount: 1100.00,
      date: '2026-04-05',
      category: 'Other',
      type: 'expense',
      source: 'ICICI Coral',
      isAutomated: false
    },
    {
      id: 'tx-9',
      description: 'ZOMATO ONLINE ORDER',
      amount: 850.00,
      date: '2026-06-02',
      category: 'Other',
      type: 'expense',
      source: 'ICICI Coral',
      isAutomated: false
    }
  ],
  mutualFunds: [
    {
      id: 'mf-nippon',
      fundName: 'Nippon India Large Cap Fund - Direct Growth',
      folioNumber: '2839/102-A',
      units: 1248.910,
      investedValue: 200000.00,
      currentValue: 238450.12,
      lastNavUpdate: '2026-06-05'
    },
    {
      id: 'mf-sbi',
      fundName: 'SBI Contra Fund - Direct Plan - Growth',
      folioNumber: '2839/102-A',
      units: 1023.100,
      investedValue: 150000.00,
      currentValue: 184920.80,
      lastNavUpdate: '2026-06-05'
    }
  ],
  sips: [
    {
      id: 'sip-sbi',
      fundName: 'SBI Contra Fund',
      amount: 10000.00,
      frequency: 'Monthly',
      startDate: '2025-01-10',
      nextPaymentDate: '2026-06-10',
      investedValue: 150000,
      currentValue: 184920.80
    },
    {
      id: 'sip-nippon',
      fundName: 'Nippon India Large Cap',
      amount: 5000.00,
      frequency: 'Monthly',
      startDate: '2025-01-12',
      nextPaymentDate: '2026-06-12',
      investedValue: 200000,
      currentValue: 238450.12
    }
  ],
  assets: [
    {
      id: 'asset-gold',
      name: 'Ancestral Sovereign Gold Jewellery',
      category: 'Gold',
      value: 250000.00,
      purchaseValue: 180000.00
    },
    {
      id: 'asset-prop',
      name: 'Residential Land Plot (Visakhapatnam)',
      category: 'Real Estate',
      value: 1500000.00,
      purchaseValue: 900000.00
    }
  ],
  developerSignature: 'KOTTURI R R K SREEKANTH'
};

export default function App() {
  const [state, setState] = useState<WorkspaceState>(() => {
    const saved = safeStorage.getItem('ai_financial_workspace_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
         return initialDemoState;
      }
    }
    return initialDemoState;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'parser' | 'accounts' | 'sips' | 'assets' | 'tax'>('overview');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  // App-level privacy PIN lock state
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Overview Quick Transaction search state
  const [overviewSearch, setOverviewSearch] = useState<string>('');

  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [signatureInput, setSignatureInput] = useState('');

  // Theme support
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = safeStorage.getItem('subbarao_app_theme');
    return (savedTheme as 'dark' | 'light') || 'dark';
  });

  // Google Sync settings
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Sync theme changes to the HTML element
  useEffect(() => {
    safeStorage.setItem('subbarao_app_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  // Hook up auth token observer on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setSyncMessage("Welcome! Google Account Linked.");
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    setSyncMessage("Connecting Google account...");
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setSyncMessage("Authorized! Looking up cloud backup files...");
        
        const cloudState = await loadFromGoogleDrive(result.accessToken);
        if (cloudState) {
          if (window.confirm("A secure portfolio backup was found on your Google Drive. Would you like to restore it onto this device? This will replace your temporary local changes.")) {
            setState(cloudState);
            setSyncMessage("Successfully restored your statements from Google Drive!");
          } else {
            setSyncMessage("Credentials verified. Keeping local state.");
          }
        } else {
          setSyncMessage("No existing backup file found. Ready to push state!");
        }
      }
    } catch (err: any) {
      console.error(err);
      setSyncMessage(`Sync authentication failed: ${err.message || 'Check connection settings.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSignOut = async () => {
    if (window.confirm("Are you sure you want to remove your linked Google Account? Cloud sync will be paused.")) {
      await logout();
      setUser(null);
      setToken(null);
      setSyncMessage("Google Account successfully detached.");
    }
  };

  const handleSyncPush = async () => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      setSyncMessage("Please connect to a Google Account first.");
      return;
    }
    setIsSyncing(true);
    setSyncMessage("Uploading secure backup package to Google Drive...");
    try {
      const success = await saveToGoogleDrive(activeToken, state);
      if (success) {
        setSyncMessage("State successfully backed up to your Google Drive!");
      } else {
        setSyncMessage("Backup failed. Check permissions on your account.");
      }
    } catch (err) {
      console.error(err);
      setSyncMessage("Connection exception encountered during upload.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      setSyncMessage("Please connect to a Google Account first.");
      return;
    }

    if (!window.confirm("Warning: Restoring backup will overwrite your contemporary local transactions and account files. Continue?")) {
      return;
    }

    setIsSyncing(true);
    setSyncMessage("Pulling secure backup archive...");
    try {
      const cloudState = await loadFromGoogleDrive(activeToken);
      if (cloudState) {
        setState(cloudState);
        setSyncMessage("Secure state fully restored from Google Drive.");
      } else {
        setSyncMessage("No valid backup found on Google Drive.");
      }
    } catch (err) {
      console.error(err);
      setSyncMessage("Connection exception during backup restore.");
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Custom states for PWA App installation interaction
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [deviceOS, setDeviceOS] = useState<'android' | 'ios' | 'desktop'>('android');

  // Detect Mobile OS on load
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceOS('ios');
    } else if (/android/.test(ua)) {
      setDeviceOS('android');
    } else {
      setDeviceOS('desktop');
    }

    // Capture Chrome/Android installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    safeStorage.setItem('ai_financial_workspace_state', JSON.stringify(state));
  }, [state]);

  const triggerInstallApp = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User installed the companion app!');
          setShowInstallPrompt(false);
        }
        setInstallPromptEvent(null);
      });
    } else {
      // Trigger instruction manual dialog sheet
      setShowInstallModal(true);
    }
  };

  // AI parsed data merger
  const handleImportParsedData = (parsed: Partial<WorkspaceState>) => {
    setState((prev) => {
      const mergedBankAccounts = [...prev.bankAccounts];
      if (parsed.bankAccounts) {
        parsed.bankAccounts.forEach((newAcc) => {
          const idx = mergedBankAccounts.findIndex(
            (b) => b.name.toLowerCase() === newAcc.name.toLowerCase()
          );
          if (idx >= 0) {
            mergedBankAccounts[idx] = {
              ...mergedBankAccounts[idx],
              balance: newAcc.balance,
              accountNumber: newAcc.accountNumber || mergedBankAccounts[idx].accountNumber,
              updatedAt: new Date().toISOString()
            };
          } else {
            mergedBankAccounts.push({
              id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: newAcc.name,
              accountNumber: newAcc.accountNumber || `*${Math.floor(1000 + Math.random() * 9000)}`,
              balance: newAcc.balance,
              type: newAcc.type || 'Savings',
              updatedAt: new Date().toISOString()
            });
          }
        });
      }

      const mergedCreditCards = [...prev.creditCards];
      if (parsed.creditCards) {
        parsed.creditCards.forEach((newCard) => {
          const idx = mergedCreditCards.findIndex(
            (c) => c.name.toLowerCase() === newCard.name.toLowerCase()
          );
          if (idx >= 0) {
            mergedCreditCards[idx] = {
              ...mergedCreditCards[idx],
              currentBill: newCard.currentBill,
              limit: newCard.limit || mergedCreditCards[idx].limit,
              dueDate: newCard.dueDate || mergedCreditCards[idx].dueDate,
              updatedAt: new Date().toISOString()
            };
          } else {
            mergedCreditCards.push({
              id: `cc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: newCard.name,
              cardNumber: newCard.cardNumber || `*${Math.floor(1000 + Math.random() * 9000)}`,
              currentBill: newCard.currentBill,
              limit: newCard.limit || 150000,
              dueDate: newCard.dueDate || new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString()
            });
          }
        });
      }

      const existingTxDescs = new Set(prev.transactions.map((t) => t.description + t.amount + t.date));
      const newlyCapturedTx: Transaction[] = [];
      if (parsed.transactions) {
        parsed.transactions.forEach((tx) => {
          const uniqueKey = tx.description + tx.amount + tx.date;
          if (!existingTxDescs.has(uniqueKey)) {
            newlyCapturedTx.push({
              id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              description: tx.description,
              amount: tx.amount,
              date: tx.date,
              category: tx.category || 'Other',
              type: tx.type || 'expense',
              source: tx.source || 'Import Feed',
              isAutomated: true
            });
          }
        });
      }
      const mergedTransactions = [...newlyCapturedTx, ...prev.transactions];

      const mergedMutualFunds = [...prev.mutualFunds];
      if (parsed.mutualFunds) {
        parsed.mutualFunds.forEach((newMf) => {
          const idx = mergedMutualFunds.findIndex(
            (m) => m.fundName.toLowerCase().includes(newMf.fundName.toLowerCase()) || 
                   newMf.fundName.toLowerCase().includes(m.fundName.toLowerCase())
          );
          if (idx >= 0) {
            mergedMutualFunds[idx] = {
              ...mergedMutualFunds[idx],
              currentValue: newMf.currentValue,
              investedValue: newMf.investedValue || mergedMutualFunds[idx].investedValue,
              units: newMf.units || mergedMutualFunds[idx].units,
              folioNumber: newMf.folioNumber || mergedMutualFunds[idx].folioNumber,
              lastNavUpdate: new Date().toISOString().split('T')[0]
            };
          } else {
            mergedMutualFunds.push({
              id: `mf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              fundName: newMf.fundName,
              folioNumber: newMf.folioNumber || `${Math.floor(1000 + Math.random() * 9291)}`,
              units: newMf.units || newMf.currentValue / 150,
              investedValue: newMf.investedValue || newMf.currentValue * 0.9,
              currentValue: newMf.currentValue,
              lastNavUpdate: new Date().toISOString().split('T')[0]
            });
          }
        });
      }

      const mergedSIPs = [...prev.sips];
      if (parsed.sips) {
        parsed.sips.forEach((newSip) => {
          const idx = mergedSIPs.findIndex(
            (s) => s.fundName.toLowerCase().includes(newSip.fundName.toLowerCase()) || 
                   newSip.fundName.toLowerCase().includes(s.fundName.toLowerCase())
          );
          if (idx >= 0) {
            mergedSIPs[idx] = {
              ...mergedSIPs[idx],
              amount: newSip.amount,
              nextPaymentDate: newSip.nextPaymentDate || mergedSIPs[idx].nextPaymentDate
            };
          } else {
            mergedSIPs.push({
              id: `sip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              fundName: newSip.fundName,
              amount: newSip.amount,
              frequency: newSip.frequency || 'Monthly',
              startDate: newSip.startDate || new Date().toISOString().split('T')[0],
              nextPaymentDate: newSip.nextPaymentDate || new Date().toISOString().split('T')[0],
              investedValue: 0,
              currentValue: 0
            });
          }
        });
      }

      const mergedAssets = [...prev.assets];
      if (parsed.assets) {
        parsed.assets.forEach((newAsset) => {
          const idx = mergedAssets.findIndex((a) => a.name.toLowerCase() === newAsset.name.toLowerCase());
          if (idx >= 0) {
            mergedAssets[idx] = {
              ...mergedAssets[idx],
              value: newAsset.value,
              purchaseValue: newAsset.purchaseValue || mergedAssets[idx].purchaseValue
            };
          } else {
            mergedAssets.push({
              id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: newAsset.name,
              category: newAsset.category || 'Cash / Others',
              value: newAsset.value,
              purchaseValue: newAsset.purchaseValue || newAsset.value
            });
          }
        });
      }

      triggerSaveHighlight();
      return {
        bankAccounts: mergedBankAccounts,
        creditCards: mergedCreditCards,
        transactions: mergedTransactions,
        mutualFunds: mergedMutualFunds,
        sips: mergedSIPs,
        assets: mergedAssets
      };
    });
  };

  const triggerSaveHighlight = () => {
    setSaveStatus('Data synchronized locally!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleAddBankAccount = (account: Omit<BankAccount, 'id' | 'updatedAt'>) => {
    setState((prev) => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        {
          ...account,
          id: `acc-${Date.now()}`,
          updatedAt: new Date().toISOString()
        }
      ]
    }));
    triggerSaveHighlight();
  };

  const handleAddCreditCard = (card: Omit<CreditCard, 'id' | 'updatedAt'>) => {
    setState((prev) => ({
      ...prev,
      creditCards: [
        ...prev.creditCards,
        {
          ...card,
          id: `cc-${Date.now()}`,
          updatedAt: new Date().toISOString()
        }
      ]
    }));
    triggerSaveHighlight();
  };

  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'isAutomated'>) => {
    setState((prev) => ({
      ...prev,
      transactions: [
        {
          ...transaction,
          id: `tx-${Date.now()}`,
          isAutomated: false
        },
        ...prev.transactions
      ]
    }));
    triggerSaveHighlight();
  };

  const handleDeleteTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id)
    }));
    triggerSaveHighlight();
  };

  const handleAddMutualFund = (fund: Omit<MutualFund, 'id'>) => {
    setState((prev) => ({
      ...prev,
      mutualFunds: [
        ...prev.mutualFunds,
        {
          ...fund,
          id: `mf-${Date.now()}`
        }
      ]
    }));
    triggerSaveHighlight();
  };

  const handleDeleteMutualFund = (id: string) => {
    setState((prev) => ({
      ...prev,
      mutualFunds: prev.mutualFunds.filter((f) => f.id !== id)
    }));
    triggerSaveHighlight();
  };

  const handleAddSIP = (sip: Omit<SIP, 'id'>) => {
    setState((prev) => ({
      ...prev,
      sips: [
        ...prev.sips,
        {
          ...sip,
          id: `sip-${Date.now()}`
        }
      ]
    }));
    triggerSaveHighlight();
  };

  const handleDeleteSIP = (id: string) => {
    setState((prev) => ({
      ...prev,
      sips: prev.sips.filter((s) => s.id !== id)
    }));
    triggerSaveHighlight();
  };

  const handleAddAsset = (asset: Omit<Asset, 'id'>) => {
    setState((prev) => ({
      ...prev,
      assets: [
        ...prev.assets,
        {
          ...asset,
          id: `asset-${Date.now()}`
        }
      ]
    }));
    triggerSaveHighlight();
  };

  const handleDeleteAsset = (id: string) => {
    setState((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id)
    }));
    triggerSaveHighlight();
  };

  const handleTriggerSIPPayment = (sipId: string) => {
    const sipItem = state.sips.find((s) => s.id === sipId);
    if (!sipItem) return;

    const validAccountIndex = state.bankAccounts.findIndex((b) => b.balance >= sipItem.amount);
    
    if (validAccountIndex < 0) {
      alert(`Insufficient funds in bank accounts to process ₹${sipItem.amount} SIP payment!`);
      return;
    }

    const payAccount = state.bankAccounts[validAccountIndex];

    setState((prev) => {
      const updatedAccounts = [...prev.bankAccounts];
      updatedAccounts[validAccountIndex] = {
        ...payAccount,
        balance: payAccount.balance - sipItem.amount,
        updatedAt: new Date().toISOString()
      };

      const updatedFunds = [...prev.mutualFunds];
      const matchingFundIdx = updatedFunds.findIndex(
        (m) => m.fundName.toLowerCase().includes(sipItem.fundName.toLowerCase()) ||
               sipItem.fundName.toLowerCase().includes(m.fundName.toLowerCase())
      );

      if (matchingFundIdx >= 0) {
        const matched = updatedFunds[matchingFundIdx];
        const addedUnits = sipItem.amount / (matched.currentValue / matched.units || 180);
        updatedFunds[matchingFundIdx] = {
          ...matched,
          investedValue: matched.investedValue + sipItem.amount,
          currentValue: matched.currentValue + sipItem.amount,
          units: matched.units + addedUnits,
          lastNavUpdate: new Date().toISOString().split('T')[0]
        };
      } else {
        updatedFunds.push({
          id: `mf-${Date.now()}`,
          fundName: `${sipItem.fundName} (Growth)`,
          folioNumber: `${Math.floor(1000 + Math.random() * 9000)}/289`,
          units: sipItem.amount / 160,
          investedValue: sipItem.amount,
          currentValue: sipItem.amount,
          lastNavUpdate: new Date().toISOString().split('T')[0]
        });
      }

      const updatedSips = prev.sips.map((s) => {
        if (s.id === sipId) {
          const nextDate = new Date(s.nextPaymentDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          return {
            ...s,
            nextPaymentDate: nextDate.toISOString().split('T')[0]
          };
        }
        return s;
      });

      const addedTx: Transaction = {
        id: `tx-${Date.now()}`,
        description: `AUTO SIP INST: ${sipItem.fundName}`,
        amount: sipItem.amount,
        date: new Date().toISOString().split('T')[0],
        category: 'Investments',
        type: 'expense',
        source: payAccount.name,
        isAutomated: true
      };

      return {
        ...prev,
        bankAccounts: updatedAccounts,
        mutualFunds: updatedFunds,
        sips: updatedSips,
        transactions: [addedTx, ...prev.transactions]
      };
    });

    triggerSaveHighlight();
  };

  const handleAutoCategorizeTransactions = () => {
    setState((prev) => {
      let categorizedCount = 0;
      const updatedTx = prev.transactions.map((tx) => {
        let newCat = tx.category;
        const desc = tx.description.toLowerCase();
        if (desc.includes('reliance') || desc.includes('mart') || desc.includes('grocery')) {
          newCat = 'Food';
        } else if (desc.includes('rent') || desc.includes('pg') || desc.includes('hostel')) {
          newCat = 'Rent';
        } else if (desc.includes('uber') || desc.includes('ola') || desc.includes('flight') || desc.includes('irctc')) {
          newCat = 'Travel';
        } else if (desc.includes('zomato') || desc.includes('swiggy')) {
          newCat = 'Food';
        } else if (desc.includes('amazon') || desc.includes('myntra') || desc.includes('flipkart') || desc.includes('shopping')) {
          newCat = 'Shopping';
        } else if (desc.includes('electric') || desc.includes('water') || desc.includes('broadband') || desc.includes('airtel') || desc.includes('jio') || desc.includes('gas')) {
          newCat = 'Utilities';
        } else if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wages')) {
          newCat = 'Salary';
        }
        if (newCat !== tx.category) categorizedCount++;
        return {
          ...tx,
          category: newCat,
          isAutomated: true
        };
      });
      if (categorizedCount > 0) {
        setSyncMessage(`Bot organized ${categorizedCount} unmapped transactions.`);
      } else {
        setSyncMessage(`All transactions are already categorized.`);
      }
      return { ...prev, transactions: updatedTx };
    });
  };

  const handlePayCreditBill = (cardId: string, fromAccountId: string) => {
    const cardItem = state.creditCards.find((c) => c.id === cardId);
    const bankItem = state.bankAccounts.find((b) => b.id === fromAccountId);

    if (!cardItem || !bankItem) return;

    if (bankItem.balance < cardItem.currentBill) {
      alert(`Your bank account holds ₹${bankItem.balance.toLocaleString('en-IN')}, insufficient to pay your ₹${cardItem.currentBill.toLocaleString('en-IN')} card bill!`);
      return;
    }

    setState((prev) => {
      const updatedAccounts = prev.bankAccounts.map((b) => {
        if (b.id === fromAccountId) {
          return { ...b, balance: b.balance - cardItem.currentBill, updatedAt: new Date().toISOString() };
        }
        return b;
      });

      const updatedCards = prev.creditCards.map((c) => {
        if (c.id === cardId) {
          return { ...c, currentBill: 0, updatedAt: new Date().toISOString() };
        }
        return c;
      });

      const addedTx: Transaction = {
        id: `tx-${Date.now()}`,
        description: `SETTLED CREDIT BILL: ${cardItem.name}`,
        amount: cardItem.currentBill,
        date: new Date().toISOString().split('T')[0],
        category: 'Taxes',
        type: 'expense',
        source: bankItem.name,
        isAutomated: true
      };

      return {
        ...prev,
        bankAccounts: updatedAccounts,
        creditCards: updatedCards,
        transactions: [addedTx, ...prev.transactions]
      };
    });

    triggerSaveHighlight();
  };

  const handleResetData = () => {
    if (window.confirm('Reset app data to secure sample template?')) {
      setState(initialDemoState);
    }
  };

  const salaryTxs = state.transactions.filter(
    (t) => t.type === 'income' && t.category.toLowerCase() === 'salary'
  );
  const detectedMonthlySalary = salaryTxs.reduce((sum, t) => sum + t.amount, 0) || 95000;
  const salaryIncomeEstimate = detectedMonthlySalary * 12;

  if (isLocked) {
    return <SecurityLock onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:pb-0 pb-20 select-none">
      
      {/* 🔮 PREMIUM MOBILE HEADER & STATUS INDICATOR */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 safe-top">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 p-1.5 shadow-lg shadow-amber-500/20">
              <img 
                src="/src/assets/images/app_logo_1780832193559.png" 
                alt="Logo" 
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image load error
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Landmark className="w-5 h-5 absolute" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <h1 className="text-sm font-black tracking-tight text-white uppercase">SUBBARAO KOTTURI</h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">जन धन (Jan Dhan)</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {saveStatus && (
              <span className="text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Saved
              </span>
            )}

            {/* High-Contrast Light / Dark Mode Toggle */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? "Switch to High-Contrast Light Mode" : "Switch to Default Slate Mode"}
              className="p-2 text-slate-400 hover:text-amber-500 rounded-lg transition active:scale-90"
              id="header-btn-theme"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400 animate-pulse" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </button>
            
            {/* Export PDF Button */}
            <button 
              onClick={() => exportFinancialPDF(state)}
              title="Export Statement to PDF"
              className="p-2 text-slate-400 hover:text-amber-500 rounded-lg transition active:scale-90"
              id="header-btn-pdf"
            >
              <FileDown className="w-4.5 h-4.5" />
            </button>

            {/* Manual Lock Button */}
            <button 
              onClick={() => setIsLocked(true)}
              title="Lock App"
              className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg transition active:scale-90"
              id="header-btn-lock"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button 
              onClick={handleResetData}
              title="Reset parameters"
              className="p-2 text-slate-400 hover:text-white rounded-lg transition active:scale-90"
              id="header-btn-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 📲 PWA INSTALL APK PROMPT BANNER */}
      {showInstallPrompt && (
        <div className="bg-linear-to-r from-amber-500/20 via-indigo-500/10 to-transparent border-y border-amber-500/20 py-2.5 px-4 backdrop-blur-md">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg animate-pulse shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-300">Run App Native On Your Phone</p>
                <p className="text-[9px] text-slate-350">Install this financial sheet directly as a secure, fast APK.</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={triggerInstallApp}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-lg transition duration-150 shadow-md shadow-amber-500/10"
              >
                Install APK
              </button>
              <button 
                onClick={() => setShowInstallPrompt(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 CORE CONTAINER (SCALES BEAUTIFULLY) */}
      <main className="flex-grow max-w-md w-full mx-auto px-4 py-5 space-y-6">
        
        {/* Dynamic Navigation Indicator Title */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Live Secure Wallet</span>
            <h2 className="text-lg font-black tracking-tight text-white capitalize">
              {activeTab === 'overview' && 'Portfolio Intelligence'}
              {activeTab === 'parser' && 'AI Statement Parser'}
              {activeTab === 'accounts' && 'Card Bills & Cash Balance'}
              {activeTab === 'sips' && 'SIP Auto-Staging'}
              {activeTab === 'assets' && 'Assets Repository'}
              {activeTab === 'tax' && 'Tax Slabs Optimizer'}
            </h2>
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1.5 bg-slate-900 border border-slate-800/60 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>2026 UTC</span>
          </div>
        </div>

        {/* Dynamic Tab Contents */}
        <div className="transition-all duration-300 animate-fade-in">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 🌐 GOOGLE DRIVE BACKUP & ACCOUNT SYNC HUB */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                      <Database className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">Google Drive Companion</h3>
                      <p className="text-[10px] text-slate-400">Linked secure Google Drive backups container</p>
                    </div>
                  </div>
                  
                  {user ? (
                    <button 
                      onClick={handleGoogleSignOut}
                      className="px-2.5 py-1 text-[10px] bg-slate-800 text-rose-400 font-bold rounded-lg border border-slate-750 hover:bg-slate-700 transition duration-150 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button 
                      onClick={handleGoogleSignIn}
                      className="px-2.5 py-1 text-[10px] bg-amber-500 text-slate-950 font-black rounded-lg hover:bg-amber-600 transition duration-150 cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {user ? (
                  <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={user.photoURL || undefined} 
                          alt={user.displayName || 'Google User'} 
                          className="w-7 h-7 rounded-full border border-amber-500/30 shadow-sm"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">{user.displayName}</div>
                          <div className="text-[9px] text-slate-400 font-mono tracking-tight">{user.email}</div>
                        </div>
                      </div>
                      <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shrink-0">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected</span>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-850/60 flex items-center justify-between gap-2.5">
                      <button
                        onClick={handleSyncPush}
                        disabled={isSyncing}
                        className="flex-grow py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-lg transition text-center disabled:opacity-50 cursor-pointer"
                      >
                        {isSyncing ? 'Syncing...' : 'Upload backup'}
                      </button>
                      <button
                        onClick={handleSyncPull}
                        disabled={isSyncing}
                        className="flex-grow py-1.5 px-3 bg-slate-800 text-slate-200 text-[10px] font-bold rounded-lg transition text-center disabled:opacity-50 hover:bg-slate-750 cursor-pointer"
                      >
                        Restore backup
                      </button>
                    </div>

                    {syncMessage && (
                      <span className="block text-[9px] text-center font-bold text-amber-500 bg-amber-500/5 py-1 px-2 rounded-md animate-pulse">
                        {syncMessage}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850/40 text-center space-y-2.5">
                    <p className="text-[10px] text-slate-400">
                      Synchronize, index, and load transaction archives securely on cellular smartphones using personal Google Drive directory.
                    </p>
                    
                    <button 
                      onClick={handleGoogleSignIn}
                      className="mx-auto flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-900 text-[10px] px-3.5 py-2 rounded-xl shadow-md font-bold transition active:scale-95 duration-150 cursor-pointer"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5 shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 🔍 TRANSACTIONS QUICK SEARCH BAR SECTIONS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Search className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Live Transactions Search</h3>
                    <p className="text-[10px] text-slate-400">Instantly lookup UPI codes, categories, or banks</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/40 text-slate-200 placeholder-slate-500 transition-all focus:outline-none"
                    placeholder="Search UPI description, source bank, tags..."
                    value={overviewSearch}
                    onChange={(e) => setOverviewSearch(e.target.value)}
                    id="overview-search-input"
                  />
                  {overviewSearch && (
                    <button 
                      onClick={() => setOverviewSearch('')}
                      className="absolute right-3 top-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5 animate-pulse" />
                    </button>
                  )}
                </div>

                {overviewSearch.trim() !== '' && (
                  <div className="bg-slate-950/40 rounded-xl border border-slate-850/50 p-2.5 divide-y divide-slate-850/40 max-h-48 overflow-y-auto scroller-hidden animate-fade-in">
                    {state.transactions.filter(t => 
                      t.description.toLowerCase().includes(overviewSearch.toLowerCase()) ||
                      t.category.toLowerCase().includes(overviewSearch.toLowerCase()) ||
                      t.source.toLowerCase().includes(overviewSearch.toLowerCase())
                    ).length > 0 ? (
                      state.transactions.filter(t => 
                        t.description.toLowerCase().includes(overviewSearch.toLowerCase()) ||
                        t.category.toLowerCase().includes(overviewSearch.toLowerCase()) ||
                        t.source.toLowerCase().includes(overviewSearch.toLowerCase())
                      ).map(t => (
                        <div key={t.id} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                          <div className="space-y-0.5 max-w-[75%]">
                            <p className="font-bold text-white truncate leading-tight">{t.description}</p>
                            <div className="flex items-center space-x-1.5 text-[9px] text-slate-400">
                              <span className="px-1.5 py-0.2 bg-slate-800 rounded font-semibold text-[9px] text-slate-350">{t.category}</span>
                              <span>{t.date}</span>
                              <span className="text-slate-500">({t.source})</span>
                            </div>
                          </div>
                          <span className={`font-mono text-xs font-black shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 text-center py-2">No matching transactions found.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Native PWA Installation tutorial button */}
              <div 
                onClick={() => setShowInstallModal(true)}
                className="p-3 bg-slate-900/80 border border-slate-850 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition active:scale-98 duration-150"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Download className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Android APK & iOS Installation Guide</h4>
                    <p className="text-[9px] text-slate-400">Click to view secure offline home-screen options</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>

              <DashboardOverview 
                bankAccounts={state.bankAccounts} 
                creditCards={state.creditCards}
                transactions={state.transactions}
                mutualFunds={state.mutualFunds}
                assets={state.assets}
              />
            </div>
          )}

          {activeTab === 'parser' && (
            <StatementParser onImportData={handleImportParsedData} />
          )}

          {activeTab === 'accounts' && (
            <AccountsTransactions
              bankAccounts={state.bankAccounts}
              creditCards={state.creditCards}
              transactions={state.transactions}
              onAddBankAccount={handleAddBankAccount}
              onAddCreditCard={handleAddCreditCard}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onPayCreditBill={handlePayCreditBill}
              onAutoCategorizeTransactions={handleAutoCategorizeTransactions}
            />
          )}

          {activeTab === 'sips' && (
            <SIPMutualFunds
              mutualFunds={state.mutualFunds}
              sips={state.sips}
              onAddMutualFund={handleAddMutualFund}
              onAddSIP={handleAddSIP}
              onDeleteMutualFund={handleDeleteMutualFund}
              onDeleteSIP={handleDeleteSIP}
              onTriggerSIPPayment={handleTriggerSIPPayment}
            />
          )}

          {activeTab === 'assets' && (
            <AssetsList
              assets={state.assets}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {activeTab === 'tax' && (
            <TaxCalculator salaryIncomeEstimate={salaryIncomeEstimate} />
          )}
        </div>

        {/* ☕ CARD-LIKE SIGNATURE FOOTER */}
        <div className="text-center pt-8 pb-10 flex flex-col items-center justify-center space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2 border border-slate-800/50 bg-slate-900/30 p-5 rounded-2xl shadow-inner max-w-sm w-full mx-auto">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="Government of India Logo" 
              className="h-16 w-auto drop-shadow-md brightness-110 sepia-[.3] hue-rotate-[-10deg] saturate-150"
              onError={(e) => {
                // Fallback for offline viewing
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-center mt-2">
              <h3 className="text-[14px] text-white font-bold tracking-widest uppercase">Government of India</h3>
              <p className="text-[10px] text-amber-500/90 font-bold tracking-wide uppercase mt-0.5">Pilot Project of Government of India</p>
              <p className="text-[8px] text-slate-400 font-medium tracking-[0.2em] uppercase mt-1">Satyameva Jayate</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 tracking-wide font-sans leading-relaxed">
            जन धन (Jan Dhan) • Secured Sandbox Container
          </p>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center justify-center space-x-1">
            <span>Developed by</span>
            {isEditingSignature ? (
              <input
                autoFocus
                type="text"
                className="bg-transparent border-b border-amber-500/50 text-amber-500 focus:outline-none w-48 text-center"
                value={signatureInput}
                onChange={(e) => setSignatureInput(e.target.value)}
                onBlur={() => {
                  setState(s => ({ ...s, developerSignature: signatureInput }));
                  setIsEditingSignature(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setState(s => ({ ...s, developerSignature: signatureInput }));
                    setIsEditingSignature(false);
                  }
                }}
              />
            ) : (
              <span 
                className="text-amber-500 cursor-pointer hover:text-amber-400 border-b border-transparent hover:border-amber-500/30 transition-colors"
                onClick={() => {
                  setSignatureInput(state.developerSignature || 'KOTTURI R R K SREEKANTH');
                  setIsEditingSignature(true);
                }}
              >
                {state.developerSignature || 'KOTTURI R R K SREEKANTH'}
              </span>
            )}
          </div>
        </div>
      </main>

      {/* 🧭 PREMIUM FLOATING MOBILE BOTTOM NAVIGATION (TAPS COMPATIBLE AT 44PX TARGETS) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border-t border-slate-800/80 pt-1 pb-safe z-50 shadow-2xl block">
        <div className="max-w-md mx-auto px-2 flex justify-around items-center">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center w-14 h-14 transition ${
              activeTab === 'overview' ? 'text-amber-500 scale-102' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight mt-1">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('parser')}
            className={`flex flex-col items-center justify-center w-14 h-14 transition ${
              activeTab === 'parser' ? 'text-amber-500 scale-102' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight mt-1">Parse AI</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center justify-center w-14 h-14 transition ${
              activeTab === 'accounts' ? 'text-amber-500 scale-102' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight mt-1">Banks</span>
          </button>

          <button
            onClick={() => setActiveTab('sips')}
            className={`flex flex-col items-center justify-center w-14 h-14 transition ${
              activeTab === 'sips' ? 'text-amber-500 scale-102' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight mt-1">SIPs</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`flex flex-col items-center justify-center w-14 h-14 transition ${
              activeTab === 'assets' ? 'text-amber-500 scale-102' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Landmark className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight mt-1">Assets Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`flex flex-col items-center justify-center w-14 h-14 transition ${
              activeTab === 'tax' ? 'text-amber-500 scale-102' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight mt-1">Tax</span>
          </button>

        </div>
      </nav>

      {/* 📚 MOBILE APK INSTALLATION DIALOG MODAL (FOOLPROOF PWA DOCUMENTATION OVERLAY) */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl p-6 space-y-5 animate-slide-up">
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                  Installation Guide
                </span>
                <h3 className="text-base font-black text-white">Download Companion App</h3>
              </div>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border border-slate-800 rounded-2xl overflow-hidden p-0.5 bg-slate-950">
              <button
                onClick={() => setDeviceOS('android')}
                className={`flex-1 py-2 text-[11px] font-semibold rounded-xl text-center transition ${
                  deviceOS === 'android' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                Android / Google
              </button>
              <button
                onClick={() => setDeviceOS('ios')}
                className={`flex-1 py-2 text-[11px] font-semibold rounded-xl text-center transition ${
                  deviceOS === 'ios' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                iPhone / iOS Safari
              </button>
            </div>

            {deviceOS === 'android' ? (
              <div className="space-y-3.5 text-xs text-slate-300">
                <p className="text-slate-400 text-[11px]">
                  Android WebAPK builds directly install native sandboxed packages onto your device without compiling complicated raw APK directories:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                    <p className="text-[11px] leading-relaxed">Open this platform link in <span className="font-bold text-white">Google Chrome</span> browser on your phone.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                    <p className="text-[11px] leading-relaxed">Tap the three-dots menu icon <span className="font-bold text-white">(⋮)</span> at the top-right of your screen.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">3</div>
                    <p className="text-[11px] font-bold text-white leading-relaxed">Select "Install App" or "Add to Home Screen".</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">4</div>
                    <p className="text-[11px] leading-relaxed">Chrome compiles the WebAPK package. The app now launch on your launcher screen!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs text-slate-300">
                <p className="text-slate-400 text-[11px]">
                  iPhone doesn't use standard `.apk` installers but supports Native Web Apps natively on Safari. Follow these steps:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                    <p className="text-[11px] leading-relaxed">Open this platform link in your iPhone's default <span className="font-bold text-white">Apple Safari</span> browser.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                    <p className="text-[11px] leading-relaxed">Tap the blue <span className="font-bold text-white">Share</span> button at the bottom navigation drawer.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">3</div>
                    <p className="text-[11px] font-bold text-white leading-relaxed">Scroll down and tap "Add to Home Screen" (➕).</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-500 text-[10px] font-black flex items-center justify-center shrink-0">4</div>
                    <p className="text-[11px] leading-relaxed">Tap "Add" at the top-right. Open it like a downloaded app!</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl active:scale-98 transition duration-150"
            >
              Done, Let's Start
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
