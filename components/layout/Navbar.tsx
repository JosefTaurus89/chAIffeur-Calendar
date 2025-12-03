
import React, { useState } from 'react';
import { View, UserProfile, AppSettings } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
  isLoggedIn: boolean;
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  language: AppSettings['language'];
  userRole: 'ADMIN' | 'DRIVER' | 'PARTNER';
  settings: AppSettings;
  isInstallable?: boolean;
  onInstallClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, isLoggedIn, user, onSignIn, onSignOut, language, userRole, settings, isInstallable, onInstallClick }) => {
  const { t } = useTranslation(language);
  const isAdmin = userRole === 'ADMIN';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (view: View) => {
      setView(view);
      setIsMenuOpen(false);
  };

  const NavItem = ({ view, label, icon }: { view: View; label: string; icon: React.ReactNode }) => {
      const isActive = currentView === view;
      return (
          <button
              onClick={() => handleNavClick(view)}
              title={label}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                  isActive 
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
              {icon}
          </button>
      );
  };

  const MobileNavItem = ({ view, label, icon }: { view: View; label: string; icon: React.ReactNode }) => {
      const isActive = currentView === view;
      return (
          <button
              onClick={() => handleNavClick(view)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
              {icon}
              <span className="text-base">{label}</span>
          </button>
      );
  };

  return (
    <nav className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm print:hidden">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left: Logo & Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('calendar')}>
                {/* Elegant Minimal Calendar Icon */}
                <div className="relative w-8 h-8 flex items-center justify-center bg-primary-600 rounded-lg shadow-md text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                    </svg>
                </div>
                <div className="hidden md:block">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                        {settings.companyName || 'NCC Calendar'}
                    </h1>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Management</p>
                </div>
            </div>
          </div>

          {/* Center: Desktop Navigation (Icons Only) */}
          <div className="hidden md:flex items-center space-x-1 overflow-x-auto no-scrollbar">
            <NavItem 
                view="calendar" 
                label={t('calendar')} 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
            />
            <NavItem 
                view="drivers" 
                label={userRole === 'DRIVER' ? "My Agenda" : t('drivers')} 
                icon={
                    // Steering Wheel Icon
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 100-16 8 8 0 000 16zm-1-11h2v3h-2zm0 5h2v2h-2z" style={{display:'none'}} />
                        {/* Steering Wheel Path */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8zm-4 7h8m-8 2h8m-4-6v4" />
                        {/* Better Steering Wheel */}
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.46.04-.92.11-1.36.96 1.44 2.8 2.36 4.89 2.36h6c2.09 0 3.93-.92 4.89-2.36.07.44.11.9.11 1.36 0 4.41-3.59 8-8 8z" fill="currentColor" fillOpacity="0.2"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0l-3 3m3-3l3 3M6 12h12" />
                    </svg>
                }
            />
            {isAdmin && (
                <>
                    <NavItem 
                        view="services" 
                        label={t('services_list')} 
                        icon={
                            // Notebook with Pencil Icon
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        }
                    />
                    <NavItem 
                        view="vehicles" 
                        label="Vehicles" 
                        icon={
                            // Sedan Car Icon
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2" />
                            </svg>
                        }
                    />
                    <NavItem 
                        view="clients" 
                        label={t('clients_directory')} 
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                    />
                    <NavItem 
                        view="suppliers" 
                        label={t('suppliers')} 
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>}
                    />
                    <NavItem 
                        view="financials" 
                        label={t('financials')} 
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>}
                    />
                    <NavItem 
                        view="settings" 
                        label={t('settings')} 
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                    />
                </>
            )}
            <NavItem 
                view="manual" 
                label="Manual" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>}
            />
            
            {/* PWA Install Button (Desktop) */}
            {isInstallable && onInstallClick && (
                <button
                    onClick={onInstallClick}
                    className="flex items-center justify-center h-10 px-3 ml-2 rounded-lg transition-all duration-200 bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 text-xs font-bold uppercase"
                    title="Install App"
                >
                    Install App
                </button>
            )}

            {/* Desktop Sign Out */}
            {isLoggedIn && (
                <button
                    onClick={() => onSignOut()}
                    className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Sign Out"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            )}
          </div>

          {/* Right: Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 absolute w-full shadow-xl h-[calc(100vh-64px)] overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <MobileNavItem 
                    view="calendar" 
                    label={t('calendar')} 
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                />
                {isAdmin && (
                    <>
                        <MobileNavItem 
                            view="services" 
                            label={t('services_list')} 
                            icon={
                                // Notebook with Pencil Icon
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            }
                        />
                        <MobileNavItem 
                            view="clients" 
                            label={t('clients_directory')} 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                        />
                    </>
                )}
                <MobileNavItem 
                    view="drivers" 
                    label={userRole === 'DRIVER' ? "My Agenda" : t('drivers')} 
                    icon={
                        // Steering Wheel Icon
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0l-3 3m3-3l3 3M6 12h12" />
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v10" />
                        </svg>
                    }
                />
                {isAdmin && (
                    <>
                        <MobileNavItem 
                            view="vehicles" 
                            label="Vehicles" 
                            icon={
                                // Sedan Car Icon
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2" />
                                </svg>
                            }
                        />
                        <MobileNavItem 
                            view="suppliers" 
                            label={t('suppliers')} 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>}
                        />
                        <MobileNavItem 
                            view="financials" 
                            label={t('financials')} 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        />
                        <MobileNavItem 
                            view="settings" 
                            label={t('settings')} 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                        />
                    </>
                )}
                <MobileNavItem 
                    view="manual" 
                    label="Manual" 
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>}
                />
            </div>
            {isLoggedIn && (
                <div className="pt-4 pb-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center px-5 mb-4">
                        <div className="flex-shrink-0">
                            {user?.picture ? (
                                <img className="h-10 w-10 rounded-full" src={user.picture} alt={user.name} />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="ml-3">
                            <div className="text-base font-medium leading-none text-slate-800 dark:text-white">{user?.name}</div>
                            <div className="text-sm font-medium leading-none text-slate-500 dark:text-slate-400 mt-1">{user?.email}</div>
                        </div>
                    </div>
                    
                    {/* Mobile Install Button */}
                    {isInstallable && onInstallClick && (
                        <div className="px-5 mb-4">
                            <button
                                onClick={onInstallClick}
                                className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg shadow-sm"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Install App
                            </button>
                        </div>
                    )}

                    <div className="mt-3 px-2 space-y-1">
                        <button
                            onClick={() => { onSignOut(); setIsMenuOpen(false); }}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </nav>
  );
};
