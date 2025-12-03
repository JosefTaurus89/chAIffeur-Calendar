
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar } from './components/calendar/Calendar';
import { ServiceModal } from './components/service/ServiceModal';
import { ServiceDetailModal } from './components/service/ServiceDetailModal';
import { ServiceList } from './components/services/ServiceList';
import { ClientList } from './components/clients/ClientList';
import { Service, View, UserProfile, User, ServiceStatus, ServiceType, PaymentStatus } from './types';
import { useServiceManager } from './hooks/useServiceManager';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './components/layout/LandingPage';
import { DriverManagement } from './components/drivers/DriverManagement';
import { SupplierManagement } from './components/suppliers/SupplierManagement';
import { VehicleManagement } from './components/vehicles/VehicleManagement';
import { FinancialsManagement } from './components/financials/FinancialsManagement';
import { SettingsManagement } from './components/settings/SettingsManagement';
import { UserManual } from './components/settings/UserManual';
import { THEME_COLORS } from './constants';
import { signInWithGoogle, signOutGoogle, getStoredSession } from './services/googleAuthService';
import { fetchIncomingGoogleEvents } from './services/googleCalendarService';
import { extractReservationDetails } from './services/geminiService';
import { useTranslation } from './hooks/useTranslation';
import { usePWAInstall } from './hooks/usePWAInstall';

