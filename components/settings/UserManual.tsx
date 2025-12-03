
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { askManualQuestion } from '../../services/geminiService';

interface UserManualProps {
    settings: AppSettings;
}

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const UserManual: React.FC<UserManualProps> = ({ settings }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation(settings.language);
    const [mounted, setMounted] = useState(false);
    
    // AI Helper State
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePrint = () => {
        if (!contentRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>${t('manual_title')}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; }
                    h1 { color: #2563eb; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                    h2 { margin-top: 40px; color: #1e293b; border-left: 5px solid #2563eb; padding-left: 15px; }
                    h3 { margin-top: 30px; color: #475569; }
                    h4 { margin-top: 20px; font-size: 16px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    ul { margin-bottom: 20px; }
                    li { margin-bottom: 8px; }
                    .toc { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 40px; }
                    .toc-item { font-weight: bold; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <h1>${t('manual_title')}</h1>
                <div class="toc">
                    <h3>${t('manual_toc')}</h3>
                    <div class="toc-item">1. ${t('manual_intro_title')}</div>
                    <div class="toc-item">2. ${t('manual_dashboard_title')}</div>
                    <div class="toc-item">3. ${t('manual_services_title')}</div>
                    <div class="toc-item">4. ${t('manual_ai_title')}</div>
                    <div class="toc-item">5. ${t('manual_fleet_title')}</div>
                    <div class="toc-item">6. ${t('manual_financials_title')}</div>
                    <div class="toc-item">7. ${t('manual_settings_title')}</div>
                </div>
                
                <div id="intro"><h2>1. ${t('manual_intro_title')}</h2>${t('manual_intro_content')}</div>
                <div id="dashboard"><h2>2. ${t('manual_dashboard_title')}</h2>${t('manual_dashboard_content')}</div>
                <div id="services"><h2>3. ${t('manual_services_title')}</h2>${t('manual_services_content')}</div>
                <div id="ai"><h2>4. ${t('manual_ai_title')}</h2>${t('manual_ai_content')}</div>
                <div id="fleet"><h2>5. ${t('manual_fleet_title')}</h2>${t('manual_fleet_content')}</div>
                <div id="financials"><h2>6. ${t('manual_financials_title')}</h2>${t('manual_financials_content')}</div>
                <div id="settings"><h2>7. ${t('manual_settings_title')}</h2>${t('manual_settings_content')}</div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAskAI = async () => {
        if (!aiQuery.trim()) return;
        setIsLoading(true);
        setAiResponse('');

        // Aggregate Manual Content for Context
        const fullContext = `
            ${t('manual_intro_title')}: ${t('manual_intro_content')}
            ${t('manual_dashboard_title')}: ${t('manual_dashboard_content')}
            ${t('manual_services_title')}: ${t('manual_services_content')}
            ${t('manual_ai_title')}: ${t('manual_ai_content')}
            ${t('manual_fleet_title')}: ${t('manual_fleet_content')}
            ${t('manual_financials_title')}: ${t('manual_financials_content')}
            ${t('manual_settings_title')}: ${t('manual_settings_content')}
        `.replace(/<[^>]*>?/gm, ''); // Strip HTML tags for cleaner AI processing

        const answer = await askManualQuestion(aiQuery, fullContext);
        setAiResponse(answer || 'Sorry, I could not find an answer.');
        setIsLoading(false);
    };

    if (!mounted) return null;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 font-sans">
            <div className="flex-shrink-0 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 py-4 px-8 flex justify-between items-center z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold">{t('manual_title')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('manual_subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="flex items-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Print / PDF
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                <div className="max-w-4xl mx-auto pb-20" ref={contentRef}>
                    
                    {/* Updated AI Helper Section */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
                        {/* Decorational circles */}
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-6 h-6 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                <h3 className="text-xl font-bold">{t('manual_ai_helper_title')}</h3>
                            </div>
                            <p className="text-indigo-100 mb-6 max-w-2xl">{t('manual_ai_helper_desc')}</p>
                            
                            <div className="relative max-w-3xl">
                                <input 
                                    type="text" 
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                                    placeholder={t('ask_manual_placeholder')}
                                    className="w-full pl-6 pr-32 py-4 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 border-none shadow-lg text-lg bg-white"
                                />
                                <button 
                                    onClick={handleAskAI} 
                                    disabled={isLoading}
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <LoadingSpinner /> : 'Ask'}
                                </button>
                            </div>
                            
                            {/* Response Area */}
                            {aiResponse && (
                                <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 animate-fade-in-down">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 mt-1 text-2xl">✨</div>
                                        <div className="text-indigo-50 leading-relaxed font-medium whitespace-pre-wrap">{aiResponse}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table of Contents */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-12">
                        <h3 className="text-lg font-bold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{t('manual_toc')}</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            {['intro', 'dashboard', 'services', 'ai', 'fleet', 'financials', 'settings'].map((section, idx) => (
                                <li key={section}>
                                    <button onClick={() => scrollToSection(section)} className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium">
                                        {idx + 1}. {t(`manual_${section}_title` as any)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Sections */}
                    <div className="space-y-16 prose prose-slate dark:prose-invert max-w-none">
                        <section id="intro">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">1. {t('manual_intro_title')}</h2>
                            <div dangerouslySetInnerHTML={{ __html: t('manual_intro_content') }} />
                        </section>

                        <section id="dashboard">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">2. {t('manual_dashboard_title')}</h2>
                            <div dangerouslySetInnerHTML={{ __html: t('manual_dashboard_content') }} />
                        </section>

                        <section id="services">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">3. {t('manual_services_title')}</h2>
                            <div dangerouslySetInnerHTML={{ __html: t('manual_services_content') }} />
                        </section>

                        <section id="ai">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">4. {t('manual_ai_title')}</h2>
                            <div dangerouslySetInnerHTML={{ __html: t('manual_ai_content') }} />
                        </section>

                        <section id="fleet">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">5. {t('manual_fleet_title')}</h2>
                            <div dangerouslySetInnerHTML={{ __html: t('manual_fleet_content') }} />
                        </section>

                        <section id="financials">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">6. {t('manual_financials_title')}</h2>
                            <div dangerouslySetInnerHTML={{ __html: t('manual_financials_content') }} />
                        </section>

                        <section id="settings">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">7. {t('manual_settings_title')}</h2>
                            <div dangerouslySetInnerHTML={{ __html: t('manual_settings_content') }} />
                        </section>
                    </div>

                    <div className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-700 text-center text-slate-400 text-sm">
                        &copy; {new Date().getFullYear()} {settings.companyName || 'New ChAIffeur Calendar'}.
                    </div>
                </div>
            </div>
        </div>
    );
};
