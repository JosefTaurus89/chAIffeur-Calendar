
import React, { useState, useMemo } from 'react';
import { Service, ServiceStatus, ServiceType, AppSettings, User } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { formatTime } from '../../lib/calendar-utils';

interface ServiceListProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  settings: AppSettings;
  drivers: User[];
}

export const ServiceList: React.FC<ServiceListProps> = ({ services, onSelectService, settings, drivers }) => {
  const { t } = useTranslation(settings.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredServices = useMemo(() => {
    let result = services.filter(service => {
        // Search Filter
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
            service.title.toLowerCase().includes(query) ||
            service.clientName.toLowerCase().includes(query) ||
            service.pickupAddress.toLowerCase().includes(query) ||
            service.dropoffAddress.toLowerCase().includes(query) ||
            (service.id && service.id.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        // Status Filter
        if (statusFilter !== 'ALL' && service.status !== statusFilter) return false;

        // Type Filter
        if (typeFilter !== 'ALL' && service.serviceType !== typeFilter) return false;

        // Driver Filter
        if (driverFilter !== 'ALL') {
            if (driverFilter === 'UNASSIGNED') {
                if (service.driverId) return false;
            } else {
                if (service.driverId !== driverFilter) return false;
            }
        }

        return true;
    });

    // Sort
    result.sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [services, searchTerm, statusFilter, typeFilter, driverFilter, sortOrder]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-6">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('services_list')}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{filteredServices.length} {t('services_found')}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder={t('search_services')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                />
                
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                >
                    <option value="ALL">{t('status')}: All</option>
                    {Object.values(ServiceStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                >
                    <option value="ALL">{t('service_type')}: All</option>
                    {Object.keys(settings.serviceAliases).map(type => (
                        <option key={type} value={type}>{settings.serviceAliases[type].label}</option>
                    ))}
                </select>

                <select
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                >
                    <option value="ALL">{t('driver')}: All</option>
                    <option value="UNASSIGNED">{t('unassigned')}</option>
                    {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>

                <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                    {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('date')}</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('time')}</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('service')}</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('client_name')}</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('driver')}</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('client_price')}</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredServices.map(service => {
                        const driver = drivers.find(d => d.id === service.driverId);
                        const statusColor = {
                            [ServiceStatus.CONFIRMED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                            [ServiceStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                            [ServiceStatus.COMPLETED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                            [ServiceStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            [ServiceStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        }[service.status] || 'bg-slate-100 text-slate-800';

                        return (
                            <tr 
                                key={service.id} 
                                onClick={() => onSelectService(service)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">
                                    {new Date(service.startTime).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                                    {formatTime(service.startTime, settings.timeFormat)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{service.title}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{service.pickupAddress} → {service.dropoffAddress}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                    {service.clientName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                    {driver ? driver.name : (service.supplierId ? 'Supplier' : '-')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                        {service.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900 dark:text-slate-100">
                                    {service.clientPrice ? new Intl.NumberFormat(undefined, { style: 'currency', currency: settings.currency }).format(service.clientPrice) : '-'}
                                </td>
                            </tr>
                        );
                    })}
                    {filteredServices.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                                No services found matching your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};
