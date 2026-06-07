/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Clipboard, CheckCircle, FileText, UploadCloud, AlertCircle } from 'lucide-react';
import { WorkspaceState } from '../types';

interface StatementParserProps {
  onImportData: (parsedData: Partial<WorkspaceState>) => void;
}

export function StatementParser({ onImportData }: StatementParserProps) {
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parserMessage, setParserMessage] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load a demo template
  const loadDemoText = async (type: string) => {
    setIsParsing(true);
    setErrorMsg(null);
    setParserMessage('Fetching template...');
    try {
      const res = await fetch('/api/ai/generate-mock-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setPastedText(data.text);
        setParserMessage('Sample loaded! Click "Parse with Custom AI" to see automation in action.');
      } else {
        setErrorMsg('Failed to load sample text.');
      }
    } catch (err: any) {
      setErrorMsg('Error triggering mock endpoint: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleParse = async () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste some statement text or select a demo sample below.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setParsedPreview(null);
    setParserMessage('Analyzing text metrics with Gemini AI flash model...');

    try {
      const res = await fetch('/api/ai/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: pastedText }),
      });
      const result = await res.json();

      if (result.success) {
        setParsedPreview(result.data);
        if (result.isDemoMock) {
          setParserMessage('Demo Mode: Extracted structural data successfully using static heuristic engine (Configure GEMINI_API_KEY for dynamic parsing).');
        } else {
          setParserMessage('Success: Gemini AI extracted matching transactions, balances & portfolio holdings cleanly!');
        }
      } else {
        setErrorMsg(result.error || 'Failed to parse statement.');
      }
    } catch (err: any) {
      setErrorMsg('Could not contact the backend parser. Check server execution.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (parsedPreview) {
      onImportData(parsedPreview);
      setParsedPreview(null);
      setPastedText('');
      setParserMessage('Integration Complete: Your dashboard has been updated with the AI parsed metrics!');
      setTimeout(() => setParserMessage(null), 5000);
    }
  };

  return (
    <div id="ai-statement-workspace" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">AI Automated Workspace</h2>
            <p className="text-xs text-slate-500">Paste Bank Statements, Credit Card Bills or Mutual Fund Reports to auto-update</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="pasted-text-area" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Statement Text / Receipt Payload
          </label>
          <div className="relative">
            <textarea
              id="pasted-text-area"
              className="w-full h-44 p-4 text-xs font-mono bg-slate-50 text-slate-700 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
              placeholder="Paste account transactions or bank receipt logs here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            {pastedText && (
              <button
                onClick={() => setPastedText('')}
                className="absolute top-2 right-2 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Demo Fast Imports */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 mb-2">No Statement Copy handy? Test with Demo Ingestors:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => loadDemoText('hdfc_bank')}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 text-slate-700 rounded-xl transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>HDFC Savings Demo</span>
            </button>
            <button
              onClick={() => loadDemoText('icici_cc')}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 text-slate-700 rounded-xl transition"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>ICICI Credit Bill Demo</span>
            </button>
            <button
              onClick={() => loadDemoText('mutual_fund')}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 text-slate-700 rounded-xl transition"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nippon/SBI MF Report</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleParse}
            disabled={isParsing || !pastedText.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white rounded-xl font-medium text-xs flex items-center justify-center space-x-2 transition shadow-sm disabled:opacity-50"
          >
            {isParsing ? (
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                <span>Extracting with Gemini...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Parse Statement with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {parserMessage && (
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-700 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <span>{parserMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview & Approval Screen */}
        {parsedPreview && (
          <div className="border border-indigo-100 bg-indigo-50/10 rounded-xl p-4 mt-2 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100/40">
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wide flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>AI Ingestion Preview</span>
              </span>
              <span className="text-[10px] text-slate-500">Verify extracted metrics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {parsedPreview.bankAccounts?.length > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>🏦 Bank Accounts</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                      +{parsedPreview.bankAccounts.length}
                    </span>
                  </h4>
                  <ul className="space-y-1 text-slate-600">
                    {parsedPreview.bankAccounts.map((acc: any, i: number) => (
                      <li key={i} className="flex justify-between font-mono text-[11px]">
                        <span>{acc.name} ({acc.accountNumber})</span>
                        <span className="font-semibold">₹{acc.balance.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedPreview.creditCards?.length > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>💳 Credit Cards</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                      +{parsedPreview.creditCards.length}
                    </span>
                  </h4>
                  <ul className="space-y-1 text-slate-600">
                    {parsedPreview.creditCards.map((cc: any, i: number) => (
                      <li key={i} className="flex justify-between font-mono text-[11px]">
                        <span>{cc.name}</span>
                        <span className="font-semibold text-purple-700">₹{cc.currentBill.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedPreview.mutualFunds?.length > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 col-span-1 sm:col-span-2">
                  <h4 className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>📈 Mutual Funds & Holdings</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-mono">
                      {parsedPreview.mutualFunds.length} Funds Found
                    </span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] text-slate-500 border-b border-slate-100">
                          <th className="py-1">Fund</th>
                          <th className="py-1 text-right">Invested</th>
                          <th className="py-1 text-right">Current Value</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-[11px] text-slate-700">
                        {parsedPreview.mutualFunds.map((mf: any, i: number) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0">
                            <td className="py-1 truncate max-w-[150px]">{mf.fundName}</td>
                            <td className="py-1 text-right">₹{mf.investedValue.toLocaleString('en-IN')}</td>
                            <td className="py-1 text-right font-semibold text-emerald-600">₹{mf.currentValue.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedPreview.transactions?.length > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 col-span-1 sm:col-span-2">
                  <h4 className="font-semibold text-slate-700 mb-1">
                    💸 Transactions Captured ({parsedPreview.transactions.length})
                  </h4>
                  <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {parsedPreview.transactions.slice(0, 5).map((tx: any, i: number) => (
                      <li key={i} className="text-[11px] py-1 flex justify-between items-center border-b border-slate-50 last:border-0 font-mono">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-sans truncate max-w-[180px]">{tx.description}</span>
                          <span className="text-[9px] text-slate-400">{tx.date} • {tx.category}</span>
                        </div>
                        <span className={tx.type === 'income' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                      </li>
                    ))}
                    {parsedPreview.transactions.length > 5 && (
                      <li className="text-[10px] text-slate-400 text-center pt-1 font-sans">
                        + {parsedPreview.transactions.length - 5} more transactions extracted...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition"
              >
                <span>Approve & Sync Workspace</span>
              </button>
              <button
                onClick={() => setParsedPreview(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
