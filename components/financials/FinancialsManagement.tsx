import React, { useMemo, useState } from 'react';
import { Service, ServiceStatus, User, Supplier, ServiceType, PaymentStatus, AppSettings } from '../../types';
import { AIFinancialAssistant } from './AIFinancialAssistant';
import { TrendChart } from './TrendChart';
import { InvoiceManagement } from './InvoiceManagement';
import { AgencyReports } from './AgencyReports';
import { DirectBookingReports } from './DirectBookingReports';
import { useTranslation } from '../../hooks/useTranslation';
import { printReport } from '../../lib/print-utils';

interface FinancialsManagementProps {
  services: Service[];
  drivers: User[];
  suppliers: Supplier[];
  settings: AppSettings;
}

type FinancialView = 'overview' | 'reports' | 'invoices' | 'agencies' | 'direct';

const ServiceTypeChartColors: Record<ServiceType, string> = {
  [ServiceType.TRANSFER]: '#8b5cf6',
  [ServiceType.TRANSFER_WITH_STOP]: '#3b82f6',
  [ServiceType.TOUR]: '#10b981',
  [ServiceType.CUSTOM]: '#64748b',
};

// Updated Modern Metric Card
const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    description?: string; 
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}> = ({ title, value, description, icon, trend, className }) => (
  <div className={`relative overflow-hidden p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all hover:shadow-md ${className}`}>
    <div className="flex justify-between items-start">
        <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">{value}</h3>
        </div>
        {icon && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                {icon}
            </div>
        )}
    </div>
    {description && (
        <div className="mt-3 flex items-center">
            {trend && (
                <span className={`mr-2 flex items-center text-xs font-bold ${trend === 'up' ? 'text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded' : trend === 'down' ? 'text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded' : 'text-slate-500'}`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}
                </span>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{description}</p>
        </div>
    )}
  </div>
);

const ReportBarChart: React.FC<{title: string, data: {label: string, value: number}[], currencyFormatter: (v: number) => string}> = ({ title, data, currencyFormatter }) => {
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 0);
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-full shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{title}</h3>
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
                {sortedData.map(item => {
                    const isNegative = item.value < 0;
                    const width = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0;
                    const barColor = isNegative ? 'bg-red-500' : 'bg-indigo-600';

                    return (
                        <div key={item.label} className="group">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate pr-2">{item.label}</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">{currencyFormatter(item.value)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out group-hover:opacity-90`}
                                    style={{ width: `${Math.max(width, 1)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && <p className="text-sm text-slate-500 text-center py-8 italic">No data available.</p>}
            </div>
        </div>
    )
}

const PieChart: React.FC<{ data: { label: string; value: number; color: string }[], currencyFormatter: (v: number) => string }> = ({ data, currencyFormatter }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-64 text-sm text-slate-500 italic">No revenue data to display.</div>;

    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };
    
    return (
        <div className="flex flex-col sm:flex-row items-center h-full bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative w-48 h-48 flex-shrink-0 mx-auto sm:mx-0">
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full transform -rotate-90">
                    {data.map(item => {
                        const percent = item.value / total;
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += percent;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                        const largeArcFlag = percent > 0.5 ? 1 : 0;

                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `L 0 0`,
                        ].join(' ');

                        return (
                            <path 
                                key={item.label} 
                                d={pathData} 
                                fill={item.color} 
                                className="hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                <title>{`${item.label}: ${currencyFormatter(item.value)}`}</title>
                            </path>
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase">Rev Mix</span>
                </div>
            </div>
            <div className="mt-6 sm:mt-0 sm:ml-8 w-full space-y-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Revenue by Type</h3>
                {data.map(item => (
                    <div key={item.label} className="flex items-center text-sm justify-between group">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs">({((item.value/total)*100).toFixed(0)}%)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 min-w-[70px] text-right">{currencyFormatter(item.value)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TopClientsTable: React.FC<{ clients: {name: string, revenue: number, count: number}[], currencyFormatter: (v: number) => string }> = ({ clients, currencyFormatter }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Top Clients by Revenue</h3>
        </div>
        <div className="overflow-y-auto flex-1">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Client Name</th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-500 dark:text-slate-400">Jobs</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {clients.map((client, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                                {idx + 1}. {client.name}
                            </td>
                            <td className="px-6 py-3 text-center text-slate-500 dark:text-slate-400">
                                {client.count}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                {currencyFormatter(client.revenue)}
                            </td>
                        </tr>
                    ))}
                    {clients.length === 0 && (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No client data yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

export const FinancialsManagement: React.FC<FinancialsManagementProps> = ({ services, drivers, suppliers, settings }) => {
  const [view, setView] = useState<FinancialView>('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all'); // 'all' or '0' to '11'
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [reportFilterMethod, setReportFilterMethod] = useState<string>('ALL');

  const { t } = useTranslation(settings.language);

  const getLocale = () => {
      const map: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
      return map[settings.language] || 'en-US';
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: settings.currency, maximumFractionDigits: 0 }).format(amount);
  };
  
  const formatCurrencyExact = (amount: number) => {
      return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: settings.currency }).format(amount);
  };

  // Generate Year Options
  const yearOptions = useMemo(() => {
      const years = new Set<number>();
      services.forEach(s => {
          const d = s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
          years.add(d.getFullYear());
      });
      years.add(new Date().getFullYear());
      return Array.from(years).sort((a: number, b: number) => b - a);
  }, [services]);

  // Generate Month Options
  const monthOptions = useMemo(() => {
      const months = [];
      for(let i=0; i<12; i++) {
          const date = new Date(2000, i, 1);
          months.push({ value: i.toString(), label: date.toLocaleString(getLocale(), { month: 'long' }) });
      }
      return months;
  }, [settings.language]);

  const dateRange = useMemo(() => {
    const isAll = selectedMonthFilter === 'all';
    const monthIndex = isAll ? 0 : parseInt(selectedMonthFilter, 10);
    const endMonthBase = isAll ? 12 : monthIndex + 1;
    
    const start = new Date(selectedYear, monthIndex, 1);
    const end = new Date(selectedYear, endMonthBase, 0, 23, 59, 59);
    return { start, end };
  }, [selectedYear, selectedMonthFilter]);

  const financialData = useMemo(() => {
    const now = new Date();
    const filteredServices = dateRange 
      ? services.filter(s => {
          const sTime = new Date(s.startTime).getTime();
          return sTime >= dateRange.start.getTime() && sTime <= dateRange.end.getTime();
      })
      : services;

    const completedServices = filteredServices.filter(s => s.status === ServiceStatus.COMPLETED);
    
    const totalRevenue = completedServices.reduce((sum: number, s) => sum + (s.clientPrice || 0), 0);
    const totalCosts = completedServices.reduce((sum: number, s) => sum + (s.supplierCost || 0), 0);
    const totalExtras = completedServices.reduce((sum: number, s) => sum + (s.extrasAmount || 0), 0);
    const netProfit = totalRevenue - totalCosts + totalExtras;
    
    // Advanced Metrics
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgTicket = completedServices.length > 0 ? totalRevenue / completedServices.length : 0;

    const depositsReceived = filteredServices.reduce((sum: number, s) => sum + (s.deposit || 0), 0);
    
    // Cash collected by drivers (Partial + Cash/Card/etc)
    const cashCollectedByDrivers = completedServices.reduce((sum: number, s) => {
        const price = s.clientPrice || 0;
        const deposit = s.deposit || 0;
        const method = (s.paymentMethod || '').toLowerCase();
        
        let collected = 0;
        if (
            method.includes('cash') || 
            method.includes('driver') || 
            method.includes('balance') || 
            method.includes('deposit') || 
            method.includes('card')
        ) {
            if (!method.includes('prepaid') && !method.includes('invoice')) {
                collected = Math.max(0, price - deposit);
            }
        }
        return sum + collected + (s.extrasAmount || 0);
    }, 0);
    
    const supplierLiability = filteredServices
        .filter(s => s.supplierId && s.supplierPaymentStatus !== PaymentStatus.PAID)
        .reduce((sum: number, s) => sum + (s.supplierCost || 0), 0);

    const futureServices = filteredServices.filter(s => s.startTime.getTime() > now.getTime() && s.status !== ServiceStatus.CANCELLED);
    
    const futureCash = futureServices
        .reduce((sum: number, s) => {
            const method = (s.paymentMethod || '').toLowerCase();
            if (
                (method.includes('cash') || method.includes('card') || method.includes('driver')) &&
                !method.includes('prepaid') && !method.includes('invoice')
            ) {
                return sum + Math.max(0, (s.clientPrice || 0) - (s.deposit || 0));
            }
            return sum;
        }, 0);
    
    const futureBank = futureServices
        .reduce((sum: number, s) => {
             const method = (s.paymentMethod || '').toLowerCase();
             if (
                !(method.includes('cash') || method.includes('card') || method.includes('driver')) ||
                method.includes('prepaid') || method.includes('invoice')
            ) {
                return sum + Math.max(0, (s.clientPrice || 0) - (s.deposit || 0));
            }
            return sum;
        }, 0);

    const pastServices = filteredServices.filter(s => s.startTime.getTime() <= now.getTime() && s.status !== ServiceStatus.CANCELLED);
    const pastPending = pastServices
        .filter(s => s.clientPaymentStatus !== PaymentStatus.PAID)
        .reduce((sum: number, s) => sum + Math.max(0, (s.clientPrice || 0) - (s.deposit || 0)), 0);

    // Top Clients Calculation
    const clientRevenueMap: Record<string, {revenue: number, count: number}> = {};
    completedServices.forEach(s => {
        const name = s.clientName || 'Unknown';
        if (!clientRevenueMap[name]) clientRevenueMap[name] = { revenue: 0, count: 0 };
        clientRevenueMap[name].revenue += (s.clientPrice || 0);
        clientRevenueMap[name].count += 1;
    });
    
    const topClients = Object.entries(clientRevenueMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Top 5

    // Monthly & Trend Data Construction
    const monthlyReports: any = {};
    const trendMap: any = {};
    
    services.filter(s => s.status === ServiceStatus.COMPLETED).forEach(s => {
        const d = new Date(s.startTime);
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if(!trendMap[k]) trendMap[k] = { revenue: 0, profit: 0 };
        trendMap[k].revenue += (s.clientPrice || 0);
        trendMap[k].profit += ((s.clientPrice || 0) - (s.supplierCost || 0) + (s.extrasAmount || 0));
    });

    filteredServices.forEach(service => {
        const d = new Date(service.startTime);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyReports[monthKey]) {
             monthlyReports[monthKey] = {
                totalRevenue: 0, totalCosts: 0, totalExtras: 0, netProfit: 0, services: [], 
                revenueByServiceType: [], profitByDriver: [],
                cashCollected: 0, bankCollected: 0, supplierPaid: 0, supplierPending: 0, totalDeposits: 0
            };
        }
        const report = monthlyReports[monthKey];
        report.services.push(service);
        
        if (service.status !== ServiceStatus.CANCELLED) {
             const price = service.clientPrice || 0;
             const cost = service.supplierCost || 0;
             const deposit = service.deposit || 0;
             const extra = service.extrasAmount || 0;
             const method = (service.paymentMethod || '').toLowerCase();
             
             report.totalRevenue += price;
             report.totalCosts += cost;
             report.totalExtras += extra;
             report.netProfit += (price - cost + extra);
             report.totalDeposits += deposit;

             if (
                (method.includes('cash') || method.includes('card') || method.includes('driver') || method.includes('balance')) &&
                !method.includes('prepaid') && !method.includes('invoice')
             ) {
                 report.cashCollected += Math.max(0, price - deposit);
             } else {
                 report.bankCollected += Math.max(0, price - deposit);
             }
             
             if (service.supplierPaymentStatus === PaymentStatus.PAID) {
                 report.supplierPaid += cost;
             } else {
                 report.supplierPending += cost;
             }
        }
    });
    
    const trendData = Object.keys(trendMap).sort().slice(-6).map(key => {
        const [y, m] = key.split('-');
        const label = new Date(Number(y), Number(m) - 1).toLocaleString(getLocale(), { month: 'short' });
        return { label, revenue: trendMap[key].revenue, profit: trendMap[key].profit };
    });

    Object.values(monthlyReports).forEach((report: any) => {
        const typeMap: any = {};
        const driverMap: any = {};

        report.services.forEach((s: Service) => {
            if (s.status === ServiceStatus.CANCELLED) return;
            const rev = s.clientPrice || 0;
            typeMap[s.serviceType] = (typeMap[s.serviceType] || 0) + rev;
            if (s.driverId) {
                const p = rev - (s.supplierCost || 0) + (s.extrasAmount || 0);
                driverMap[s.driverId] = (driverMap[s.driverId] || 0) + p;
            }
        });

        report.revenueByServiceType = Object.entries(typeMap)
            .map(([type, value]) => ({ label: (type as string).replace(/_/g, ' '), value: value as number, color: ServiceTypeChartColors[type as ServiceType] }))
            .filter(i => i.value > 0);

        report.profitByDriver = Object.entries(driverMap)
            .map(([id, value]) => ({ label: drivers.find(d => d.id === id)?.name || 'Unknown', value: value as number }))
            .filter(i => i.value !== 0);
    });

    const sortedMonthlyReports = Object.entries(monthlyReports).sort(([a], [b]) => b.localeCompare(a));

    return {
      totalRevenue, totalCosts, totalExtras, netProfit, totalServicesCount: completedServices.length,
      profitMargin, avgTicket, topClients,
      depositsReceived, cashCollectedByDrivers, supplierLiability,
      futureCash, futureBank, pastPending,
      monthlyReports: sortedMonthlyReports, trendData
    };
  }, [services, drivers, suppliers, dateRange, settings.language]);
  
  React.useEffect(() => {
    if (financialData.monthlyReports.length > 0 && !openMonth) {
        setOpenMonth(financialData.monthlyReports[0][0]); 
    }
  }, [financialData.monthlyReports, openMonth]);


  const TabButton: React.FC<{tabName: FinancialView, label: string}> = ({ tabName, label }) => (
    <button 
        onClick={() => setView(tabName)}
        className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap ${view === tabName ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400'}`}
    >
        {label}
    </button>
  );

  const handlePrintMonthReport = (monthKey: string, monthData: any) => {
    const [year, month] = monthKey.split('-');
    const locale = getLocale();
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(locale, { month: 'long', year: 'numeric' });

    const headers = [
        t('date'), 
        t('service'), 
        t('type'), 
        t('payment_method'), 
        t('client_price'), 
        t('supplier_cost'), 
        t('extras'), 
        t('profit')
    ];

    const filteredServices = monthData.services.filter((s: Service) => {
        if (reportFilterMethod === 'ALL') return true;
        if (reportFilterMethod === 'Cash') return s.paymentMethod === 'Cash';
        if (reportFilterMethod === 'Card/Bank') return s.paymentMethod !== 'Cash';
        return true;
    });

    const rows = filteredServices.map((s: Service) => {
        const profit = (s.clientPrice || 0) - (s.supplierCost || 0) + (s.extrasAmount || 0);
        return [
            new Date(s.startTime).toLocaleDateString(locale),
            s.title,
            s.serviceType,
            s.paymentMethod || '-',
            formatCurrencyExact(s.clientPrice || 0),
            formatCurrencyExact(s.supplierCost || 0),
            formatCurrencyExact(s.extrasAmount || 0),
            formatCurrencyExact(profit)
        ];
    });

    const totalRev = filteredServices.reduce((sum: number, s: Service) => sum + (s.clientPrice || 0), 0);
    const totalCost = filteredServices.reduce((sum: number, s: Service) => sum + (s.supplierCost || 0), 0);
    const totalExtra = filteredServices.reduce((sum: number, s: Service) => sum + (s.extrasAmount || 0), 0);
    const totalProfit = totalRev - totalCost + totalExtra;

    rows.push([
        "", "", "", "TOTALS",
        `<b>${formatCurrencyExact(totalRev)}</b>`,
        `<b>${formatCurrencyExact(totalCost)}</b>`,
        `<b>${formatCurrencyExact(totalExtra)}</b>`,
        `<b>${formatCurrencyExact(totalProfit)}</b>`
    ]);

    printReport(
        `${t('monthly_reports')} - ${monthName}`,
        `Filter: ${reportFilterMethod}`,
        [
            { label: t('total_billed'), value: formatCurrencyExact(totalRev) },
            { label: t('profit'), value: formatCurrencyExact(totalProfit) }
        ],
        headers,
        rows
    );
  };
  
  return (
    <div className="p-4 sm:p-6 h-full flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="bg-white dark:bg-slate-800 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 flex overflow-x-auto max-w-full">
                <TabButton tabName="overview" label={t('overview')} />
                <TabButton tabName="reports" label={t('monthly_reports')} />
                <TabButton tabName="agencies" label={t('agency_reports')} />
                <TabButton tabName="direct" label={t('direct_booking')} />
                <TabButton tabName="invoices" label={t('invoice_management')} />
            </div>
            
            {view !== 'invoices' && (
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <svg className="w-5 h-5 text-slate-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <select 
                        value={selectedMonthFilter} 
                        onChange={e => { setSelectedMonthFilter(e.target.value); setOpenMonth(null); }}
                        className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
                    >
                        <option value="all">{t('all_time')}</option>
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <select 
                        value={selectedYear} 
                        onChange={e => { setSelectedYear(parseInt(e.target.value)); setOpenMonth(null); }}
                        className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
                    >
                        {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            )}
        </div>

        {view === 'overview' && (
            <div className="animate-fade-in-down space-y-6 pb-20">
                {/* Top Level KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        title={t('revenue_breakdown')} 
                        value={formatCurrency(financialData.totalRevenue)} 
                        description={`${financialData.totalServicesCount} Jobs`}
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    />
                    <MetricCard 
                        title={t('profit')} 
                        value={formatCurrency(financialData.netProfit)} 
                        description={`+ ${formatCurrency(financialData.totalExtras)} ${t('extras')}`}
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>}
                        trend="up"
                    />
                    <MetricCard 
                        title="Profit Margin" 
                        value={`${financialData.profitMargin.toFixed(1)}%`} 
                        description="Efficiency Rate"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2-2z"></path></svg>}
                    />
                    <MetricCard 
                        title="Avg Ticket" 
                        value={formatCurrency(financialData.avgTicket)} 
                        description="Revenue per Job"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>}
                    />
                </div>
                
                <div className="w-full">
                    <TrendChart data={financialData.trendData} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Financial Health Forecast (2/3 width) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {t('financial_health')}
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Column 1: Cash Flow Position */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Position</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('cash_collected')}</p>
                                            <p className="text-xs text-slate-400">Held by drivers</p>
                                        </div>
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(financialData.cashCollectedByDrivers)}</p>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('supplier_debt')}</p>
                                            <p className="text-xs text-slate-400">Accounts Payable</p>
                                        </div>
                                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(financialData.supplierLiability)}</p>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('past_pending')}</p>
                                            <p className="text-xs text-slate-400">Accounts Receivable</p>
                                        </div>
                                        <p className="text-xl font-bold text-orange-500">{formatCurrency(financialData.pastPending)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Projections */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('projected_income')}</h4>
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{t('future_cash')}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(financialData.futureCash)}</span>
                                    </div>
                                    <div className="w-full bg-white dark:bg-slate-600 rounded-full h-2 mb-4">
                                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(financialData.futureCash / (financialData.futureCash + financialData.futureBank + 1)) * 100}%` }}></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{t('future_bank')}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(financialData.futureBank)}</span>
                                    </div>
                                    <div className="w-full bg-white dark:bg-slate-600 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(financialData.futureBank / (financialData.futureCash + financialData.futureBank + 1)) * 100}%` }}></div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs">Total Projected</span>
                                        <span className="font-black text-xl text-indigo-600 dark:text-indigo-400">{formatCurrency(financialData.futureCash + financialData.futureBank)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Clients Table (1/3 width) */}
                    <div className="lg:col-span-1 h-full">
                        <TopClientsTable clients={financialData.topClients} currencyFormatter={formatCurrencyExact} />
                    </div>
                </div>
                
                <AIFinancialAssistant financialData={financialData} />
            </div>
        )}

        {view === 'reports' && (
            <div className="pt-2 space-y-4 animate-fade-in-down pb-20">
                {financialData.monthlyReports.length > 0 ? (
                     financialData.monthlyReports.map(([monthKey, monthData]: [string, any]) => {
                            const [year, month] = monthKey.split('-');
                            const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(getLocale(), { month: 'long', year: 'numeric' });
                            const isOpen = openMonth === monthKey;
                            
                            const filteredServices = monthData.services.filter((s: Service) => {
                                if (reportFilterMethod === 'ALL') return true;
                                if (reportFilterMethod === 'Cash') return s.paymentMethod === 'Cash';
                                if (reportFilterMethod === 'Card/Bank') return s.paymentMethod !== 'Cash';
                                return true;
                            });

                            return (
                                <div key={monthKey} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
                                    <button 
                                        onClick={() => setOpenMonth(isOpen ? null : monthKey)}
                                        className="w-full text-left p-5 flex flex-col sm:flex-row justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'} dark:bg-slate-700 dark:text-slate-300`}>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{monthName}</h3>
                                                <p className="text-xs text-slate-500">{monthData.services.length} Services Recorded</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(monthData.totalRevenue)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Profit</p>
                                                <p className={`font-bold ${monthData.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>{formatCurrency(monthData.netProfit)}</p>
                                            </div>
                                            <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </button>
                                    
                                    {isOpen && (
                                        <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-6 animate-fade-in-down">
                                            
                                            {/* Month Stats Grid */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">{t('cash_collected')}</p>
                                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrencyExact(monthData.cashCollected)}</p>
                                                </div>
                                                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Bank Revenue</p>
                                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrencyExact(monthData.bankCollected)}</p>
                                                </div>
                                                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">{t('deposits_received')}</p>
                                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrencyExact(monthData.totalDeposits)}</p>
                                                </div>
                                                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">Total Costs</p>
                                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrencyExact(monthData.totalCosts)}</p>
                                                </div>
                                            </div>
                                            
                                            {monthData.totalExtras > 0 && (
                                                 <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <h5 className="font-bold text-purple-800 dark:text-purple-300 text-sm uppercase flex items-center">
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                            {t('extras_commission')}
                                                        </h5>
                                                    </div>
                                                    <span className="text-xl font-black text-purple-700 dark:text-purple-300">+{formatCurrencyExact(monthData.totalExtras)}</span>
                                                 </div>
                                            )}

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                                <PieChart data={monthData.revenueByServiceType} currencyFormatter={formatCurrency} />
                                                <ReportBarChart title="Profit by Driver" data={monthData.profitByDriver} currencyFormatter={formatCurrency} />
                                            </div>
                                            
                                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                                                     <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Service Log</h4>
                                                     <div className="flex items-center gap-2">
                                                         <button 
                                                            onClick={(e) => { e.stopPropagation(); handlePrintMonthReport(monthKey, monthData); }}
                                                            className="flex items-center px-3 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                                                            title="Print Log"
                                                         >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                            Print
                                                         </button>
                                                         <select 
                                                            value={reportFilterMethod}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => setReportFilterMethod(e.target.value)}
                                                            className="text-xs bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-1 pl-2 pr-8 focus:ring-primary-500 focus:border-primary-500"
                                                         >
                                                             <option value="ALL">All Methods</option>
                                                             <option value="Cash">Cash Only</option>
                                                             <option value="Card/Bank">Card / Bank</option>
                                                         </select>
                                                     </div>
                                                </div>
                                                <div className="overflow-x-auto max-h-96">
                                                     <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                                        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Service</th>
                                                                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Type</th>
                                                                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Method</th>
                                                                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Rev</th>
                                                                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Cost</th>
                                                                 <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Extra</th>
                                                                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Net</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                            {filteredServices.map((service: Service) => {
                                                                const profit = (service.clientPrice || 0) - (service.supplierCost || 0) + (service.extrasAmount || 0);
                                                                return (
                                                                    <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                                        <td className="px-4 py-3">
                                                                            <div className="font-bold text-slate-800 dark:text-slate-200">{service.title}</div>
                                                                            <div className="text-xs text-slate-400">{new Date(service.startTime).toLocaleDateString(getLocale())}</div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">
                                                                            {service.serviceType.replace(/_/g, ' ')}
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                             <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${service.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                                                {service.paymentMethod || '-'}
                                                                             </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{formatCurrencyExact(service.clientPrice || 0)}</td>
                                                                        <td className="px-4 py-3 text-right text-red-500">{formatCurrencyExact(service.supplierCost || 0)}</td>
                                                                        <td className="px-4 py-3 text-right text-purple-500">{(service.extrasAmount || 0) > 0 ? `+${formatCurrencyExact(service.extrasAmount || 0)}` : '-'}</td>
                                                                        <td className={`px-4 py-3 text-right font-bold ${profit >=0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>{formatCurrencyExact(profit)}</td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                     </table>
                                                 </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-400 font-medium">No completed services found for this period.</p>
                    </div>
                )}
            </div>
        )}

        {view === 'agencies' && (
            <div className="pt-2 h-full pb-20">
                <AgencyReports services={services} settings={settings} />
            </div>
        )}

        {view === 'direct' && (
            <div className="pt-2 h-full pb-20">
                <DirectBookingReports services={services} settings={settings} />
            </div>
        )}

        {view === 'invoices' && (
            <div className="pt-2 h-full pb-20">
                <InvoiceManagement services={services} suppliers={suppliers} settings={settings} />
            </div>
        )}
    </div>
  );
};