const App: React.FC = () => {
  const { 
    services, saveService, deleteService,
    deletedServices, restoreService, permanentDeleteService,
    drivers, saveDriver, deleteDriver,
    suppliers, saveSupplier, deleteSupplier,
    vehicles, saveVehicle, deleteVehicle,
    savedFilters, saveFilter, deleteFilter,
    settings, saveSettings, importData,
    driverLeaves, toggleDriverLeave,
    vehicleAssignments, saveVehicleAssignment,
    clearAllData 
  } = useServiceManager();
  
  const [view, setView] = useState<View>('calendar');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | undefined>(undefined);
  const { t } = useTranslation(settings.language);
  const { isInstallable, install } = usePWAInstall();

  // --- Authentication State ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); 

  // Determine the current app user role based on the logged-in email or default to ADMIN for the main user
  const currentUser: User | undefined = useMemo(() => {
      if (user) {
          return drivers.find(d => d.email === user.email) || drivers.find(d => d.role === 'ADMIN');
      }
      return drivers.find(d => d.role === 'ADMIN');
  }, [user, drivers]);

  const userRole = currentUser?.role || 'DRIVER';

  useEffect(() => {
      const storedUser = getStoredSession();
      if (storedUser) {
          setUser(storedUser);
      }
      setIsAuthLoading(false);
      
      if (settings.defaultView) {
          setView(settings.defaultView);
      }
  }, []);

  // --- AUTOMATIC BACKUP LOGIC (12:59 PM) ---
  useEffect(() => {
      const backupCheckInterval = setInterval(() => {
          const now = new Date();
          // Check if it is 12:59 PM
          if (now.getHours() === 12 && now.getMinutes() === 59) {
              // We only want to save it once per minute (though saving multiple times in that minute is harmless but redundant)
              // Ideally we check if we already saved today, but overwriting is safer to ensure latest data.
              
              const backupData = {
                  timestamp: now.toISOString(),
                  services,
                  drivers,
                  suppliers,
                  vehicles,
                  settings,
                  savedFilters,
                  driverLeaves,
                  vehicleAssignments,
                  deletedServices
              };
              
              try {
                  localStorage.setItem('tour-management-auto-backup', JSON.stringify(backupData));
                  console.log(`[Auto Backup] Data saved successfully at ${now.toLocaleTimeString()}`);
              } catch (e) {
                  console.error("[Auto Backup] Failed to save backup to localStorage", e);
              }
          }
      }, 60000); // Check every minute

      return () => clearInterval(backupCheckInterval);
  }, [services, drivers, suppliers, vehicles, settings, savedFilters, driverLeaves, vehicleAssignments, deletedServices]);


  const isLoggedIn = !!user;

  const handleSignIn = async (rememberMe: boolean) => {
    try {
        setIsAuthLoading(true);
        setIsSyncing(true);
        
        // 1. Sign In (Always uses LocalStorage now as per requirements)
        const loggedInUser = await signInWithGoogle(rememberMe);
        setUser(loggedInUser);

        // 2. Sync Google Calendar Events
        // Ask for permission
        if (window.confirm("Do you want to sync existing events and tasks from Google Calendar (Current Year)?")) {
            // Calculate start of current year
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1); // Jan 1st

            const googleEvents = await fetchIncomingGoogleEvents(startOfYear);
            
            // 3. Process with AI (One-by-One)
            if (googleEvents.length > 0 && process.env.API_KEY) {
                let addedCount = 0;
                
                for (const event of googleEvents) {
                    // Check for duplicates based on ID
                    const exists = services.some(s => s.googleCalendarEventId === event.id);
                    
                    if (!exists) {
                        const textToAnalyze = event.description || `SUMMARY: ${event.summary}\nDATE: ${event.start.toISOString()}`;
                        
                        // Call AI Extractor
                        const extracted = await extractReservationDetails(textToAnalyze);
                        
                        if (extracted) {
                            const newService: Service = {
                                id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                title: extracted.title || event.summary,
                                clientName: extracted.clientName || 'Unknown Client',
                                clientEmail: extracted.clientEmail,
                                clientPhone: extracted.clientPhone,
                                pickupAddress: extracted.pickupAddress || 'TBD',
                                dropoffAddress: extracted.dropoffAddress || 'TBD',
                                stopAddress: extracted.stopAddress,
                                startTime: extracted.pickupTime ? new Date(extracted.pickupTime) : event.start,
                                endTime: new Date((extracted.pickupTime ? new Date(extracted.pickupTime) : event.start).getTime() + 60 * 60 * 1000),
                                status: ServiceStatus.CONFIRMED,
                                serviceType: extracted.serviceType || ServiceType.TRANSFER,
                                clientPrice: extracted.clientPrice,
                                paymentMethod: extracted.paymentMethod,
                                flightNumber: extracted.flightNumber,
                                numberOfPassengers: extracted.numberOfPassengers || 1,
                                passengersAdults: extracted.passengersAdults || 1,
                                passengersKids: extracted.passengersKids || 0,
                                passengersLuggageBig: extracted.luggageBig || 0,
                                passengersLuggageSmall: extracted.luggageSmall || 0,
                                notes: extracted.specialRequests ? `AI Extracted Note: ${extracted.specialRequests}` : undefined,
                                description: textToAnalyze, // Save the original text PERMANENTLY
                                createdById: 'system-sync',
                                googleCalendarEventId: event.id,
                                color: 'Default'
                            };
                            
                            // Save locally immediately
                            saveService(newService);
                            addedCount++;
                        }
                    }
                }
                
                if (addedCount > 0) {
                    alert(`Synced and extracted ${addedCount} new events from Google Calendar.`);
                }
            }
        }

    } catch (error) {
        console.error("Login/Sync failed", error);
        alert("Login failed or Sync error. Please try again.");
    } finally {
        setIsAuthLoading(false);
        setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    // IMPORTANT: We do NOT clear data on sign out. We just reset the UI user state.
    await signOutGoogle();
    setUser(null);
    setIsSyncing(false);
    // Navigation to LandingPage happens because !isLoggedIn renders LandingPage
  };
  
  const handleClearData = () => {
      if (window.confirm(t('confirm_reset_data'))) {
          clearAllData();
          if (user) {
               saveDriver({
                   id: `admin-${Date.now()}`,
                   name: user.name,
                   email: user.email,
                   role: 'ADMIN',
                   availability: 'Available',
                   photoUrl: user.picture
               });
          } else {
               saveDriver({
                   id: 'admin-default',
                   name: 'Administrator',
                   email: 'admin@example.com',
                   role: 'ADMIN',
                   availability: 'Available'
               });
          }
          alert(t('reset_data_success'));
          setView('calendar');
      }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const colorMap = {
      blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
      indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
      purple: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
      green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16' },
      red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
      orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
      amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
      teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
      cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344' },
      rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' },
      slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
    };
    
    const colors = colorMap[settings.primaryColor as keyof typeof colorMap] || colorMap.blue;

    Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value as string);
    });

    const radiusMap: Record<string, string> = {
      none: '0px',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '1.5rem',
    };
    const radius = radiusMap[settings.borderRadius || 'md'];
    root.style.setProperty('--radius', radius);

    const fontMap: Record<string, string> = {
      inter: "'Inter', sans-serif",
      roboto: "'Roboto', sans-serif",
      serif: "'Playfair Display', serif",
    };
    const font = fontMap[settings.fontStyle || 'inter'];
    root.style.setProperty('--font-main', font);

  }, [settings]);

  const handleAddServiceClick = () => {
    setEditingService(undefined);
    setIsServiceModalOpen(true);
  };

  const handleEdit = useCallback((service: Service) => {
    setEditingService(service);
    setIsDetailModalOpen(false);
    setIsServiceModalOpen(true);
  }, []);

  const handleSelectService = useCallback((service: Service) => {
    setSelectedService(service);
    setIsDetailModalOpen(true);
  }, []);

  const handleSaveService = useCallback((service: Service) => {
    saveService(service);
    setIsServiceModalOpen(false);
    setEditingService(undefined);
  }, [saveService]);

  const handleDeleteService = useCallback((serviceId: string) => {
    deleteService(serviceId);
    setIsDetailModalOpen(false);
    setIsServiceModalOpen(false); 
    setSelectedService(null);
  }, [deleteService]);

  const handleTimeSlotClick = useCallback((startTime: Date) => {
    if (userRole === 'ADMIN') {
      setEditingService({ startTime });
      setIsServiceModalOpen(true);
    }
  }, [userRole]);
  
  const handleImportData = useCallback((data: any) => {
    if (window.confirm("This will overwrite all current data. Are you sure you want to continue?")) {
        if (importData(data)) {
            alert("Data imported successfully!");
            setView(settings.defaultView || 'calendar'); 
        } else {
            alert("Import failed. The backup file might be corrupted or in the wrong format.");
        }
    }
  }, [importData, settings.defaultView]);

  const renderView = () => {
    if (view === 'manual') return <UserManual settings={settings} />;

    if (userRole !== 'ADMIN' && (view === 'financials' || view === 'suppliers' || view === 'settings' || view === 'vehicles' || view === 'services' || view === 'clients')) {
        setTimeout(() => setView('calendar'), 0);
        return null;
    }

    switch(view) {
      case 'drivers':
        return <DriverManagement 
                  drivers={drivers} 
                  onSave={saveDriver} 
                  onDelete={deleteDriver} 
                  services={services} 
                  settings={settings} 
                  driverLeaves={driverLeaves}
                  onToggleLeave={toggleDriverLeave}
                  currentUser={currentUser}
                  assignments={vehicleAssignments}
                  vehicles={vehicles}
                />;
      case 'suppliers':
        return <SupplierManagement suppliers={suppliers} onSave={saveSupplier} onDelete={deleteSupplier} services={services} settings={settings} />;
      case 'vehicles':
        return <VehicleManagement 
                  vehicles={vehicles} 
                  onSave={saveVehicle} 
                  onDelete={deleteVehicle} 
                  services={services} 
                  settings={settings}
                  drivers={drivers}
                  assignments={vehicleAssignments}
                  onSaveAssignment={saveVehicleAssignment}
                />;
      case 'services':
        return <ServiceList
                  services={services}
                  onSelectService={handleSelectService}
                  settings={settings}
                  drivers={drivers}
                />;
      case 'clients':
        return <ClientList
                  services={services}
                  settings={settings}
                  onSelectService={handleSelectService}
                />;
      case 'financials':
        return <FinancialsManagement services={services} drivers={drivers} suppliers={suppliers} settings={settings} />;
      case 'settings':
        return <SettingsManagement 
                  settings={settings} 
                  onSaveSettings={saveSettings}
                  onImportData={handleImportData}
                  onClearData={handleClearData}
                  appData={{services, drivers, suppliers, savedFilters, settings, driverLeaves, vehicles, vehicleAssignments, deletedServices}}
                  deletedServices={deletedServices}
                  onRestoreService={restoreService}
                  onPermanentDeleteService={permanentDeleteService}
                />;
      case 'calendar':
      default:
        return (
          <Calendar 
            services={services} 
            onSelectService={handleSelectService}
            onTimeSlotClick={handleTimeSlotClick}
            drivers={drivers}
            suppliers={suppliers}
            vehicles={vehicles}
            savedFilters={savedFilters}
            onSaveFilter={saveFilter}
            onDeleteFilter={deleteFilter}
            settings={settings}
            driverLeaves={driverLeaves}
            userRole={userRole}
            onUpdateService={saveService}
            onAddService={handleAddServiceClick}
          />
        );
    }
  }

  const theme = THEME_COLORS[settings.primaryColor] || THEME_COLORS.blue;

  if (!isLoggedIn) {
      return (
          <LandingPage onSignIn={handleSignIn} isSyncing={isSyncing} />
      );
  }

  return (
    <div className={`flex flex-col h-screen font-sans ${settings.theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Navigation Bar */}
      <Navbar 
        currentView={view} 
        setView={setView} 
        isLoggedIn={isLoggedIn}
        user={user}
        onSignIn={() => {}} // Not used here as we are logged in
        onSignOut={handleSignOut}
        language={settings.language}
        userRole={userRole}
        settings={settings}
        isInstallable={isInstallable}
        onInstallClick={install}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative">
          {renderView()}
        </main>
      </div>
      
      {/* FAB for Mobile */}
      {view === 'calendar' && userRole === 'ADMIN' && !isServiceModalOpen && !isDetailModalOpen && (
             <button
                onClick={handleAddServiceClick}
                className={`md:hidden fixed bottom-8 right-6 w-14 h-14 flex items-center justify-center rounded-full text-white shadow-xl z-[60] ${theme.main} ${theme.hover}`}
                aria-label="Add Service"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
      )}
      
      {userRole === 'ADMIN' && (
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          onSave={handleSaveService}
          onDelete={handleDeleteService}
          service={editingService}
          drivers={drivers}
          suppliers={suppliers}
          vehicles={vehicles}
          isLoggedIn={isLoggedIn}
          settings={settings}
        />
      )}
      
      {selectedService && (
        <ServiceDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          service={selectedService}
          onEdit={handleEdit}
          onDelete={handleDeleteService}
          drivers={drivers}
          suppliers={suppliers}
          vehicles={vehicles}
          isLoggedIn={isLoggedIn}
          settings={settings}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default App;
