
import React, { useState, useMemo } from 'react';
import { Service, AppSettings } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface ClientListProps {
  services: Service[];
  settings: AppSettings;
  onSelectService: (service: Service) => void;
}

interface ClientProfile {
    name: string;
    email?: string;
    phone?: string;
    totalSpend: number;
    bookingCount: number;
    lastBooking: Date;
    services: Service[];
}

export const ClientList: React.FC<ClientListProps> = ({ services, settings, onSelectService }) => {
  const { t } = useTranslation(settings.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  // Derive unique clients from services
  const clients = useMemo(() => {
      const clientMap = new Map<string, ClientProfile>();

      services.forEach(service => {
          if (!service.clientName) return;
          
          const key = service.clientName; // Grouping primarily by name as it's mandatory
          
          if (!clientMap.has(key)) {
              clientMap.set(key, {
                  name: service.clientName,
                  email: service.clientEmail,
                  phone: service.clientPhone,
                  totalSpend: 0,
                  bookingCount: 0,
                  lastBooking: service.startTime,
                  services: []
              });
          }

          const profile = clientMap.get(key)!;
          profile.totalSpend += (service.clientPrice || 0);
          profile.bookingCount += 1;
          profile.services.push(service);
          
          // Update contact info if found in newer bookings and missing in profile
          if (!profile.email && service.clientEmail) profile.email = service.clientEmail;
          if (!profile.phone && service.clientPhone) profile.phone = service.clientPhone;
          
          if (new Date(service.startTime).getTime() > new Date(profile.lastBooking).getTime()) {
              profile.lastBooking = service.startTime;
          }
      });

      return Array.from(clientMap.values()).sort((a, b) => b.lastBooking.getTime() - a.lastBooking.getTime());
  }, [services]);

  const filteredClients = useMemo(() => {
      if (!searchTerm) return clients;
      const query = searchTerm.toLowerCase();
      return clients.filter(c => 
          c.name.toLowerCase().includes(query) || 
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.phone && c.phone.includes(query))
      );
  }, [clients, searchTerm]);

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: settings.currency }).format(amount);
  };

  const selectedClient = useMemo(() => {
      return clients.find(c => c.name === selectedClientName);
  }, [clients, selectedClientName]);

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* Left List Panel */}
        <div className={`flex-1 flex flex-col p-6 min-w-0 ${selectedClientName ? 'hidden lg:flex lg:w-1/2' : 'w-full'}`}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('clients_directory')}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{filteredClients.length} unique clients found</p>
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('client_name')}</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('bookings')}</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('total_spend')}</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('last_booking')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredClients.map((client) => (
                            <tr 
                                key={client.name} 
                                onClick={() => setSelectedClientName(client.name)}
                                className={`cursor-pointer transition-colors ${selectedClientName === client.name ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-bold text-slate-900 dark:text-slate-100">{client.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{client.email || client.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-300">
                                    {client.bookingCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(client.totalSpend)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(client.lastBooking).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {filteredClients.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">{t('no_clients_found')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Right Details Panel (History) */}
        {selectedClientName && selectedClient && (
            <div className={`fixed inset-0 z-50 bg-white dark:bg-slate-900 lg:static lg:w-1/2 flex flex-col border-l border-slate-200 dark:border-slate-700 transition-all ${selectedClientName ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedClient.name}</h2>
                        <div className="flex flex-col mt-2 gap-1 text-sm text-slate-600 dark:text-slate-400">
                            {selectedClient.email && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    {selectedClient.email}
                                </div>
                            )}
                            {selectedClient.phone && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    {selectedClient.phone}
                                </div>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedClientName(null)}
                        className="lg:hidden p-2 bg-slate-200 dark:bg-slate-700 rounded-full"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {t('client_history')}
                    </h3>
                    <div className="space-y-4">
                        {selectedClient.services.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(service => (
                            <div 
                                key={service.id} 
                                onClick={() => onSelectService(service)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 transition-colors">
                                        {new Date(service.startTime).toLocaleDateString()}
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">{service.status}</span>
                                </div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{service.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    {service.pickupAddress} → {service.dropoffAddress}
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                                    <span className="text-slate-500">{service.serviceType.replace(/_/g, ' ')}</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(service.clientPrice || 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
