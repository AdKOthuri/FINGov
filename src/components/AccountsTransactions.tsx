/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CreditCard as CardIcon, Landmark, ArrowDownLeft, ArrowUpRight, Search, Plus, Filter, Check, Trash2, ShieldAlert, Sparkles, AlertCircle, QrCode, X, Bot, BarChart3 } from 'lucide-react';
import { BankAccount, CreditCard, Transaction } from '../types';
import QRCode from 'react-qr-code';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AccountsTransactionsProps {
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  onAddBankAccount: (account: Omit<BankAccount, 'id' | 'updatedAt'>) => void;
  onAddCreditCard: (card: Omit<CreditCard, 'id' | 'updatedAt'>) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'isAutomated'>) => void;
  onDeleteTransaction: (id: string) => void;
  onPayCreditBill: (cardId: string, fromAccountId: string) => void;
  onAutoCategorizeTransactions: () => void;
}

export function AccountsTransactions({
  bankAccounts,
  creditCards,
  transactions,
  onAddBankAccount,
  onAddCreditCard,
  onAddTransaction,
  onDeleteTransaction,
  onPayCreditBill,
  onAutoCategorizeTransactions
}: AccountsTransactionsProps) {
  // States
  const [showAddAcc, setShowAddAcc] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [selectedPayAccount, setSelectedPayAccount] = useState<string>('');
  const [showQR, setShowQR] = useState<{ upiId: string; name: string } | null>(null);

  // Form Inputs
  const [accName, setAccName] = useState('');
  const [accNum, setAccNum] = useState('');
  const [accUpi, setAccUpi] = useState('');
  const [accBal, setAccBal] = useState('');
  const [accType, setAccType] = useState<'Savings' | 'Current' | 'Fixed Deposit'>('Savings');

  const [cardName, setCardName] = useState('');
  const [cardDigits, setCardDigits] = useState('');
  const [cardBill, setCardBill] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDue, setCardDue] = useState('');

  const [txDesc, setTxDesc] = useState('');
  const [txAmt, setTxAmt] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txCat, setTxCat] = useState('Food');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txSrc, setTxSrc] = useState('');

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddAccSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accBal) return;
    onAddBankAccount({
      name: accName,
      accountNumber: accNum ? `*${accNum.slice(-4)}` : `*${Math.floor(1000 + Math.random() * 9000)}`,
      balance: parseFloat(accBal),
      type: accType,
      ...(accUpi && { upiId: accUpi })
    });
    setAccName('');
    setAccNum('');
    setAccUpi('');
    setAccBal('');
    setShowAddAcc(false);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardBill || !cardLimit || !cardDue) return;
    onAddCreditCard({
      name: cardName,
      cardNumber: cardDigits ? `*${cardDigits.slice(-4)}` : `*${Math.floor(1500 + Math.random() * 8000)}`,
      currentBill: parseFloat(cardBill),
      limit: parseFloat(cardLimit),
      dueDate: cardDue
    });
    setCardName('');
    setCardDigits('');
    setCardBill('');
    setCardLimit('');
    setCardDue('');
    setShowAddCard(false);
  };

  const handleAddTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc || !txAmt || !txSrc) return;
    onAddTransaction({
      description: txDesc,
      amount: parseFloat(txAmt),
      date: txDate,
      category: txCat,
      type: txType,
      source: txSrc
    });
    setTxDesc('');
    setTxAmt('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxSrc('');
    setShowAddTx(false);
  };

  const executeBillPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payingCardId && selectedPayAccount) {
      onPayCreditBill(payingCardId, selectedPayAccount);
      setPayingCardId(null);
      setSelectedPayAccount('');
    }
  };

  // --- Monthly Analytics Calculation ---
  const monthlyData = useMemo(() => {
    const expensesByMonth: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const txDate = new Date(tx.date);
        const monthYear = txDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        expensesByMonth[monthYear] = (expensesByMonth[monthYear] || 0) + tx.amount;
      }
    });

    return Object.keys(expensesByMonth)
      .sort((a, b) => { // Rough chronological sorting
        const [m1, y1] = a.split(' ');
        const [m2, y2] = b.split(' ');
        return new Date(`${m1} 20${y1}`).getTime() - new Date(`${m2} 20${y2}`).getTime();
      })
      .map(month => ({
        month,
        amount: expensesByMonth[month]
      }));
  }, [transactions]);

  const categories = ['All', 'Salary', 'Investments', 'Food', 'Shopping', 'Rent', 'Travel', 'Utilities', 'Taxes', 'Medical', 'Other'];

  return (
    <div id="balances-and-debts-workspace" className="space-y-6">
      
      {/* 💳 MOBILE BILLS & ACCOUNTS CARDS */}
      <div className="space-y-4">
        
        {/* Bank Balances Container */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
            <div>
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wide">Automated Bank Balances</h3>
              <p className="text-[10px] text-slate-400">Cash feeds synced automatically from statement OCR feeds</p>
            </div>
            <button
              onClick={() => setShowAddAcc(!showAddAcc)}
              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-500 font-bold rounded-lg text-[10px] flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Link Bank</span>
            </button>
          </div>

          {showAddAcc && (
            <form onSubmit={handleAddAccSubmit} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-2 space-y-3">
              <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Register Bank Account</h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                <div>
                  <label htmlFor="form-acc-name" className="block text-[9px] text-slate-500 mb-1">Bank Name</label>
                  <input
                    id="form-acc-name"
                    type="text"
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    placeholder="e.g. SBI Bank"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="form-acc-num" className="block text-[9px] text-slate-500 mb-1 font-sans">Account No.</label>
                  <input
                    id="form-acc-num"
                    type="text"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    placeholder="e.g. Last 4 digits"
                    value={accNum}
                    onChange={(e) => setAccNum(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="form-acc-upi" className="block text-[9px] text-slate-500 mb-1 font-sans">UPI ID (Optional)</label>
                  <input
                    id="form-acc-upi"
                    type="text"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    placeholder="e.g. phone@upi"
                    value={accUpi}
                    onChange={(e) => setAccUpi(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="form-acc-bal" className="block text-[9px] text-slate-500 mb-1">Balance (₹)</label>
                  <input
                    id="form-acc-bal"
                    type="number"
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    placeholder="e.g. 150000"
                    value={accBal}
                    onChange={(e) => setAccBal(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="form-acc-type" className="block text-[9px] text-slate-500 mb-1 font-sans">Account Category</label>
                  <select
                    id="form-acc-type"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1 border-t border-slate-900">
                <button type="button" onClick={() => setShowAddAcc(false)} className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" className="px-3.5 py-1 text-[10px] bg-amber-500 text-slate-950 font-black rounded-lg">Submit</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {bankAccounts.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-3 text-center">No bank accounts linked yet.</p>
            ) : (
              bankAccounts.map((acc) => (
                <div key={acc.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{acc.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{acc.accountNumber}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{acc.type} account</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        ₹{acc.balance.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[8px] text-slate-500 font-mono">Synced {new Date(acc.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {acc.upiId && (
                    <div className="flex justify-end border-t border-slate-800/50 pt-2 mt-1">
                      <button
                        onClick={() => setShowQR({ upiId: acc.upiId!, name: acc.name })}
                        className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-amber-500 hover:bg-slate-800 hover:text-amber-400 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold">Show Receive QR</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* QR Code Modal Overlay */}
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center space-y-5 shadow-2xl relative">
              <button 
                onClick={() => setShowQR(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center space-y-1 w-full border-b border-slate-800 pb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mx-auto mb-2">
                  <Landmark className="w-5 h-5" />
                </div>
                <h3 className="font-black text-white text-sm">{showQR.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">Scan to pay via any UPI App</p>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-inner">
                <QRCode
                  value={`upi://pay?pa=${showQR.upiId}&pn=${encodeURIComponent(showQR.name)}&cu=INR`}
                  size={200}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0b0f19"
                />
              </div>

              <div className="bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800 border-dashed w-full text-center">
                <span className="text-[11px] text-slate-300 font-mono font-medium tracking-wide">{showQR.upiId}</span>
              </div>
            </div>
          </div>
        )}

        {/* Credit Cards Outstanding */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
            <div>
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wide">Credit Card Statements</h3>
              <p className="text-[10px] text-slate-400">Track dynamic card balances, outstanding dues & bill cycles</p>
            </div>
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-500 font-bold rounded-lg text-[10px] flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Link Card</span>
            </button>
          </div>

          {showAddCard && (
            <form onSubmit={handleAddCardSubmit} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-2 space-y-3">
              <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Register Card</h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                <div>
                  <label htmlFor="form-cc-name" className="block text-[9px] text-slate-500 mb-1">Card Name</label>
                  <input
                    id="form-cc-name"
                    type="text"
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    placeholder="e.g. ICICI Coral"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="form-cc-num" className="block text-[9px] text-slate-500 mb-1">Last 4-digits</label>
                  <input
                    id="form-cc-num"
                    type="text"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    placeholder="e.g. 9921"
                    maxLength={4}
                    value={cardDigits}
                    onChange={(e) => setCardDigits(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="form-cc-bill" className="block text-[9px] text-slate-500 mb-1 font-sans">Current Bill Due (₹)</label>
                  <input
                    id="form-cc-bill"
                    type="number"
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    placeholder="e.g. 18450"
                    value={cardBill}
                    onChange={(e) => setCardBill(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="form-cc-limit" className="block text-[9px] text-slate-500 mb-1">Credit Limit (₹)</label>
                  <input
                    id="form-cc-limit"
                    type="number"
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    placeholder="e.g. 300000"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="form-cc-due" className="block text-[9px] text-slate-500 mb-1 font-sans">Due Date</label>
                  <input
                    id="form-cc-due"
                    type="date"
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    value={cardDue}
                    onChange={(e) => setCardDue(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1 border-t border-slate-900">
                <button type="button" onClick={() => setShowAddCard(false)} className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" className="px-3.5 py-1 text-[10px] bg-amber-500 text-slate-950 font-black rounded-lg">Submit</button>
              </div>
            </form>
          )}

          <div className="space-y-3.5">
            {creditCards.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-3 text-center">No credit cards recorded.</p>
            ) : (
              creditCards.map((card) => {
                const utilRatio = card.limit > 0 ? (card.currentBill / card.limit) * 100 : 0;
                return (
                  <div key={card.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 hover:border-slate-800 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-purple-550/10 text-purple-400 rounded-lg">
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{card.name}</div>
                          <div className="text-[8px] text-slate-500 font-mono">{card.cardNumber}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-rose-450">
                          ₹{card.currentBill.toLocaleString('en-IN')}
                        </div>
                        {card.currentBill > 0 ? (
                          <div className="text-[8px] text-rose-400 font-semibold font-sans">
                            Due {new Date(card.dueDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-[8px] text-emerald-400 font-semibold font-sans flex items-center justify-end space-x-0.5">
                            <Check className="w-2.5 h-2.5 inline" />
                            <span>Paid</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Utilization Slide indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>Utilization: {utilRatio.toFixed(0)}%</span>
                        <span>Limit: ₹{card.limit.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${utilRatio > 40 ? 'bg-amber-500' : 'bg-purple-500'}`} 
                          style={{ width: `${Math.min(100, utilRatio)}%` }}
                        />
                      </div>
                    </div>

                    {/* Pay Bill Form trigger */}
                    {card.currentBill > 0 && (
                      <div className="pt-2 flex justify-end">
                        {payingCardId === card.id ? (
                          <form onSubmit={executeBillPayment} className="w-full flex items-center justify-between gap-2 border-t border-slate-900 pt-2">
                            <span className="text-[9px] text-slate-400 font-bold shrink-0">Source Acc:</span>
                            <select
                              required
                              className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-[10px] font-mono flex-grow"
                              value={selectedPayAccount}
                              onChange={(e) => setSelectedPayAccount(e.target.value)}
                            >
                              <option value="">-- Choose Account --</option>
                              {bankAccounts.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name} (Bal: ₹{b.balance.toLocaleString('en-IN')})
                                </option>
                              ))}
                            </select>
                            <div className="flex space-x-1 shrink-0">
                              <button type="submit" className="px-2 py-1 bg-emerald-500 text-slate-950 rounded text-[9px] font-extrabold hover:bg-emerald-600">Pay</button>
                              <button type="button" onClick={() => setPayingCardId(null)} className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[9px] hover:text-white">X</button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => {
                              setPayingCardId(card.id);
                              if (bankAccounts.length > 0) setSelectedPayAccount(bankAccounts[0].id);
                            }}
                            className="text-[9px] px-2.5 py-1 bg-slate-900 active:scale-95 text-slate-300 hover:text-white border border-slate-800 rounded-lg font-medium transition"
                          >
                            Pay Bill via Bank Payout
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 📊 MONTHLY TRANSACTION ANALYTICS */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl mb-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
          <div>
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wide flex items-center space-x-1">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Spend Analytics</span>
            </h3>
            <p className="text-[10px] text-slate-400">Monthly expense velocity tracker</p>
          </div>
          <button
            onClick={() => onAutoCategorizeTransactions()}
            className="p-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-[9px] font-bold tracking-wide flex items-center gap-1.5 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Auto Categorise</span>
          </button>
        </div>

        {monthlyData.length === 0 ? (
          <p className="text-[10px] text-slate-500 py-6 text-center bg-slate-950/40 rounded-xl border border-slate-850/30">
            Insufficient data for analytics.
          </p>
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val>=1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? '#f59e0b' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 🔮 FULL-TOUCH MOBILE COMPANION TRANSACTION LOGS CONSOLE */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-xl">
        
        <div className="flex flex-col gap-3 pb-3 border-b border-slate-800/60">
          <div>
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wide">Statement Logs Tracker</h3>
            <p className="text-[10px] text-slate-400">Search and filter manual feeds against uploaded file parse indices</p>
          </div>

          <div className="space-y-2">
            
            {/* 🔍 THE PREMIUM MOBILE TRANSACTION SEACH BAR (GLOWS IN DEEP AMBER FOCUS) */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-950 border border-slate-800/80 rounded-xl focus:border-amber-500/40 text-slate-200 placeholder-slate-500 transition-all focus:outline-none"
                placeholder="Search transactions, merchants, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="tx-search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2 text-[10px] bg-slate-800 text-slate-400 hover:text-white px-2 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Category selector */}
              <div className="flex-1 flex items-center space-x-1 border border-slate-850 bg-slate-950 rounded-xl px-2.5 py-1 text-[11px] text-slate-400">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  className="w-full bg-transparent border-none text-slate-300 text-[10px] focus:outline-none focus:ring-0 cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  id="category-filter-select"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
              </div>

              {/* Add transaction modal triggers */}
              <button
                onClick={() => setShowAddTx(!showAddTx)}
                className="p-1 px-3 bg-amber-500 text-slate-950 text-[10px] font-black rounded-xl flex items-center space-x-1 hover:bg-amber-600 transition"
              >
                <Plus className="w-3 h-3 text-slate-950 stroke-[3]" />
                <span>Add Record</span>
              </button>
            </div>

          </div>
        </div>

        {/* Manual Addition Form */}
        {showAddTx && (
          <form onSubmit={handleAddTxSubmit} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex flex-col space-y-3 text-xs">
            <h4 className="font-extrabold text-amber-500 uppercase text-[9px] tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Record Manual Expense / Income</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="form-tx-desc" className="block text-[9px] text-slate-500 mb-1">Description / Merchant</label>
                <input
                  id="form-tx-desc"
                  type="text"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-90 border border-slate-800 rounded-lg text-white"
                  placeholder="e.g. Reliance Mart, Rent"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="form-tx-amount" className="block text-[9px] text-slate-500 mb-1">Amount (₹)</label>
                <input
                  id="form-tx-amount"
                  type="number"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-90 border border-slate-800 rounded-lg text-white font-mono"
                  placeholder="e.g. 2500"
                  value={txAmt}
                  onChange={(e) => setTxAmt(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="form-tx-date" className="block text-[9px] text-slate-500 mb-1 font-sans">Transaction Date</label>
                <input
                  id="form-tx-date"
                  type="date"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-90 border border-slate-800 rounded-lg text-white text-[11px] font-mono"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="form-tx-type" className="block text-[9px] text-slate-500 mb-1">Type</label>
                <select
                  id="form-tx-type"
                  className="w-full px-2.5 py-1.5 bg-slate-90 border border-slate-800 rounded-lg text-white"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                >
                  <option value="expense">Expense (-)</option>
                  <option value="income">Income (+)</option>
                </select>
              </div>

              <div>
                <label htmlFor="form-tx-cat" className="block text-[9px] text-slate-500 mb-1 font-sans">Category</label>
                <select
                  id="form-tx-cat"
                  className="w-full px-2.5 py-1.5 bg-slate-90 border border-slate-800 rounded-lg text-white"
                  value={txCat}
                  onChange={(e) => setTxCat(e.target.value)}
                >
                  {categories.slice(1).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="form-tx-source-wallet" className="block text-[9px] text-slate-500 mb-1">Source Account / Card</label>
                <input
                  id="form-tx-source-wallet"
                  type="text"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-90 border border-slate-800 rounded-lg text-white"
                  placeholder="e.g. HDFC Savings"
                  value={txSrc}
                  onChange={(e) => setTxSrc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1 border-t border-slate-900">
              <button type="button" onClick={() => setShowAddTx(false)} className="px-2.5 py-1 text-[10px] bg-slate-900 rounded-lg">Cancel</button>
              <button type="submit" className="px-3.5 py-1 text-[10px] bg-amber-500 text-slate-950 font-black rounded-lg">Add Record</button>
            </div>
          </form>
        )}

        {/* 📲 TACTILE MOBILE TRANSACTION CARD LISTS (ELIMINATES CLUMSY WEB OVERFLOWS) */}
        <div id="transactions-log-mobile-holder" className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredTransactions.length === 0 ? (
            <p className="text-[10px] text-slate-500 py-6 text-center bg-slate-950/40 rounded-xl border border-slate-850/30">
              No transactions match safety criteria.
            </p>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div 
                  key={tx.id} 
                  className="p-3 bg-slate-950/70 border border-slate-850/60 rounded-xl hover:border-slate-800/80 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate max-w-[170px]">{tx.description}</div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[8px] font-mono text-slate-500">{new Date(tx.date).toLocaleDateString()}</span>
                        <span className="text-[8px] px-1.5 py-0.25 bg-slate-900 text-slate-400 rounded-full font-semibold">{tx.category}</span>
                        <span className="text-[8px] text-slate-500 truncate max-w-[70px]">{tx.source}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <div className={`text-xs font-black font-mono ${isIncome ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[8px] text-slate-500">
                        {tx.isAutomated ? 'AI parsed' : 'Manual'}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg active:scale-90 transition-all"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
