/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, Plus, Trash2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Asset } from '../types';

interface AssetsListProps {
  assets: Asset[];
  onAddAsset: (asset: Omit<Asset, 'id'>) => void;
  onDeleteAsset: (id: string) => void;
}

export function AssetsList({ assets, onAddAsset, onDeleteAsset }: AssetsListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<Asset['category']>('Gold');
  const [assetValue, setAssetValue] = useState('');
  const [assetPurchase, setAssetPurchase] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetValue || !assetPurchase) return;

    onAddAsset({
      name: assetName,
      category: assetCategory,
      value: parseFloat(assetValue),
      purchaseValue: parseFloat(assetPurchase)
    });

    setAssetName('');
    setAssetValue('');
    setAssetPurchase('');
    setShowAddForm(false);
  };

  // Summary statistics
  const totalPurchaseValue = assets.reduce((sum, a) => sum + a.purchaseValue, 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + a.value, 0);
  const totalAssetsProfit = totalCurrentValue - totalPurchaseValue;
  const totalAssetsProfitPerc = totalPurchaseValue > 0 ? (totalAssetsProfit / totalPurchaseValue) * 100 : 0;

  return (
    <div id="assets-workspace" className="space-y-6">
      
      {/* Short Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Physical / Fixed Assets</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-1">
              ₹{totalCurrentValue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Aesthetic Capital Appreciation</span>
            <div className={`text-xl font-bold font-mono mt-1 ${totalAssetsProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{totalAssetsProfit.toLocaleString('en-IN')} ({totalAssetsProfitPerc.toFixed(1)}%)
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${totalAssetsProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <ArrowUpRight className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Assets inventory matrix */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Long-Term Wealth & Assets Ledger</h3>
            <p className="text-[11px] text-slate-500">Track and appreciate property, physical Gold, EPF/PPF or bond certifications</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Custom Asset</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 space-y-3 text-xs">
            <h4 className="font-bold text-slate-700 uppercase text-[10px]">Log Custom Physical/Paper Asset</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="form-asset-name" className="block text-[10px] text-slate-500 mb-0.5">Asset Label</label>
                <input
                  id="form-asset-name"
                  type="text"
                  required
                  className="w-full px-2 py-1 bg-white border rounded"
                  placeholder="e.g. ancestral gold, Home"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="form-asset-cat" className="block text-[10px] text-slate-500 mb-0.5">Class category</label>
                <select
                  id="form-asset-cat"
                  className="w-full px-2 py-1 bg-white border rounded"
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value as any)}
                >
                  <option value="Gold">Gold Certifications/Physical</option>
                  <option value="Real Estate">Property / Land</option>
                  <option value="Equities">Direct Stocks</option>
                  <option value="PPF / EPF">Provident Fund (EPF/PPF)</option>
                  <option value="Bonds">Fixed Deposits/Gold Bonds</option>
                  <option value="Cash / Others">Alternative / Luxury</option>
                </select>
              </div>

              <div>
                <label htmlFor="form-asset-purchase" className="block text-[10px] text-slate-500 mb-0.5 font-sans">Acquisition Capital (₹)</label>
                <input
                  id="form-asset-purchase"
                  type="number"
                  required
                  className="w-full px-2 py-1 bg-white border rounded font-mono"
                  placeholder="e.g. 100000"
                  value={assetPurchase}
                  onChange={(e) => setAssetPurchase(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="form-asset-value" className="block text-[10px] text-slate-500 mb-0.5 font-sans">Current Value (₹)</label>
                <input
                  id="form-asset-value"
                  type="number"
                  required
                  className="w-full px-2 py-1 bg-white border rounded font-mono"
                  placeholder="e.g. 150000"
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1.5 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-2.5 py-1 border rounded text-slate-600 font-medium">Cancel</button>
              <button type="submit" className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-white rounded font-bold">Register asset</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assets.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-slate-400 text-xs">No long-term assets listed. Try copying statements with assets above.</div>
          ) : (
            assets.map((asset) => {
              const capitalGain = asset.value - asset.purchaseValue;
              const gainPerc = asset.purchaseValue > 0 ? (capitalGain / asset.purchaseValue) * 100 : 0;
              return (
                <div key={asset.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                      {asset.category}
                    </span>
                    <h4 className="font-semibold text-slate-800 text-xs pt-1">{asset.name}</h4>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Acquired: ₹{asset.purchaseValue.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-xs font-bold text-slate-800 font-mono">
                      ₹{asset.value.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[10px] font-bold font-mono ${capitalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {capitalGain >= 0 ? '+' : ''}₹{capitalGain.toLocaleString('en-IN')} ({gainPerc.toFixed(1)}%)
                    </div>
                    <button
                      onClick={() => onDeleteAsset(asset.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition"
                      title="Remove asset"
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
