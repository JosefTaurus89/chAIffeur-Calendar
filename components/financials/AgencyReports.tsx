
import React, { useState, useMemo } from 'react';
import { Service, PaymentStatus, AppSettings } from '../../types';
import { printReport } from '../../lib/print-utils';
import { downloadCSV } from '../../lib/csv-utils';
import { useTranslation } from '../../hooks/useTranslation';

interface AgencyReportsProps {
  services: Service[];
  settings: AppSettings;
}

const MetricCard: React.FC<{ title: string; value: string; subtitle?: string; isHighlighted?: boolean }> = ({ title, value, subtitle, isHighlighted }) => (
  <div className={`p-4 rounded-lg shadow-sm border ${isHighlighted ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
    <h3 className={`text-sm font-medium truncate ${isHighlighted ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>{title}</h3>
    <p className={`mt-1 text-2xl font-semibold ${isHighlighted ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

export const AgencyReports: React.FC<AgencyReportsProps> = ({ services, settings }) => {
  const { t } = useTranslation(settings.language);

  // Get unique Agency names
  const agencyNames = useMemo(() => {
    const names = new Set(services.map(s => s.agencyName).filter(Boolean)); // Filter out undefined/empty
    return Array.from(names).sort();
  }, [services]);

  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchQuery, setSearchQuery] = useState('');

  const agencyData = useMemo(() => {
    if (!selectedAgency) return null;
    
    // Filter by Agency Name AND Selected Month
    const filteredServices = services.filter(s => {
        if (s.agencyName !== selectedAgency) return false;
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
  }, [selectedAgency, services, selectedMonth, searchQuery]);

  const handlePrint = () => {
    if (!agencyData || !selectedAgency) return;
    
    const localeMap: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
    const locale = localeMap[settings.language] || 'en-US';
    const monthName = new Date(selectedMonth + '-01').toLocaleString(locale, { month: 'long', year: 'numeric' });
    
    const metrics = [
        { label: t('total_services'), value: agencyData.totalBookings.toString() },
        { label: t('total_billed'), value: `$${agencyData.totalRevenue.toFixed(2)}` },
        { label: t('total_gain'), value: `$${agencyData.totalGain.toFixed(2)}` }
    ];

    const headers = [t('date'), t('service'), t('client_name'), t('client_price'), t('supplier_cost'), t('extras'), t('gain')];
    const rows = agencyData.displayServices.map(s => {
        const price = s.clientPrice || 0;
        const cost = s.supplierCost || 0;
        const extras = s.extrasAmount || 0;
        const gain = price - cost + extras;
        
        return [
            new Date(s.startTime).toLocaleDateString(locale),
            s.title,
            s.clientName,
            `$${price.toFixed(2)}`,
            `$${cost.toFixed(2)}`,
            `$${extras.toFixed(2)}`,
            `$${gain.toFixed(2)}`
        ];
    });

    printReport(
        `Agency Report: ${selectedAgency}`, 
        `Period: ${monthName}`, 
        metrics, 
        headers, 
        rows
    );
  };

  const handleExportCSV = () => {
      if (!agencyData || !selectedAgency) return;
      const monthName = selectedMonth;
      const localeMap: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
      const locale = localeMap[settings.language] || 'en-US';
      
      const headers = [t('date'), t('service'), t('client_name'), t('client_price'), 'Supplier Cost', 'Extras', 'Gain'];
      const rows = agencyData.displayServices.map(s => {
          const price = s.clientPrice || 0;
          const cost = s.supplierCost || 0;
          const extras = s.extrasAmount || 0;
          const gain = price - cost + extras;
          
          return [
            new Date(s.startTime).toLocaleDateString(locale),
            s.title,
            s.clientName,
            price.toFixed(2),
            cost.toFixed(2),
            extras.toFixed(2),
            gain.toFixed(2)
          ];
      });

      downloadCSV(`agency_report_${selectedAgency.replace(/\s/g, '_')}_${monthName}`, headers, rows);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex-1">
                <label htmlFor="agency-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('select_agency')}</label>
                <select
                    id="agency-select"
                    value={selectedAgency}
                    onChange={e => setSelectedAgency(e.target.value)}
                    className="mt-1 block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                    <option value="">-- Select Agency --</option>
                    {agencyNames.map(name => (
                        <option key={name} value={name as string}>{name}</option>
                    ))}
                </select>
            </div>
            <div className="w-full md:w-48">
                <label htmlFor="month-select-agency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('month')}</label>
                <input 
                    type="month" 
                    id="month-select-agency"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="mt-1 block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                />
            </div>
             <div className="flex items-end space-x-2">
                <button
                    onClick={handleExportCSV}
                    disabled={!selectedAgency || !agencyData}
                    className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 border border-transparent rounded-lg shadow-sm hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors"
                >
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   CSV
                </button>
                <button
                    onClick={handlePrint}
                    disabled={!selectedAgency || !agencyData}
                    className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round