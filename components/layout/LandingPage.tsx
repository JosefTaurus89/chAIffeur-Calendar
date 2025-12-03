
import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { AppSettings } from '../../types';

interface LandingPageProps {
  onSignIn: (rememberMe: boolean) => void;
  isSyncing: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isSyncing }) => {
  // Local state for language on the landing page, defaulting to English
  const [currentLang, setCurrentLang] = useState<AppSettings['language']>('en');
  const [rememberMe, setRememberMe] = useState(true); // Default to true based on persistence requirement
  const { t } = useTranslation(currentLang);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col font-sans">
      {/* Navbar Placeholder */}
      <div className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-primary-600 rounded-xl shadow-lg text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">New ChAIffeur</span>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Language Selector */}
            <select 
                value={currentLang} 
                onChange={(e) => setCurrentLang(e.target.value as any)}
                className="bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2"
            >
                <option value="en">English</option>
                <option value="it">Italiano</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
            </select>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-12 lg:py-24 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 text-sm font-bold mb-6 border border-primary-100 dark:border-primary-700">
                🚀 AI-Powered Fleet Management
            </span>
            
            {/* UPDATED HEADLINE: Distinct Color/Gradient */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 dark:from-primary-400 dark:via-indigo-400 dark:to-purple-400 drop-shadow-sm" dangerouslySetInnerHTML={{
                __html: t('landing_hero_title').replace('Calendar,', 'Calendar,<br/>')
            }}>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                {t('landing_hero_subtitle')}
            </p>

            <div className="flex flex-col items-center gap-6 max-w-md mx-auto w-full">
                <button
                    onClick={() => onSignIn(rememberMe)}
                    disabled={isSyncing}
                    className="group relative w-full flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isSyncing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('landing_cta_syncing')}
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                                <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
                                <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
                                <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.565 0 3.515 2.7 1.545 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                            </svg>
                            {t('landing_cta_signin')}
                        </>
                    )}
                </button>
                
                {/* Remember Me Flag */}
                <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        id="rememberMe" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="rememberMe" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                        Remember me
                    </label>
                </div>
                
                <div className="text-center space-y-3 mt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                        {t('landing_secure_access')}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-left leading-relaxed shadow-sm">
                        <p className="font-bold mb-1 flex items-center gap-2">
                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            {t('landing_disclaimer_title')}
                        </p>
                        <p dangerouslySetInnerHTML={{ __html: t('landing_disclaimer_text').replace('not stored', '<strong>not stored</strong>') }} />
                    </div>
                </div>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 mt-12">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('landing_feature_sync_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t('landing_feature_sync_desc')}
                </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('landing_feature_ai_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t('landing_feature_ai_desc')}
                </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-green-200 dark:hover:border-green-800 transition-all">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('landing_feature_fleet_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t('landing_feature_fleet_desc')}
                </p>
            </div>
        </div>

        {/* Added Contact Support Button at Bottom */}
        <div className="mt-16 mb-8">
            <button className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {t('landing_contact_support')}
            </button>
        </div>
      </div>
      
      <div className="py-6 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} New ChAIffeur Services. All rights reserved.
      </div>
    </div>
  );
};
