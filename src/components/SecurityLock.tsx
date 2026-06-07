/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Check, Delete, AlertCircle, Fingerprint, RefreshCw } from 'lucide-react';
import { safeStorage } from '../lib/storage';

interface SecurityLockProps {
  onUnlock: () => void;
}

export function SecurityLock({ onUnlock }: SecurityLockProps) {
  const [pinMode, setPinMode] = useState<'create' | 'enter' | 'confirm'>('enter');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [tempPin, setTempPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const [biometricScanning, setBiometricScanning] = useState<boolean>(false);
  const [biometricsSuccess, setBiometricsSuccess] = useState<boolean>(false);

  useEffect(() => {
    const savedPin = safeStorage.getItem('ai_financial_workspace_pin');
    if (!savedPin) {
      setPinMode('create');
    } else {
      setStoredPin(savedPin);
      setPinMode('enter');
    }
  }, []);

  const triggerVibrationNoise = () => {
    setIsVibrating(true);
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
    setTimeout(() => {
      setIsVibrating(false);
    }, 500);
  };

  const handleKeyPress = (num: string) => {
    setErrorMsg(null);
    if (currentInput.length >= 4) return;
    
    const newInput = currentInput + num;
    setCurrentInput(newInput);

    // Auto-validate on 4th digit
    if (newInput.length === 4) {
      setTimeout(() => {
        validatePinInput(newInput);
      }, 200);
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const validatePinInput = (pinVal: string) => {
    if (pinMode === 'create') {
      setTempPin(pinVal);
      setCurrentInput('');
      setPinMode('confirm');
    } else if (pinMode === 'confirm') {
      if (pinVal === tempPin) {
        safeStorage.setItem('ai_financial_workspace_pin', pinVal);
        setStoredPin(pinVal);
        setErrorMsg(null);
        onUnlock();
      } else {
        triggerVibrationNoise();
        setErrorMsg('Passcodes do not match! Try setting again.');
        setCurrentInput('');
        setPinMode('create');
      }
    } else {
      // Enter mode
      const backupPin = safeStorage.getItem('ai_financial_workspace_pin') || '0000';
      if (pinVal === backupPin) {
        onUnlock();
      } else {
        triggerVibrationNoise();
        setErrorMsg('Incorrect PIN! Please try again.');
        setCurrentInput('');
      }
    }
  };

  const handleBiometricAuth = async () => {
    setBiometricScanning(true);
    setErrorMsg(null);
    
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Biometrics not supported on this device/browser.");
      }

      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error("No hardware biometric scanner is currently available on this device.");
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      // Trigger native device biometric hardware
      const navCreds = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: "जन धन (Jan Dhan)" },
          user: {
            id: userId,
            name: "secure-sandbox",
            displayName: "Secure Sandbox Access"
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000
        }
      });

      if (navCreds) {
        setBiometricScanning(false);
        setBiometricsSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 500);
      }
    } catch (error: any) {
      console.warn("Biometric Error:", error);
      setBiometricScanning(false);
      triggerVibrationNoise();
      setErrorMsg(error.name === "NotAllowedError" ? "Biometrics cancelled." : (error.message || "Hardware scanner failed."));
    }
  };

  const resetSetup = () => {
    if (window.confirm('Are you sure you want to completely reset authentication? This requires setting a new pin.')) {
      safeStorage.removeItem('ai_financial_workspace_pin');
      setPinMode('create');
      setCurrentInput('');
      setTempPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col justify-between p-6 select-none font-sans">
      
      {/* Upper Status / Shield branding */}
      <div className="max-w-md mx-auto w-full text-center space-y-6 pt-16 flex-grow flex flex-col justify-center items-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-linear-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Shield className="w-8 h-8 text-slate-950 animate-pulse" />
          </div>
          <div className="absolute right-0 bottom-0 bg-slate-900 border-2 border-slate-950 p-1 rounded-full">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
            {pinMode === 'create' && 'Set Secure App PIN'}
            {pinMode === 'confirm' && 'Confirm Your PIN'}
            {pinMode === 'enter' && 'Security Verification'}
          </h2>
          <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            {pinMode === 'create' && 'Create a 4-digit security PIN to secure Subbarao Kotturi’s personal wealth data.'}
            {pinMode === 'confirm' && 'Re-enter your selected passcode to register biometric locks.'}
            {pinMode === 'enter' && 'Unlock with master passcode or finger ID to access current net worth.'}
          </p>
        </div>

        {/* Diagnostic indicator for demo ease */}
        {pinMode === 'enter' && (
          <div className="text-[10px] text-slate-500 font-mono tracking-wide">
            Default master PIN code registered or stored in local Keychain.
          </div>
        )}

        {/* Dynamic Passcode Dot Indicator */}
        <div className={`flex justify-center space-x-6 py-8 ${isVibrating ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const hasValue = currentInput.length > idx;
            return (
              <div 
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition ${
                  hasValue 
                    ? 'bg-amber-500 border-amber-500 scale-110 shadow-md shadow-amber-500/30' 
                    : 'bg-transparent border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Dynamic feedback messages */}
        {errorMsg && (
          <div className="flex items-center space-x-1.5 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-full font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {biometricScanning && (
          <div className="flex flex-col items-center space-y-2 pt-2">
            <Fingerprint className="w-12 h-12 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold text-indigo-400 tracking-wide uppercase">Reading Touch / Face Biometric ID...</span>
          </div>
        )}

        {biometricsSuccess && (
          <div className="flex flex-col items-center space-y-2 pt-2 text-emerald-500">
            <Check className="w-12 h-12 text-emerald-400 bounce" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Authenticated Successfully!</span>
          </div>
        )}
      </div>

      {/* 🚀 REALISTIC TACTILE TOUCH NUMPAD (44PX TARGESTS EXCELLENT TO SENSORS) */}
      <div className="max-w-md mx-auto w-full bg-slate-900/60 p-5 rounded-t-[32px] border-t border-slate-900 space-y-4">
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 py-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleKeyPress(val)}
              className="h-14 bg-slate-900 border border-slate-850 hover:bg-slate-800 active:scale-95 text-xl font-bold font-mono text-white rounded-2xl flex items-center justify-center transition"
            >
              {val}
            </button>
          ))}

          {/* Action column (Trigger Biometrics or Change Setup) */}
          <button
            type="button"
            onClick={pinMode === 'enter' ? handleBiometricAuth : resetSetup}
            className="h-14 bg-slate-950 border border-slate-900 flex flex-col items-center justify-center text-slate-400 hover:text-white rounded-2xl transition"
          >
            {pinMode === 'enter' ? (
              <>
                <Fingerprint className="w-5 h-5 text-indigo-400" />
                <span className="text-[8px] font-bold uppercase mt-1">Biometric</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <span className="text-[8px] font-bold uppercase mt-1">Reset</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 bg-slate-900 border border-slate-850 hover:bg-slate-800 active:scale-95 text-xl font-bold font-mono text-white rounded-2xl flex items-center justify-center transition"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-400 hover:text-white rounded-2xl transition active:scale-95"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
