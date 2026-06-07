/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrendingUp, Plus, DollarSign, Calendar, IndianRupee, Trash2, ArrowUpRight, ChevronRight, Calculator, PieChart } from 'lucide-react';
import { MutualFund, SIP } from '../types';

interface SIPMutualFundsProps {
  mutualFunds: MutualFund[];
  sips: SIP[];
  onAddMutualFund: (fund: Omit<MutualFund, 'id'>) => void;
  onAddSIP: (sip: Omit<SIP, 'id'>) => void;
  onDeleteMutualFund: (id: string) => void;
  onDeleteSIP: (id: string) => void;
  onTriggerSIPPayment: (sipId: string) => void;
}

export function SIPMutualFunds({
  mutualFunds,
  sips,
  onAddMutualFund,
  onAddSIP,
  onDeleteMutualFund,
  onDeleteSIP,
  onTriggerSIPPayment
}: SIPMutualFundsProps) {
  // Add dialog states
  const [showFundForm, setShowFundForm] = useState(false);
  const [showSipForm, setShowSipForm] = useState(false);

  // New Fund Data Form state
  const [fundName, setFundName] = useState('');
  const [folioNumber, setFolioNumber] = useState('');
  const [units, setUnits] = useState('');
  const [investedValue, setInvestedValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');

  // New SIP Form state
  const [sipFundName, setSipFundName] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [sipFreq, setSipFreq] = useState<'Monthly' | 'Quarterly' | 'Weekly'>('Monthly');
  const [sipStartDate, setSipStartDate] = useState('2026-06-10');

  // Interactive SIP Calculator states (More Tools)
  const [calcSipAmount, setCalcSipAmount] = useState<number>(10000); // 10k monthly
  const [calcRate, setCalcRate] = useState<number>(12); // 12% returns
  const [calcYears, setCalcYears] = useState<number>(10); // 10 years

  // Calculate calculations
  const monthlyRate = calcRate / (12 * 100);
  const totalMonths = calcYears * 12;
  // SIP formula: M = P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
  const totalAccumulated = Math.round(
    calcSipAmount *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
    (1 + monthlyRate)
  );
  const totalSipInvested = calcSipAmount * totalMonths;
  const estimatedReturns = Math.max(0, totalAccumulated - totalSipInvested);

  // Form handling
  const handleAddFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundName || !units || !investedValue || !currentValue) return;

    onAddMutualFund({
      fundName,
      folioNumber: folioNumber || `${Math.floor(1000 + Math.random() * 9000)}/${Math.floor(100 + Math.random() * 900)}`,
      units: parseFloat(units),
      investedValue: parseFloat(investedValue),
      currentValue: parseFloat(currentValue),
      lastNavUpdate: new Date().toISOString().split('T')[0],
    });

    // Reset
    setFundName('');
    setFolioNumber('');
    setUnits('');
    setInvestedValue('');
    setCurrentValue('');
    setShowFundForm(false);
  };

  const handleAddSIPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sipFundName || !sipAmount) return;

    // Calculate generic next payment date (e.g. standard next month same date)
    const baseDate = new Date(sipStartDate);
    baseDate.setMonth(baseDate.getMonth() + 1);
    const nextPaymentDate = baseDate.toISOString().split('T')[0];

    onAddSIP({
      fundName: sipFundName,
      amount: parseFloat(sipAmount),
      frequency: sipFreq,
      startDate: sipStartDate,
      nextPaymentDate,
      investedValue: 0,
      currentValue: 0,
    });

    setSipFundName('');
    setSipAmount('');
    setSipStartDate('2026-06-10');
    setShowSipForm(false);
  };

  // Portfolio total statistics
  const totalMFInvested = mutualFunds.reduce((sum, f) => sum + f.investedValue, 0);
  const totalMFCurrent = mutualFunds.reduce((sum, f) => sum + f.currentValue, 0);
  const totalMFGain = totalMFCurrent - totalMFInvested;
  const totalMFGainPercent = totalMFInvested > 0 ? (totalMFGain / totalMFInvested) * 100 : 0;

  return (
    <div id="sip-mutual-funds-workspace" className="space-y-6">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Mutual Funds Hold</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-1">
              ₹{totalMFCurrent.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Invested Capital</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-1">
              ₹{totalMFInvested.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Profit / Loss</span>
            <div className={`text-xl font-bold font-mono mt-1 ${totalMFGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{totalMFGain.toLocaleString('en-IN')} ({totalMFGainPercent.toFixed(1)}%)
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${totalMFGain >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <ArrowUpRight className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Portfolio Holdings & SIP Calendar */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Mutual Fund Table */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Direct Mutual Funds Portfolio</h3>
                <p className="text-xs text-slate-500">Live holdings, allocations and current valuations</p>
              </div>
              <button
                onClick={() => setShowFundForm(!showFundForm)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Holding</span>
              </button>
            </div>

            {showFundForm && (
              <form onSubmit={handleAddFundSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">New Mutual Fund Asset</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label id="lbl-fundname" htmlFor="form-fund-name" className="block text-[11px] text-slate-500 mb-1">Fund Name</label>
                    <input
                      id="form-fund-name"
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. Axis Bluechip Fund"
                      value={fundName}
                      onChange={(e) => setFundName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label id="lbl-folio" htmlFor="form-folio-num" className="block text-[11px] text-slate-500 mb-1">Folio (Optional)</label>
                    <input
                      id="form-folio-num"
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. 9840/291"
                      value={folioNumber}
                      onChange={(e) => setFolioNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label id="lbl-units" htmlFor="form-fund-units" className="block text-[11px] text-slate-500 mb-1">Total Units Owned</label>
                    <input
                      id="form-fund-units"
                      type="number"
                      step="any"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. 248.91"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label id="lbl-invested" htmlFor="form-fund-invested" className="block text-[11px] text-slate-500 mb-1">Invested Capital (₹)</label>
                    <input
                      id="form-fund-invested"
                      type="number"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. 50000"
                      value={investedValue}
                      onChange={(e) => setInvestedValue(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label id="lbl-currval" htmlFor="form-fund-current" className="block text-[11px] text-slate-500 mb-1">Current Value (₹)</label>
                    <input
                      id="form-fund-current"
                      type="number"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. 58240"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowFundForm(false)} className="px-3 py-1.5 text-xs border rounded-lg text-slate-600">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-xs bg-slate-950 text-white rounded-lg">Register Assets</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              {mutualFunds.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No mutual funds loaded yet. Ingest via the AI parser above or add one manually.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">Fund Holdings</th>
                      <th className="py-2.5 text-right">Units</th>
                      <th className="py-2.5 text-right">Invested Value</th>
                      <th className="py-2.5 text-right">Current Valuation</th>
                      <th className="py-2.5 text-right text-emerald-600">Total Profit</th>
                      <th className="py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-mono">
                    {mutualFunds.map((fund) => {
                      const profitVal = fund.currentValue - fund.investedValue;
                      const profitPerc = fund.investedValue > 0 ? (profitVal / fund.investedValue) * 100 : 0;
                      return (
                        <tr key={fund.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-sans font-medium text-slate-800">
                            <span className="block truncate max-w-[190px]">{fund.fundName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Folio: {fund.folioNumber}</span>
                          </td>
                          <td className="py-3 text-right">{fund.units.toFixed(3)}</td>
                          <td className="py-3 text-right text-slate-500">₹{fund.investedValue.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-right font-bold text-slate-800">₹{fund.currentValue.toLocaleString('en-IN')}</td>
                          <td className={`py-3 text-right font-bold ${profitVal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {profitVal >= 0 ? '+' : ''}₹{profitVal.toLocaleString('en-IN')} ({profitPerc.toFixed(1)}%)
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => onDeleteMutualFund(fund.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                              title="Delete Holding"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* SIP Reminders & Calendars */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Active SIP Scheduler Tracker</h3>
                <p className="text-xs text-slate-500">Automated reminders — process SIP to auto-update total mutual fund valuation</p>
              </div>
              <button
                onClick={() => setShowSipForm(!showSipForm)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register SIP</span>
              </button>
            </div>

            {showSipForm && (
              <form onSubmit={handleAddSIPSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Set Up Scheduled SIP</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label id="lbl-sipfund" htmlFor="form-sip-name" className="block text-[11px] text-slate-500 mb-1">Associated Fund Name</label>
                    <input
                      id="form-sip-name"
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. SBI Contra Fund"
                      value={sipFundName}
                      onChange={(e) => setSipFundName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label id="lbl-sipamt" htmlFor="form-sip-amount" className="block text-[11px] text-slate-500 mb-1">Monthly Cost (₹)</label>
                    <input
                      id="form-sip-amount"
                      type="number"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. 10000"
                      value={sipAmount}
                      onChange={(e) => setSipAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label id="lbl-sipfreq" htmlFor="form-sip-freq" className="block text-[11px] text-slate-500 mb-1">Frequency</label>
                    <select
                      id="form-sip-freq"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      value={sipFreq}
                      onChange={(e) => setSipFreq(e.target.value as any)}
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                    </select>
                  </div>
                  <div>
                    <label id="lbl-sipstart" htmlFor="form-sip-start" className="block text-[11px] text-slate-500 mb-1">Registered Start Date</label>
                    <input
                      id="form-sip-start"
                      type="date"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      value={sipStartDate}
                      onChange={(e) => setSipStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowSipForm(false)} className="px-3 py-1.5 text-xs border rounded-lg text-slate-600">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-xs bg-slate-950 text-white rounded-lg">Register SIP Task</button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {sips.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No scheduled SIP reminders configured.
                </div>
              ) : (
                sips.map((sip) => (
                  <div key={sip.id} className="p-3.5 border border-slate-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2.5 sm:space-y-0 hover:border-indigo-100/60 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">{sip.fundName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {sip.frequency} Installment • Next Scheduled Payment: <span className="font-mono text-slate-600">{sip.nextPaymentDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right font-mono text-xs font-bold text-slate-700">
                        ₹{sip.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onTriggerSIPPayment(sip.id)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px] transition shadow-sm flex items-center space-x-1"
                        >
                          <span>Execute SIP Payment</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteSIP(sip.id)}
                          className="p-1 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete SIP Scheduler"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive SIP Growth Planner (More Tools) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5 h-fit">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-50">
            <Calculator className="w-4.5 h-4.5 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Interactive Growth Estimator</h3>
              <p className="text-[10px] text-slate-400">Plan and simulate future wealth build-up</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="range-sip-amt" className="flex justify-between text-[11px] text-slate-600 font-semibold mb-1">
                <span>Monthly SIP Installation</span>
                <span className="font-mono text-indigo-600">₹{calcSipAmount.toLocaleString('en-IN')}</span>
              </label>
              <input
                id="range-sip-amt"
                type="range"
                min="1000"
                max="100000"
                step="1000"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                value={calcSipAmount}
                onChange={(e) => setCalcSipAmount(Number(e.target.value))}
              />
            </div>

            <div>
              <label htmlFor="range-sip-rate" className="flex justify-between text-[11px] text-slate-600 font-semibold mb-1">
                <span>Expected Interest Rate</span>
                <span className="font-mono text-indigo-600">{calcRate}% per year</span>
              </label>
              <input
                id="range-sip-rate"
                type="range"
                min="5"
                max="25"
                step="0.5"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
              />
            </div>

            <div>
              <label htmlFor="range-sip-years" className="flex justify-between text-[11px] text-slate-600 font-semibold mb-1">
                <span>Duration Period</span>
                <span className="font-mono text-indigo-600">{calcYears} Years</span>
              </label>
              <input
                id="range-sip-years"
                type="range"
                min="1"
                max="30"
                step="1"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                value={calcYears}
                onChange={(e) => setCalcYears(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Graphical Split SVG */}
          <div className="pt-2 flex justify-center">
            <svg width="180" height="180" viewBox="0 0 100 100" className="rotate-270 drop-shadow-sm">
              {/* Circular dual chart */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="11"
              />
              {/* Invested circular fraction */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#6366f1"
                strokeWidth="11"
                strokeDasharray={`${(totalSipInvested / totalAccumulated) * 238.76} 238.76`}
                className="transition-all duration-300"
              />
              {/* Return circular fraction remaining */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="11"
                strokeDasharray={`${(estimatedReturns / totalAccumulated) * 238.76} 238.76`}
                strokeDashoffset={`-${(totalSipInvested / totalAccumulated) * 238.76}`}
                className="transition-all duration-300"
              />
            </svg>
          </div>

          <div className="p-3 bg-slate-50/50 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-500 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                <span>Invested Wealth</span>
              </span>
              <span className="font-mono text-slate-800">₹{totalSipInvested.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-500 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                <span>Est. Gains</span>
              </span>
              <span className="font-mono text-emerald-600">₹{estimatedReturns.toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t border-slate-100 pt-2 flex items-center justify-between font-bold text-slate-800 text-sm">
              <span>Future Net Assets</span>
              <span className="font-mono">₹{totalAccumulated.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
