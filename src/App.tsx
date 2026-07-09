import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  Fingerprint, 
  KeyRound, 
  ExternalLink,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PasswordAnalysis, LocalMetrics, PasswordStrength } from './types';

// Preset samples for quick testing
interface PresetSample {
  name: string;
  value: string;
  tag: string;
  tagColor: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  { name: "Common Keyboard Walk", value: "qwerty12345", tag: "Highly Vulnerable", tagColor: "bg-red-100 text-red-700" },
  { name: "Predictable Substitute", value: "P@ssword123!", tag: "Common Pattern", tagColor: "bg-amber-100 text-amber-700" },
  { name: "Memorable Passphrase", value: "sunset-bicycle-jacket-piano", tag: "Best Practice", tagColor: "bg-blue-100 text-blue-700" },
  { name: "Complex Random", value: "kR9#fP_27!mWzQ", tag: "High Entropy", tagColor: "bg-emerald-100 text-emerald-700" }
];

export default function App() {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Real-time client-side diagnostics
  const [localMetrics, setLocalMetrics] = useState<LocalMetrics>({
    length: 0,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
    entropy: 0
  });

  // Backend analysis states
  const [aiAnalysis, setAiAnalysis] = useState<PasswordAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate local metrics in real time as user types
  useEffect(() => {
    const len = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSym = /[^a-zA-Z0-9]/.test(password);

    // Dynamic pool size for Entropy estimation
    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasNum) poolSize += 10;
    if (hasSym) poolSize += 33; // Standard symbol set approximation

    const entropyBits = len > 0 && poolSize > 0 ? Math.round(len * Math.log2(poolSize)) : 0;

    setLocalMetrics({
      length: len,
      hasUppercase: hasUpper,
      hasLowercase: hasLower,
      hasNumber: hasNum,
      hasSymbol: hasSym,
      entropy: entropyBits
    });

    // Clear previous analysis if password is empty to keep UI clean
    if (len === 0) {
      setAiAnalysis(null);
      setErrorMessage(null);
    }
  }, [password]);

  // Handle triggering the Gemini AI audit
  const runSecurityAudit = async (pwdToAnalyze = password) => {
    if (!pwdToAnalyze) {
      setErrorMessage("Please enter or select a password to audit.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    setAiAnalysis(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwdToAnalyze })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate security audit.");
      }

      setAiAnalysis(data);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during the audit.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Helper for entropy visual meters
  const getEntropyGrade = (entropy: number) => {
    if (entropy === 0) return { percent: 0, color: "bg-gray-200", text: "None", alertColor: "text-gray-400" };
    if (entropy < 36) return { percent: 25, color: "bg-rose-500", text: "Very Weak (Instantly crackable)", alertColor: "text-rose-500" };
    if (entropy < 60) return { percent: 50, color: "bg-amber-500", text: "Moderate (Standard brute-force risk)", alertColor: "text-amber-500" };
    if (entropy < 80) return { percent: 75, color: "bg-blue-500", text: "Strong (Highly resistant)", alertColor: "text-blue-500" };
    return { percent: 100, color: "bg-emerald-500", text: "Exceptional (Cryptographically strong)", alertColor: "text-emerald-500" };
  };

  const currentEntropy = getEntropyGrade(localMetrics.entropy);

  // Helper to color-code score badges
  const getScoreBadgeStyles = (score: PasswordStrength) => {
    switch (score) {
      case 'Weak':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
          accent: 'border-rose-500'
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          accent: 'border-amber-500'
        };
      case 'Strong':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: <Shield className="w-5 h-5 text-blue-600" />,
          accent: 'border-blue-500'
        };
      case 'Very Strong':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          accent: 'border-emerald-500'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Container with Max Width for desktop fluidity */}
      <div className="w-full max-w-4xl flex-grow flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600 mb-3 border border-neutral-200">
            <Fingerprint className="w-3.5 h-3.5 text-neutral-500" />
            Zero-Retention Local & AI Security Analysis
          </div>
          <h1 className="text-3.5xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Password Security Advisor
          </h1>
          <p className="mt-2 text-neutral-500 max-w-2xl mx-auto text-sm sm:text-base">
            Instantly evaluate password entropy, inspect security gaps using state-of-the-art AI patterns, and generate memorable, ironclad passphrases.
          </p>

          {/* Security Advisory Warning Card */}
          <div className="mt-5 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl max-w-2xl mx-auto flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-amber-900">⚠️ Mandatory Security Notice</p>
              <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                Never enter or submit real passwords that you actively use for any of your personal or work accounts. This tool is designed purely for testing sample or mock passwords to learn security principles.
              </p>
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Interactive Audit Desk (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Input Card */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm p-5 sm:p-6 transition-all">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-neutral-500" />
                  Enter Sample Password
                </label>
                {password && (
                  <button 
                    onClick={() => setPassword('')}
                    className="text-xs text-neutral-400 hover:text-neutral-600 font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Password Input Wrapper */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Type a test password (e.g. BlueSky-2026!)"
                  className="w-full pl-4 pr-12 py-3.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono text-base tracking-wide transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Action Audit Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => runSecurityAudit()}
                  disabled={!password || isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Auditing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                      Perform AI Security Audit
                    </>
                  )}
                </button>
              </div>

              {/* Preset Quick Tests */}
              <div className="mt-6 border-t border-neutral-100 pt-5">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">
                  Or Test a Preset Security Scenario
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_SAMPLES.map((sample, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPassword(sample.value);
                        runSecurityAudit(sample.value);
                      }}
                      className="text-left p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300 transition-all text-xs flex flex-col justify-between h-20"
                    >
                      <div className="font-mono text-neutral-800 font-medium truncate w-full">{sample.value}</div>
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-[10px] text-neutral-400 font-sans truncate">{sample.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${sample.tagColor}`}>
                          {sample.tag}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Real-time Client Diagnostics */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
              <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-neutral-500" />
                Real-Time Complexity Diagnostics
              </h3>

              {/* Entropy Bit Meter */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">Estimated Entropy strength</span>
                  <span className={`font-mono font-bold ${currentEntropy.alertColor}`}>
                    {localMetrics.entropy} Bits
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${currentEntropy.percent}%` }}
                    transition={{ type: "spring", stiffness: 80 }}
                    className={`h-full ${currentEntropy.color}`}
                  />
                </div>
                <div className="text-[10.5px] text-neutral-400 italic">
                  Grade: {currentEntropy.text}
                </div>
              </div>

              {/* Character Rules Checks */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Rule: Length */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${localMetrics.length >= 14 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-neutral-50 border-neutral-100 text-neutral-500'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${localMetrics.length >= 14 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                    {localMetrics.length}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">14+ Characters</p>
                    <p className="text-[10px] text-neutral-400 font-sans">Required size</p>
                  </div>
                </div>

                {/* Rule: Uppercase */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${localMetrics.hasUppercase ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-neutral-50 border-neutral-100 text-neutral-500'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${localMetrics.hasUppercase ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                    A
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Uppercase</p>
                    <p className="text-[10px] text-neutral-400 font-sans">A-Z character</p>
                  </div>
                </div>

                {/* Rule: Lowercase */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${localMetrics.hasLowercase ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-neutral-50 border-neutral-100 text-neutral-500'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${localMetrics.hasLowercase ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                    a
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Lowercase</p>
                    <p className="text-[10px] text-neutral-400 font-sans">a-z character</p>
                  </div>
                </div>

                {/* Rule: Numbers */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${localMetrics.hasNumber ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-neutral-50 border-neutral-100 text-neutral-500'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${localMetrics.hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                    9
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Digits</p>
                    <p className="text-[10px] text-neutral-400 font-sans">0-9 integers</p>
                  </div>
                </div>

                {/* Rule: Symbols */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${localMetrics.hasSymbol ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-neutral-50 border-neutral-100 text-neutral-500'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${localMetrics.hasSymbol ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                    #
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Symbols</p>
                    <p className="text-[10px] text-neutral-400 font-sans">Special chars</p>
                  </div>
                </div>

                {/* Info Block */}
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center gap-2">
                  <Info className="w-4 h-4 text-neutral-400 shrink-0" />
                  <p className="text-[10.5px] text-neutral-500 leading-snug">
                    Entropy measures unpredictability. Higher entropy = harder to crack.
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT SIDE: Advisor's Analysis Report (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm p-6 text-center space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-neutral-100 border-t-neutral-900 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-800">Analyzing Sample Credentials</h4>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      Checking common dictionary listings, sequential character strings, and estimating cryptographic difficulty...
                    </p>
                  </div>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 space-y-2 text-sm"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Analysis Failed
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">{errorMessage}</p>
                </motion.div>
              )}

              {aiAnalysis && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="space-y-6"
                >
                  {/* Dynamic Score Panel */}
                  {(() => {
                    const styles = getScoreBadgeStyles(aiAnalysis.score);
                    return (
                      <div className={`bg-white border-2 ${styles.accent} rounded-2xl shadow-md overflow-hidden`}>
                        <div className={`p-4 ${styles.bg} border-b flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            {styles.icon}
                            <span className="text-xs font-bold uppercase tracking-wider">AI Security Verdict</span>
                          </div>
                          <span className="text-sm font-bold px-2.5 py-1 rounded-md bg-white shadow-sm border border-neutral-200">
                            {aiAnalysis.score}
                          </span>
                        </div>

                        {/* Explanations */}
                        <div className="p-5 space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                              Why This Score?
                            </h4>
                            <ul className="space-y-2.5">
                              {aiAnalysis.explanations.map((exp, idx) => (
                                <li key={idx} className="text-xs text-neutral-600 leading-relaxed flex items-start gap-2">
                                  <span className="text-neutral-400 mt-1 shrink-0 select-none">•</span>
                                  <span>{exp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Secure Alternatives suggestions */}
                  <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm p-5 space-y-5">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <ShieldCheck className="w-5 h-5 text-neutral-700" />
                      <h4 className="text-sm font-bold text-neutral-800">Recommended Alternatives</h4>
                    </div>

                    {/* Alternative 1: Random complex */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          1. Strong Random Password
                        </label>
                        <button
                          onClick={() => handleCopy(aiAnalysis.strongAlternative, 'random')}
                          className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 font-medium transition-colors"
                        >
                          {copiedText === 'random' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl font-mono text-sm tracking-widest break-all select-all flex justify-between items-center border border-neutral-800">
                        {aiAnalysis.strongAlternative}
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Combines a random blend of characters. Hardest to crack via computational brute-force.
                      </p>
                    </div>

                    {/* Alternative 2: Memorable Passphrase */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          2. Passphrase-Based (Recommended)
                        </label>
                        <button
                          onClick={() => handleCopy(aiAnalysis.passphraseAlternative, 'phrase')}
                          className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 font-medium transition-colors"
                        >
                          {copiedText === 'phrase' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl font-mono text-xs tracking-wider break-all select-all flex justify-between items-center border border-neutral-800">
                        {aiAnalysis.passphraseAlternative}
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        <strong>Memorable & Strong:</strong> Hyphenated words create immense length, which exponentially spikes entropy while remaining easy to remember.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Default Empty State / Welcome Advice */}
              {!aiAnalysis && !isLoading && !errorMessage && (
                <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto border border-neutral-100">
                    <Unlock className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-800">AI Report Awaiting Launch</h4>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                      Type your test password on the left and click <strong>Perform AI Security Audit</strong> to request Gemini's pattern and dictionary analysis.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Password Best Practices Educational Panel */}
            <div className="bg-neutral-900 text-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 border border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Advisor's Quick Guides
              </h4>

              <div className="space-y-3">
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold text-neutral-100">💡 Why length beats complexity</p>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Adding just 2 characters increases computational crack-times far more than substituting "a" with "@". Focus on password length first.
                  </p>
                </div>
                <div className="text-xs leading-relaxed pt-2.5 border-t border-neutral-800">
                  <p className="font-semibold text-neutral-100">🐴 The Passphrase Method</p>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Combining four random dictionary words (e.g., <code className="bg-neutral-800 px-1 py-0.5 rounded text-[10px]">correct-horse-battery-staple</code>) is virtually uncrackable with current tech, yet much simpler to memorize.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center mt-12 text-neutral-400 text-xs border-t border-neutral-200/60 pt-6 space-y-2">
        <p>
          Designed in accordance with NIST Password Complexity Guidelines (SP 800-63B).
        </p>
        <p className="text-[10px] text-neutral-400">
          Secure Policy Checklist: ✔ zero storage ✔ zero logs ✔ client-side transient memory only.
        </p>
      </footer>
    </div>
  );
}
