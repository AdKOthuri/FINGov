/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { WorkspaceState } from '../types';

export function exportFinancialPDF(state: WorkspaceState) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const totalBankBal = state.bankAccounts.reduce((sum, b) => sum + b.balance, 0);
  const totalCardsBill = state.creditCards.reduce((sum, c) => sum + c.currentBill, 0);
  const totalMFValue = state.mutualFunds.reduce((sum, m) => sum + m.currentValue, 0);
  const totalAssetsValue = state.assets.reduce((sum, a) => sum + a.value, 0);
  const netWorth = (totalBankBal + totalMFValue + totalAssetsValue) - totalCardsBill;

  // Render Background Branding borders & Accent Bars
  doc.rect(5, 5, 200, 287, 'S'); // Outer Margin Frame
  
  // Header Box
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(6, 6, 198, 30, 'F');

  // Title Text inside Slate Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SUBBARAO KOTTURI', 12, 16);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11); // Amber accent text
  doc.text('JAN DHAN DIGITAL FINANCIAL WORKSPACE STATEMENT', 12, 22);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(`STATEMENT GENERATED ON: ${new Date().toLocaleDateString()}  |  SECURE CRYP-KEY PASSCODE ENCRYPTED`, 12, 28);

  // Draw Ashoka Chakra as GOVT OF INDIA Logo in the Header
  const sealX = 186;
  const sealY = 17;
  const radius = 6;
  doc.setDrawColor(245, 158, 11); // Amber
  doc.setLineWidth(0.3);
  doc.circle(sealX, sealY, radius, 'D');
  doc.circle(sealX, sealY, radius - 0.8, 'D'); // Inner ring
  
  // 24 Spokes
  for (let i = 0; i < 24; i++) {
    const angle = (i * 15 * Math.PI) / 180;
    const x1 = sealX + Math.cos(angle) * 1.0;
    const y1 = sealY + Math.sin(angle) * 1.0;
    const x2 = sealX + Math.cos(angle) * (radius - 0.8);
    const y2 = sealY + Math.sin(angle) * (radius - 0.8);
    doc.line(x1, y1, x2, y2);
  }
  
  doc.setFontSize(5);
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.text('GOVERNMENT OF INDIA', sealX, sealY + radius + 3, { align: 'center' });
  doc.setFontSize(4);
  doc.text('PILOT PROJECT OF GOVERNMENT OF INDIA', sealX, sealY + radius + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('SATYAMEVA JAYATE', sealX, sealY + radius + 8, { align: 'center' });

  // Quick stats summary boxes
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(12, 42, 186, 26, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(12, 42, 186, 26, 'D');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PORTFOLIO NET WORTH SUMMARY', 16, 48);

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${netWorth.toLocaleString('en-IN')}.00`, 16, 58);

  // Mini summary elements
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Liquid Cash: INR ${totalBankBal.toLocaleString('en-IN')}`, 105, 48);
  doc.text(`Securities & Mutual Funds: INR ${totalMFValue.toLocaleString('en-IN')}`, 105, 54);
  doc.text(`Fixed Assets Valuation: INR ${totalAssetsValue.toLocaleString('en-IN')}`, 105, 60);
  doc.text(`Credit outstanding: INR ${totalCardsBill.toLocaleString('en-IN')}`, 105, 66);

  let currentY = 78;

  // Section 1: BANK ACCOUNT RECORDS
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LIQUID BANK ACCOUNTS', 16, currentY + 4.5);
  currentY += 10;

  // Bank records table header
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Name', 16, currentY);
  doc.text('Category', 70, currentY);
  doc.text('Account Number', 110, currentY);
  doc.text('Closing Balance', 160, currentY);
  
  currentY += 3;
  doc.setDrawColor(241, 245, 249);
  doc.line(12, currentY, 198, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  state.bankAccounts.forEach((acc) => {
    doc.text(acc.name, 16, currentY);
    doc.text(acc.type, 70, currentY);
    doc.text(acc.accountNumber, 110, currentY);
    doc.text(`INR ${acc.balance.toLocaleString('en-IN')}`, 160, currentY);
    currentY += 6;
  });

  currentY += 6;

  // Section 2: CREDIT OUTSTANDING STATEMENT
  doc.setFillColor(30, 41, 59);
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ACTIVE CREDIT LABELS & OUTSTANDING STATEMENT', 16, currentY + 4.5);
  currentY += 10;

  // Credit tables header
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Card Name', 16, currentY);
  doc.text('Card digits', 70, currentY);
  doc.text('Due Date', 110, currentY);
  doc.text('Statement Balance', 160, currentY);
  
  currentY += 3;
  doc.line(12, currentY, 198, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  state.creditCards.forEach((card) => {
    doc.text(card.name, 16, currentY);
    doc.text(card.cardNumber, 70, currentY);
    doc.text(card.dueDate, 110, currentY);
    doc.text(`INR ${card.currentBill.toLocaleString('en-IN')}`, 160, currentY);
    currentY += 6;
  });

  currentY += 6;

  // Section 3: SECURITIES & INVESTMENTS
  doc.setFillColor(30, 41, 59);
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MUTUAL FUND SAVINGS PORTFOLIOS', 16, currentY + 4.5);
  currentY += 10;

  // Mutual Funds table header
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Fund Portfolio Name', 16, currentY);
  doc.text('Holdings / Units', 110, currentY);
  doc.text('Invested Cap', 140, currentY);
  doc.text('Present Valuation', 170, currentY);
  
  currentY += 3;
  doc.line(12, currentY, 198, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  state.mutualFunds.forEach((mf) => {
    doc.text(mf.fundName.substring(0, 45), 16, currentY);
    doc.text(mf.units.toFixed(3), 110, currentY);
    doc.text(`INR ${mf.investedValue.toLocaleString('en-IN')}`, 140, currentY);
    doc.text(`INR ${mf.currentValue.toLocaleString('en-IN')}`, 170, currentY);
    currentY += 6;
  });

  currentY += 10;

  // Add page if list exceeds space
  if (currentY > 230) {
    doc.addPage();
    doc.rect(5, 5, 200, 287, 'S');
    currentY = 15;
  }

  // Section 4: LANDS & HOUSES LEDGER
  doc.setFillColor(30, 41, 59);
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('REAL ESTATE & CAPITAL ASSETS REGISTER', 16, currentY + 4.5);
  currentY += 10;

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Asset Title', 16, currentY);
  doc.text('Category', 90, currentY);
  doc.text('Acquisition Cost', 130, currentY);
  doc.text('Present Valuation', 165, currentY);

  currentY += 3;
  doc.line(12, currentY, 198, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  state.assets.forEach((ast) => {
    doc.text(ast.name, 16, currentY);
    doc.text(ast.category, 90, currentY);
    doc.text(`INR ${ast.purchaseValue.toLocaleString('en-IN')}`, 130, currentY);
    doc.text(`INR ${ast.value.toLocaleString('en-IN')}`, 165, currentY);
    currentY += 6;
  });

  currentY += 10;

  // Section 5: AUDIT LOGS TRAIL (Top 6 records)
  doc.setFillColor(30, 41, 59);
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RECENT AUDIT TRAIL STATEMENT ENTRIES', 16, currentY + 4.5);
  currentY += 10;

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 16, currentY);
  doc.text('Transaction Descriptor / Retailer', 40, currentY);
  doc.text('Source Feed', 115, currentY);
  doc.text('Category', 145, currentY);
  doc.text('Amount', 175, currentY);

  currentY += 3;
  doc.line(12, currentY, 198, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  
  const recentTxs = state.transactions.slice(0, 8);
  recentTxs.forEach((tx) => {
    doc.text(tx.date, 16, currentY);
    doc.text(tx.description.substring(0, 38), 40, currentY);
    doc.text(tx.source.substring(0, 15), 115, currentY);
    doc.text(tx.category, 145, currentY);
    doc.text(`${tx.type === 'income' ? '+' : '-'}₹${tx.amount.toLocaleString('en-IN')}`, 175, currentY);
    currentY += 6;
  });

  // Footer Disclaimer line
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('End of Wealth Compilation Report. Protected under end-to-end device storage sandbox boundaries.', 12, 282);
  
  // Developer Signature
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // Amber
  doc.text(`Developed by: ${state.developerSignature || 'KARTHEEK'}`, 198, 282, { align: 'right' });

  // Trigger download instantly
  doc.save(`Jan_Dhan_Financial_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
}
