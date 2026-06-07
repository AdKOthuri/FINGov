/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, Info, Check, HelpCircle, Lightbulb } from 'lucide-react';
import { Transaction } from '../types';

interface TaxCalculatorProps {
  salaryIncomeEstimate?: number;
}

export function TaxCalculator({ salaryIncomeEstimate = 0 }: TaxCalculatorProps) {
  const [grossIncome, setGrossIncome] = useState<number>(() => {
    return salaryIncomeEstimate > 0 ? salaryIncomeEstimate : 1200000; // default 12L
  });
  
  const [otherIncome, setOtherIncome] = useState<number>(30000);
  const [section80C, setSection80C] = useState<number>(150000); // Standard max 1.5L
  const [section80D, setSection80D] = useState<number>(25000);  // Health insurance max 25k (can select up to 50k for senior parents!)
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(true); // Since it's for his father, let's default to Senior Parent / Retired/Senior!
  const [hraDeduction, setHraDeduction] = useState<number>(50000);
  const [customDeductions, setCustomDeductions] = useState<number>(0);

  // Update gross balance when salary updates from transaction lists
  useEffect(() => {
    if (salaryIncomeEstimate > 0) {
      setGrossIncome(salaryIncomeEstimate);
    }
  }, [salaryIncomeEstimate]);

  // Max cap 80C to 1,50,000
  const effective80C = Math.min(section80C, 150000);
  // Max cap 80D: 25,000 for non-seniors, 50,000 for senior citizens (his father)
  const max80D = isSeniorCitizen ? 50000 : 25000;
  const effective80D = Math.min(section80D, max80D);

  const calculateOldRegimeTax = (taxable: number) => {
    // Standard deduction for old regime is ₹50,000
    const netTaxable = Math.max(0, taxable - 50000 - effective80C - effective80D - hraDeduction - customDeductions);
    
    let tax = 0;
    const slabs = isSeniorCitizen 
      ? [
          { limit: 300000, rate: 0 },
          { limit: 500000, rate: 0.05 },
          { limit: 1000000, rate: 0.20 },
          { limit: Infinity, rate: 0.30 }
        ]
      : [
          { limit: 250000, rate: 0 },
          { limit: 500000, rate: 0.05 },
          { limit: 1000000, rate: 0.20 },
          { limit: Infinity, rate: 0.30 }
        ];

    let prevLimit = 0;
    for (let slab of slabs) {
      if (netTaxable > prevLimit) {
        const taxableInSlab = Math.min(netTaxable - prevLimit, slab.limit - prevLimit);
        tax += taxableInSlab * slab.rate;
        prevLimit = slab.limit;
      } else {
        break;
      }
    }

    // Tax Rebate u/s 87A: If Net taxable income <= 5 Lakhs, no tax
    if (netTaxable <= 500000) {
      tax = 0;
    }

    // Health and Education Cess is 4%
    const cess = tax * 0.04;
    return {
      taxableIncome: netTaxable,
      baseTax: tax,
      cess,
      totalTax: tax + cess,
      deductionsApplied: 50000 + effective80C + effective80D + hraDeduction + customDeductions
    };
  };

  const calculateNewRegimeTax = (taxable: number) => {
    // Standard deduction for New Regime is ₹75,000 (updated budget)
    // No other deductions allowed (80C, 80D, HRA are zero)
    const netTaxable = Math.max(0, taxable - 75000);
    
    let tax = 0;
    const slabs = [
      { limit: 300000, rate: 0 },
      { limit: 700000, rate: 0.05 },
      { limit: 1000000, rate: 0.10 },
      { limit: 1200000, rate: 0.15 },
      { limit: 1500000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ];

    let prevLimit = 0;
    for (let slab of slabs) {
      if (netTaxable > prevLimit) {
        const taxableInSlab = Math.min(netTaxable - prevLimit, slab.limit - prevLimit);
        tax += taxableInSlab * slab.rate;
        prevLimit = slab.limit;
      } else {
        break;
      }
    }

    // Tax Rebate u/s 87A: In new regime, if taxable income <= ₹7,00,000 or (7L after Standard deduction, so effectively 7.75L salary), tax is NIL
    if (netTaxable <= 700000) {
      tax = 0;
    }

    const cess = tax * 0.04;
    return {
      taxableIncome: netTaxable,
      baseTax: tax,
      cess,
      totalTax: tax + cess,
      deductionsApplied: 75000
    };
  };

  const totalInputs = grossIncome + otherIncome;
  const oldRegime = calculateOldRegimeTax(totalInputs);
  const newRegime = calculateNewRegimeTax(totalInputs);
  const netSavedByNew = oldRegime.totalTax - newRegime.totalTax;
  const recommendation = netSavedByNew > 0 
    ? { regime: 'New Tax Regime', savings: netSavedByNew, note: 'The New Regime yields a higher standard deduction and has lower slab rate structures.' }
    : { regime: 'Old Tax Regime', savings: Math.abs(netSavedByNew), note: 'The Old Regime is better for you because you have substantial investments (80C, 80D, HRA) which reduce taxable salary.' };

  return (
    <div id="it-tax-workspace" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-50">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 text-lg">IT Tax Optimization & Slabs</h2>
          <p className="text-xs text-slate-500">Compare New vs Old Indian tax regimes to maximize savings for Parents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Fields */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gross-salary" className="block text-xs font-semibold text-slate-500 mb-1">
                Gross Annual Income (Salary / Pension)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-medium">₹</span>
                <input
                  id="gross-salary"
                  type="number"
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={grossIncome === 0 ? '' : grossIncome}
                  onChange={(e) => setGrossIncome(Number(e.target.value))}
                />
              </div>
              {salaryIncomeEstimate > 0 && (
                <button 
                  onClick={() => setGrossIncome(salaryIncomeEstimate)} 
                  className="mt-1 text-[10px] text-emerald-600 hover:underline hover:text-emerald-700"
                >
                  Apply {`₹${salaryIncomeEstimate.toLocaleString('en-IN')}`} salary from transactions
                </button>
              )}
            </div>

            <div>
              <label htmlFor="other-income" className="block text-xs font-semibold text-slate-500 mb-1">
                Other Interest / Rent Income
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-medium font-sans">₹</span>
                <input
                  id="other-income"
                  type="number"
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={otherIncome === 0 ? '' : otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
              <span>Is Parent / Senior Citizen (Aged 60+)?</span>
              <Info className="w-3.5 h-3.5 text-indigo-400 cursor-help" title="Provides standard lower slab tax exemption up to ₹3,00,000 net slab instead of ₹2,50,000" />
            </span>
            <button
              onClick={() => setIsSeniorCitizen(!isSeniorCitizen)}
              className={`w-11 h-6 relative inline-flex items-center rounded-all rounded-full transition-colors focus:outline-none ${isSeniorCitizen ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isSeniorCitizen ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Deductions segment (only applicable to Old Regime) */}
          <div className="p-4 bg-slate-50/20 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Investment Deductions (Only fits Old Regime)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="80c-deductions" className="block text-[11px] text-slate-500 mb-0.5">
                  Sec 80C (PPF, EPF, ELSS, Insurance)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                  <input
                    id="80c-deductions"
                    type="number"
                    max="150000"
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    value={section80C}
                    onChange={(e) => setSection80C(Number(e.target.value))}
                  />
                </div>
                <span className="text-[9px] text-slate-400">Max allowed cap: ₹1,50,000</span>
              </div>

              <div>
                <label id="lbl-80d" htmlFor="80d-deductions" className="block text-[11px] text-slate-500 mb-0.5">
                  Sec 80D Mediclaim (Senior: up to ₹50k)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                  <input
                    id="80d-deductions"
                    type="number"
                    max={max80D}
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    value={section80D}
                    onChange={(e) => setSection80D(Number(e.target.value))}
                  />
                </div>
                <span className="text-[9px] text-slate-400">Max allowed cap: ₹{max80D.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <label id="lbl-hra" htmlFor="hra-deductions" className="block text-[11px] text-slate-500 mb-0.5">
                  House Rent Allowance (HRA Exception)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                  <input
                    id="hra-deductions"
                    type="number"
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    value={hraDeduction}
                    onChange={(e) => setHraDeduction(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label id="lbl-other-deductions" htmlFor="other-deductions-calc" className="block text-[11px] text-slate-500 mb-0.5">
                  Other Exemp (Rent, 80TTA, Home Loan in old)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                  <input
                    id="other-deductions-calc"
                    type="number"
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    value={customDeductions}
                    onChange={(e) => setCustomDeductions(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Table / Comparison */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col space-y-3.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
              <span>Which Regime Saves More?</span>
            </h3>

            {/* Smart Advice Panel */}
            <div className={`p-3 rounded-lg text-xs leading-relaxed font-sans ${netSavedByNew !== 0 ? 'bg-white border border-emerald-100' : 'bg-slate-100'}`}>
              {netSavedByNew !== 0 ? (
                <div>
                  <span className="font-semibold text-slate-800">Recommendation:</span> Go with the <strong className="text-emerald-700 font-bold">{recommendation.regime}</strong>.
                  <p className="text-[11px] text-slate-500 mt-1">{recommendation.note}</p>
                  <p className="text-[11px] mt-1.5 font-semibold text-emerald-700">
                    Saves ₹{recommendation.savings.toLocaleString('en-IN')} annually!
                  </p>
                </div>
              ) : (
                <p className="text-slate-600">Both Regimes yield the same tax output for this specific bracket.</p>
              )}
            </div>

            {/* Direct comparison rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">Metrics</span>
                <div className="grid grid-cols-2 text-center text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Old Regime</span>
                  <span>New Regime</span>
                </div>
              </div>

              <div id="row-taxable" className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-100 font-mono">
                <span className="text-slate-600 font-sans">Total Taxable</span>
                <div className="grid grid-cols-2 text-center">
                  <span>₹{oldRegime.taxableIncome.toLocaleString('en-IN')}</span>
                  <span>₹{newRegime.taxableIncome.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div id="row-standard-ded" className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-100 font-mono">
                <span className="text-slate-600 font-sans">Deductions Applied</span>
                <div className="grid grid-cols-2 text-center text-indigo-600">
                  <span>-₹{oldRegime.deductionsApplied.toLocaleString('en-IN')}</span>
                  <span>-₹{newRegime.deductionsApplied.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div id="row-cess" className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-100 font-mono text-slate-500">
                <span className="text-slate-500 font-sans">Cess (4%)</span>
                <div className="grid grid-cols-2 text-center">
                  <span>₹{oldRegime.cess.toLocaleString('en-IN')}</span>
                  <span>₹{newRegime.cess.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div id="row-total-tax" className="grid grid-cols-2 gap-2 text-xs pt-1.5 font-bold font-mono">
                <span className="text-slate-800 font-sans">Estimated Income Tax</span>
                <div className="grid grid-cols-2 text-center text-slate-800">
                  <span className="text-rose-600">₹{oldRegime.totalTax.toLocaleString('en-IN')}</span>
                  <span className="text-emerald-600">₹{newRegime.totalTax.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start space-x-2 text-[11px] text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
            <span>
              Disclaimer: Tax figures are estimated based on statutory tax thresholds for the FY 2025-27 period. Consult an auditor for precise filing requirements. HRA and medical exemptions may fluctuate.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
