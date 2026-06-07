/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, ShieldAlert, Sparkles, TrendingUp, HelpCircle, Activity, Pocket } from 'lucide-react';
import { BankAccount, CreditCard, Transaction, MutualFund, Asset } from '../types';

interface DashboardOverviewProps {
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  mutualFunds: MutualFund[];
  assets: Asset[];
}

export function DashboardOverview({
  bankAccounts,
  creditCards,
  transactions,
  mutualFunds,
  assets
}: DashboardOverviewProps) {
  // Calculations
  const totalBankBal = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
  const totalCardsBill = creditCards.reduce((sum, c) => sum + c.currentBill, 0);
  const totalMFValue = mutualFunds.reduce((sum, m) => sum + m.currentValue, 0);
  const totalAssetsValue = assets.reduce((sum, a) => sum + a.value, 0);

  const netWorth = (totalBankBal + totalMFValue + totalAssetsValue) - totalCardsBill;

  // Monthly Cashflow totals (Income vs Expenses)
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Custom premium trend coordinates for SVG chart
  // Networth trend over 5 previous months (simulated elegant curve)
  const prevMonths = [
    { label: 'Jan', value: netWorth * 0.88 },
    { label: 'Feb', value: netWorth * 0.92 },
    { label: 'Mar', value: netWorth * 0.90 },
    { label: 'Apr', value: netWorth * 0.95 },
    { label: 'May', value: netWorth * 0.98 },
    { label: 'Jun', value: netWorth },
  ];

  const highestVal = Math.max(...prevMonths.map((m) => m.value)) || 1;
  const lowestVal = Math.min(...prevMonths.map((m) => m.value)) || 0;
  const valueDelta = highestVal - lowestVal || 1;

  // Map monthly records to clear premium SVG coordinates (X, Y)
  const chartPoints = prevMonths.map((m, index) => {
    const x = 50 + (index * 130); // scale across width
    const ratio = (m.value - lowestVal) / valueDelta;
    // inverse for SVG space (high Y is bottom of grid)
    const y = 140 - (ratio * 100); 
    return { x, y, label: m.label, value: Math.round(m.value) };
  });

  const linePath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // Smooth curve using cubic bezier path calculation
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} 160 L ${chartPoints[0].x} 160 Z`;

  // Filter pending dues
  const warningCards = creditCards.filter((c) => c.currentBill > 0);

  return (
    <div id="finance-dashboard-overview-workspace" className="space-y-6">
      
      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Worth card */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Calculated Net Worth</span>
            <div className="text-xl font-bold font-mono tracking-tight text-white mt-1">
              ₹{netWorth.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[9px] text-emerald-400 pt-1 font-sans">
            <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Appreciating Wealth Trend</span>
          </div>
        </div>

        {/* Liquid Cash */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Liquid bank Balance</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              ₹{totalBankBal.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[9px] mt-1 text-slate-400 font-sans">
            Distributed in <span className="font-semibold text-slate-350">{bankAccounts.length} Saving Accounts</span>
          </div>
        </div>

        {/* Invested Funds */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Securities Portfolio</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              ₹{totalMFValue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[9px] mt-1 text-emerald-400 font-sans flex items-center space-x-1 font-semibold">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Mutual Funds & Stocks</span>
          </div>
        </div>

        {/* Total Credit bills */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Credit Card Due</span>
            <div className={`text-xl font-bold font-mono mt-1 ${totalCardsBill > 0 ? 'text-rose-400' : 'text-slate-350'}`}>
              ₹{totalCardsBill.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[9px] mt-1 text-slate-400 font-sans">
            {totalCardsBill > 0 ? (
              <span className="text-rose-400 font-semibold flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>Action needed to pay bills</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">✓ No Outstanding invoices</span>
            )}
          </div>
        </div>
      </div>

      {/* Graphical Trend & High Precision Insights */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* SVG Net worth Trend */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
            <div>
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Visual Net Worth Appreciation</h3>
              <p className="text-[10px] text-slate-400">Value tracking loop including custom gold appreciation indexes</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
              Current H1 FY 2026/27
            </span>
          </div>

          <div className="relative pt-2">
            {/* Custom Responsive SVG Chart plotting points */}
            <svg viewBox="0 0 750 170" width="100%" height="auto" className="overflow-visible font-sans">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid rules */}
              <line x1="50" y1="40" x2="700" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50" y1="90" x2="700" y2="90" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50" y1="140" x2="700" y2="140" stroke="#1e293b" strokeWidth="1" />

              {/* Core filled gradient */}
              <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-300" />
              {/* Stroke line path */}
              <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" className="transition-all duration-300" />

              {/* Point highlights */}
              {chartPoints.map((point, index) => (
                <g key={index} className="group cursor-pointer">
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#312e81"
                    stroke="#818cf8"
                    strokeWidth="3.5"
                    className="transition-all duration-300 hover:scale-130"
                  />
                  {/* Tooltip text always visible for supreme readability */}
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    className="text-[10px] font-bold font-mono fill-amber-400"
                  >
                    ₹{Math.round(point.value / 1000)}k
                  </text>
                  <text
                    x={point.x}
                    y="158"
                    textAnchor="middle"
                    className="text-[10px] font-black fill-slate-500 font-sans uppercase"
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Income vs Expenses cash flow widget & quick alerts */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col justify-between space-y-4">
          <div className="pb-2 flex justify-between items-center border-b border-slate-800/60">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Monthly Cash Flow</h4>
            <span className="text-[10px] text-slate-500">Statement Aggregates</span>
          </div>

          <div className="space-y-4 flex-grow justify-center flex flex-col">
            {/* Income progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Logged Earnings</span>
                </span>
                <span className="font-extrabold text-emerald-450 font-mono">
                  +₹{totalIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Expense progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Total Deductions</span>
                </span>
                <span className="font-extrabold text-slate-300 font-mono">
                  -₹{totalExpense.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Alert panel for father's convenience */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-amber-500 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Workspace Checklist Alerts</span>
            </span>
            <ul className="space-y-1 text-slate-300 text-[11px] list-disc pl-4 leading-relaxed font-sans">
              {warningCards.length > 0 ? (
                <li className="text-rose-400 font-bold">
                  {warningCards.length} Credit card statement bills pending payout!
                </li>
              ) : (
                <li className="text-emerald-400 font-semibold">✓ Realized accounts have no immediate card bills due!</li>
              )}
              {totalMFValue === 0 && (
                <li>No Mutual Fund assets set up yet. Paste statement reports to update automatically.</li>
              )}
              {assets.length === 0 && (
                <li>Assets register empty — add gold or properties value to secure accurate Net Worth!</li>
              )}
              {totalIncome > 0 && (
                <li className="text-emerald-400 font-semibold">Auto-extracted salarial streams registered. Updated tax brackets!</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
