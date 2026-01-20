import React, { useState, useCallback } from 'react';
import { simplifyLegalText } from './services/geminiService';
import { rateLimiter } from './services/rateLimiter';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { TranslationStatus, SimplificationResponse } from './types';
import { MIN_INPUT_LENGTH, MAX_INPUT_LENGTH, SAMPLE_LEGAL_TEXT, RATE_LIMIT_WINDOW_MS } from './constants';
import { Button, Card, LoadingSpinner, Alert } from './components/LayoutComponents';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<TranslationStatus>(TranslationStatus.IDLE);
  const [result, setResult] = useState<SimplificationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const isOnline = useOnlineStatus();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Clear error when user types to improve UX
    if (errorMsg && status === TranslationStatus.ERROR) {
      setErrorMsg(null);
      setStatus(TranslationStatus.IDLE);
    }
  };

  const handleSimplify = useCallback(async () => {
    // 0. Offline Check
    if (!isOnline) {
      setErrorMsg("You are currently offline. Please check your internet connection.");
      setStatus(TranslationStatus.ERROR);
      return;
    }

    // 1. Input Validation
    if (inputText.length < MIN_INPUT_LENGTH) {
      setErrorMsg(`Text is too short. Please enter at least ${MIN_INPUT_LENGTH} characters.`);
      setStatus(TranslationStatus.ERROR);
      return;
    }

    if (inputText.length > MAX_INPUT_LENGTH) {
      setErrorMsg(`Text exceeds maximum limit of ${MAX_INPUT_LENGTH} characters.`);
      setStatus(TranslationStatus.ERROR);
      return;
    }

    // 2. Rate Limiting Check
    if (!rateLimiter.checkLimit()) {
      const remainingSeconds = Math.ceil(rateLimiter.getRemainingTime() / 1000);
      setErrorMsg(`Rate limit exceeded. Please wait ${remainingSeconds} seconds before trying again.`);
      setStatus(TranslationStatus.ERROR);
      return;
    }

    // 3. Process Request
    setStatus(TranslationStatus.LOADING);
    setErrorMsg(null);
    setResult(null);
    setFeedbackGiven(false);

    try {
      const response = await simplifyLegalText(inputText);
      setResult(response);
      setStatus(TranslationStatus.SUCCESS);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus(TranslationStatus.ERROR);
    }
  }, [inputText, isOnline]);

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedbackGiven(true);
    // In a real application, you would send this analytics event to your backend
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <h1 className="text-xl font-serif font-bold text-slate-900">LegalEase</h1>
          </div>
          <div className="flex items-center gap-4">
             {!isOnline && (
               <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 animate-pulse">
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 Offline Mode
               </div>
             )}
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200">
           <div className="max-w-5xl mx-auto px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">No Internet Connection</p>
                <p className="text-xs text-amber-700 mt-1">You can still view the app, but AI features are unavailable until you reconnect.</p>
              </div>
           </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-4">
            Decode the Fine Print
          </h2>
          <p className="text-lg text-slate-600">
            Don't sign what you don't understand. Paste complex legal clauses below to get a plain English translation instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Input Column */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <label htmlFor="legal-input" className="block text-sm font-semibold text-slate-700">
                  Legal Text
                </label>
                <button 
                  onClick={() => setInputText(SAMPLE_LEGAL_TEXT)}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
                  disabled={!isOnline}
                >
                  Try Sample
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  id="legal-input"
                  className="w-full h-80 p-4 rounded-lg bg-slate-50 border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none resize-none text-slate-800 font-mono text-sm leading-relaxed"
                  placeholder={isOnline ? "Paste your legal text here..." : "Waiting for connection..."}
                  value={inputText}
                  onChange={handleInputChange}
                  maxLength={MAX_INPUT_LENGTH}
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  {inputText.length}/{MAX_INPUT_LENGTH}
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={handleSimplify}
                  disabled={status === TranslationStatus.LOADING || inputText.length === 0 || !isOnline}
                  className="w-full"
                  variant={isOnline ? 'primary' : 'secondary'}
                >
                  {status === TranslationStatus.LOADING ? (
                    <>
                      <LoadingSpinner className="text-white h-5 w-5" />
                      <span>Analyzing Legalese...</span>
                    </>
                  ) : !isOnline ? (
                    <>
                      <span>Offline Mode</span>
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" /></svg>
                    </>
                  ) : (
                    <>
                      <span>Simplify Text</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-slate-400 mt-3 text-center">
                  Protected by client-side rate limiting and input sanitization.
                </p>
              </div>
            </Card>

            {status === TranslationStatus.ERROR && errorMsg && (
              <Alert type="error" message={errorMsg} />
            )}
          </div>

          {/* Output Column */}
          <div className="space-y-4">
            {/* Empty State */}
            {!result && status !== TranslationStatus.LOADING && (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium">Translation result will appear here</p>
                <p className="text-sm mt-2 max-w-xs">The AI will break down key points and provide a simplified summary.</p>
              </div>
            )}

            {/* Result State */}
            {result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="p-0 border-brand-100 ring-4 ring-brand-50/50">
                  <div className="bg-brand-50 p-4 border-b border-brand-100 flex items-center gap-2">
                    <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-serif font-bold text-brand-900">Plain English Translation</h3>
                  </div>
                  <div className="p-6 bg-white">
                    <p className="text-lg text-slate-800 leading-relaxed">
                      {result.simplified}
                    </p>
                  </div>
                </Card>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                   <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Key Takeaways
                   </h4>
                   <ul className="space-y-3">
                     {result.keyPoints.map((point, idx) => (
                       <li key={idx} className="flex gap-3 text-slate-700">
                         <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-brand-400 mt-2"></span>
                         <span>{point}</span>
                       </li>
                     ))}
                   </ul>
                </div>

                {/* Feedback Section */}
                <div className="flex items-center justify-end gap-3 px-2">
                   {!feedbackGiven ? (
                     <>
                        <span className="text-sm text-slate-400">Was this helpful?</span>
                        <button 
                          onClick={() => handleFeedback('up')}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                          aria-label="Thumbs up"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleFeedback('down')}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Thumbs down"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                        </button>
                     </>
                   ) : (
                     <span className="text-sm text-green-600 font-medium animate-in fade-in flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Thanks for your feedback!
                     </span>
                   )}
                </div>
              </div>
            )}
            
            {/* Loading Skeleton */}
            {status === TranslationStatus.LOADING && !result && (
               <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 space-y-4 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                  </div>
                  <div className="h-32 bg-slate-100 rounded-lg mt-6"></div>
               </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} LegalEase. For educational and informative purposes only. This tool does not replace professional legal advice.</p>
      </footer>
    </div>
  );
};

export default App;