
import React from 'react';
import { View, UserProfile, AppSettings } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isLoggedIn: boolean;
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  language: AppSettings['language'];
  userRole: 'ADMIN' | 'DRIVER' | 'PARTNER';
}

type NavButtonProps = React.PropsWithChildren<{
  label: string;
  viewName: View;
  currentView: View;
  setView: (view: View) => void;
}>;

const NavButton = ({
  label,
  viewName,
  currentView,
  setView,
  children
}: NavButtonProps) => {
  const isActive = currentView === viewName;
  return (
    <button
      onClick={() => setView(viewName)}
      className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${
        isActive
          ? 'bg-primary-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {children}
      <span className="ml-3 font-medium">{label}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isLoggedIn, user, onSignIn, onSignOut, language, userRole }) => {
  const { t } = useTranslation(language);
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full print:hidden">
      {/* Updated Header with Icon */}
      <div className="flex flex-col items-center justify-center py-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="relative w-16 h-16 mb-3">
            {/* Calendar Icon Base */}
            <div className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col items-center overflow-hidden">
                <div className="w-full h-5 bg-primary-600"></div>
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800">{new Date().getDate()}</span>
                </div>
            </div>
            {/* Decorative Rings */}
            <div className="absolute -top-1 left-3 w-1.5 h-3 bg-slate-300 rounded-full border-2 border-white z-10"></div>
            <div className="absolute -top-1 right-3 w-1.5 h-3 bg-slate-300 rounded-full border-2 border-white z-10"></div>
        </div>
        
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center tracking-tight">
          <span className="text-primary-600">NCC</span> Calendar
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 font-medium">Management App</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavButton label={t('calendar')} viewName="calendar" currentView={currentView} setView={setView}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </NavButton>
        
        <NavButton label={userRole === 'DRIVER' ? "My Agenda" : t('drivers')} viewName="drivers" currentView={currentView} setView={setView}>
            {/* Steering Wheel Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0l-3 3m3-3l3 3M6 12h12" />
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v10" />
            </svg>
        </NavButton>
        
        {isAdmin && (
          <>
            <NavButton label={t('services_list')} viewName="services" currentView={currentView} setView={setView}>
                {/* Notebook with Pencil Icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </NavButton>
            <NavButton label={t('clients_directory')} viewName="clients" currentView={currentView} setView={setView}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </NavButton>
            <NavButton label="Vehicles" viewName="vehicles" currentView={currentView} setView={setView}>
                {/* Sedan Car Icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2" />
                </svg>
            </NavButton>
            <NavButton label={t('suppliers')} viewName="suppliers" currentView={currentView} setView={setView}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </NavButton>
             <NavButton label={t('financials')} viewName="financials" currentView={currentView} setView={setView}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
            </NavButton>
            <NavButton label={t('settings')} viewName="settings" currentView={currentView} setView={setView}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </NavButton>
          </>
        )}

        {/* Manual Button */}
        <button
          onClick={() => setView('manual')}
          className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg mt-2 ${
            currentView === 'manual'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
           <span className="ml-3 font-medium">User Manual</span>
        </button>

      </nav>
      <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-700">
          {isLoggedIn && user ? (
            <div className="flex items-center">
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full shadow-sm" />
                <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">{userRole}</p>
                    <button onClick={onSignOut} className="text-xs text-red-500 hover:underline">Sign Out</button>
                </div>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-all group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
                </svg>
              Sign in with Google
            </button>
          )}
      </div>
    </div>
  );
};
