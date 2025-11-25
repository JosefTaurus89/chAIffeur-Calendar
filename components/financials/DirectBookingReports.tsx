
import React, { useState, useMemo } from 'react';
import { Service, PaymentStatus, AppSettings } from '../../types';
import { printReport } from '../../lib/print-utils';
import { downloadCSV } from '../../lib/csv-utils';
import { useTranslation } from '../../hooks/useTranslation';

interface DirectBookingReportsProps {
  services: Service[];
  settings: AppSettings;
}

const MetricCard: React.FC<{ title: string; value: string; subtitle?: string; isHighlighted?: boolean }> = ({ title, value, subtitle, isHighlighted }) => (
  <div className={`p-4 rounded-lg shadow-sm border ${isHighlighted ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
    <h3 className={`text-sm font-medium truncate ${isHighlighted ? 'text-green-600 dark:text-green-300' : 'text-slate-500 dark:text-slate-400'}`}>{title}</h3>
    <p className={`mt-1 text-2xl font-semibold ${isHighlighted ? 'text-green-700 dark:text-green-200' : 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

export const DirectBookingReports: React.FC<DirectBookingReportsProps> = ({ services, settings }) => {
  const { t } = useTranslation(settings.language);
  
  const getLocale = () => {
      const map: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
      return map[settings.language] || 'en-US';
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: settings.currency }).format(amount);
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchQuery, setSearchQuery] = useState('');

  const directData = useMemo(() => {
    // Filter services where isDirectBooking is true
    const filteredServices = services.filter(s => {
        if (!s.isDirectBooking) return false;
        if (!selectedMonth) return true;
        
        const serviceMonth = s.startTime.toISOString().slice(0, 7);
        return serviceMonth === selectedMonth;
    });

    const totalBookings = filteredServices.length;
    const totalRevenue = filteredServices.reduce((sum, s) => sum + (s.clientPrice || 0), 0);
    const totalCost = filteredServices.reduce((sum, s) => sum + (s.supplierCost || 0), 0);
    const totalExtras = filteredServices.reduce((sum, s) => sum + (s.extrasAmount || 0), 0);
    
    const totalGain = totalRevenue - totalCost + totalExtras;

    const displayServices = filteredServices.filter(service => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return service.title.toLowerCase().includes(query) || service.clientName.toLowerCase().includes(query);
    }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return { totalBookings, totalRevenue, totalGain, displayServices };
  }, [services, selectedMonth, searchQuery]);

  const handlePrint = () => {
    if (!directData) return;
    
    const locale = getLocale();
    const monthName = new Date(selectedMonth + '-01').toLocaleString(locale, { month: 'long', year: 'numeric' });
    
    const metrics = [
        { label: t('total_services'), value: directData.totalBookings.toString() },
        { label: t('total_billed'), value: formatCurrency(directData.totalRevenue) },
        { label: t('total_gain'), value: formatCurrency(directData.totalGain) }
    ];

    const headers = [t('date'), t('service'), t('client_name'), t('client_price'), t('supplier_cost'), t('extras'), t('gain')];
    const rows = directData.displayServices.map(s => {
        const price = s.clientPrice || 0;
        const cost = s.supplierCost || 0;
        const extras = s.extrasAmount || 0;
        const gain = price - cost + extras;
        
        return [
            new Date(s.startTime).toLocaleDateString(locale),
            s.title,
            s.clientName,
            formatCurrency(price),
            formatCurrency(cost),
            formatCurrency(extras),
            formatCurrency(gain)
        ];
    });

    printReport(
        `${t('direct_booking')} Report`, 
        `${t('period')}: ${monthName}`, 
        metrics, 
        headers, 
        rows
    );
  };

  const handleExportCSV = () => {
      if (!directData) return;
      const monthName = selectedMonth;
      
      const headers = [t('date'), t('service'), t('client_name'), t('client_price'), 'Supplier Cost', 'Extras', 'Gain'];
      const rows = directData.displayServices.map(s => {
          const price = s.clientPrice || 0;
          const cost = s.supplierCost || 0;
          const extras = s.extrasAmount || 0;
          const gain = price - cost + extras;
          
          return [
            new Date(s.startTime).toLocaleDateString(getLocale()),
            s.title,
            s.clientName,
            price.toFixed(2),
            cost.toFixed(2),
            extras.toFixed(2),
            gain.toFixed(2)
          ];
      });

      downloadCSV(`direct_booking_report_${monthName}`, headers, rows);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    {t('direct_booking')} Report
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track performance for non-agency clients.</p>
            </div>
            <div className="w-full md:w-48">
                <label htmlFor="month-select-direct" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('month')}</label>
                <input 
                    type="month" 
                    id="month-select-direct"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="mt-1 block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                />
            </div>
             <div className="flex items-end space-x-2">
                <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 border border-transparent rounded-lg shadow-sm hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors"
                >
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   CSV
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print
                </button>
            </div>
        </div>

        {directData && (
            <div className="animate-fade-in-down">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <MetricCard title={t('total_services')} value={directData.totalBookings.toString()} />
                    <MetricCard title={t('total_billed')} value={formatCurrency(directData.totalRevenue)} />
                    <MetricCard title={t('total_gain')} value={formatCurrency(directData.totalGain)} isHighlighted={directData.totalGain > 0} />
                </div>

                 <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full md:w-1/2 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>

                <div className="shadow border border-slate-200 dark:border-slate-700 sm:rounded-lg overflow-x-auto bg-white dark:bg-slate-800">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('date')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('service')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('client_name')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('client_price')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('supplier_cost')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('extras')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('gain')}</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {directData.displayServices.map(service => {
                                const price = service.clientPrice || 0;
                                const cost = service.supplierCost || 0;
                                const extras = service.extrasAmount || 0;
                                const gain = price - cost + extras;
                                
                                return (
                                <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(service.startTime).toLocaleDateString(getLocale())}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{service.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{service.clientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100 font-medium">{formatCurrency(price)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">{formatCurrency(cost)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{formatCurrency(extras)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>{formatCurrency(gain)}</td>
                                </tr>
                            )})}
                            {directData.displayServices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">No direct booking services found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  )
}
