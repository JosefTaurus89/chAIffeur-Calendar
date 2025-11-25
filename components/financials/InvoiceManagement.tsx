
import React, { useState, useMemo } from 'react';
import { Service, Supplier, PaymentStatus, AppSettings } from '../../types';
import { printReport } from '../../lib/print-utils';
import { downloadCSV } from '../../lib/csv-utils';
import { useTranslation } from '../../hooks/useTranslation';

interface InvoiceManagementProps {
  services: Service[];
  suppliers: Supplier[];
  settings: AppSettings;
}

type InvoiceMode = 'RECEIVABLE' | 'PAYABLE';

export const InvoiceManagement: React.FC<InvoiceManagementProps> = ({ services, suppliers, settings }) => {
  const [mode, setMode] = useState<InvoiceMode>('RECEIVABLE');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const { t } = useTranslation(settings.language);

  const clientNames = useMemo(() => {
    const names = new Set(services.map(s => s.clientName).filter(Boolean));
    return Array.from(names).sort();
  }, [services]);

  const filteredData = useMemo(() => {
    let data = services.filter(s => {
        const serviceMonth = s.startTime.toISOString().slice(0, 7);
        if (selectedMonth && serviceMonth !== selectedMonth) return false;

        if (mode === 'RECEIVABLE') {
             return true;
        } else {
            return !!s.supplierId;
        }
    });

    if (mode === 'RECEIVABLE') {
        data = data.filter(s => s.paymentMethod === 'Future Invoice');
    }

    if (selectedEntity) {
        if (mode === 'RECEIVABLE') {
            data = data.filter(s => s.clientName === selectedEntity);
        } else {
            data = data.filter(s => s.supplierId === selectedEntity);
        }
    }

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        data = data.filter(s => 
            s.title.toLowerCase().includes(lowerTerm) || 
            s.clientName.toLowerCase().includes(lowerTerm) ||
            s.id.toLowerCase().includes(lowerTerm)
        );
    }

    return data.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [services, mode, selectedMonth, selectedEntity, searchTerm]);

  const totals = useMemo(() => {
      let totalAmount = 0;
      let totalPaid = 0;
      let totalDue = 0;

      filteredData.forEach(s => {
          let amount = 0;
          let paid = 0; 
          
          if (mode === 'RECEIVABLE') {
              amount = s.clientPrice || 0;
              if (s.clientPaymentStatus === PaymentStatus.PAID) {
                  paid = amount;
              } else if (s.clientPaymentStatus === PaymentStatus.PARTIAL) {
                  paid = s.deposit || 0;
              }
          } else {
              amount = s.supplierCost || 0;
               if (s.supplierPaymentStatus === PaymentStatus.PAID) {
                  paid = amount;
              } 
          }

          totalAmount += amount;
          totalPaid += paid;
      });
      
      totalDue = totalAmount - totalPaid;

      return { totalAmount, totalPaid, totalDue, count: filteredData.length };
  }, [filteredData, mode]);

  const settlementData = useMemo(() => {
      if (mode !== 'PAYABLE' || !selectedEntity) return null;

      const supplier = suppliers.find(s => s.id === selectedEntity);
      if (!supplier) return null;

      const totalCost = filteredData.reduce((sum, s) => sum + (s.supplierCost || 0), 0);
      
      const totalHeld = filteredData.reduce((sum, s) => {
          const isPrepaid = s.paymentMethod === 'Prepaid' || s.paymentMethod === 'Future Invoice';
          const balance = isPrepaid ? 0 : Math.max(0, (s.clientPrice || 0) - (s.deposit || 0));
          return sum + balance + (s.extrasAmount || 0);
      }, 0);

      const agencyServices = services.filter(s => {
         const serviceMonth = s.startTime.toISOString().slice(0, 7);
         return s.clientName === supplier.name && serviceMonth === selectedMonth;
      });
      
      const agencyPrice = agencyServices.reduce((sum, s) => sum + (s.clientPrice || 0), 0);
      const netToPay = totalCost - totalHeld - agencyPrice; 

      return { totalCost, totalHeld, agencyPrice, netToPay };
  }, [filteredData, mode, selectedEntity, services, selectedMonth, suppliers]);


  const handlePrint = () => {
      const title = mode === 'RECEIVABLE' ? t('invoice_list_receivable') : t('supplier_bills_payable');
      const entityName = selectedEntity ? `Filtered for: ${mode === 'RECEIVABLE' ? selectedEntity : suppliers.find(s => s.id === selectedEntity)?.name}` : 'All Accounts';
      const localeMap: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR' };
      const locale = localeMap[settings.language] || 'en-US';
      const monthName = new Date(selectedMonth + '-01').toLocaleString(locale, { month: 'long', year: 'numeric' });

      const metrics = [
          { label: 'Period', value: monthName },
          { label: t('total_amount'), value: `$${totals.totalAmount.toFixed(2)}` },
          { label: t('total_due'), value: `$${totals.totalDue.toFixed(2)}` }
      ];

      const headers = [
          t('date'), 
          'Service ID', 
          t('reference'), 
          mode === 'RECEIVABLE' ? t('share_client') : t('share_supplier'),
          t('payment_method'), 
          'Amount', 
          t('status')
      ];

      const rows = filteredData.map(s => [
          new Date(s.startTime).toLocaleDateString(locale),
          s.id.slice(-6),
          s.title,
          mode === 'RECEIVABLE' ? s.clientName : (suppliers.find(sup => sup.id === s.supplierId)?.name || 'Unknown'),
          s.paymentMethod || '-',
          `$${(mode === 'RECEIVABLE' ? s.clientPrice : s.supplierCost)?.toFixed(2) || '0.00'}`,
          (mode === 'RECEIVABLE' ? s.clientPaymentStatus : s.supplierPaymentStatus) || 'PENDING'
      ]);
      
      if (settlementData) {
          rows.push(["", "", "", "", "", "", ""]); 
          rows.push(["", "", `<i>${t('report_total_cost')}</i>`, `<i>${t('report_total_held')}</i>`, `<i>${t('report_agency_price')}</i>`, `<b>${t('report_final_total')}</b>`, ""]);
          rows.push(["", "", `$${settlementData.totalCost.toFixed(2)}`, `-$${settlementData.totalHeld.toFixed(2)}`, `-$${settlementData.agencyPrice.toFixed(2)}`, `<b>$${Math.abs(settlementData.netToPay).toFixed(2)}</b>`, ""]);
          const direction = settlementData.netToPay >= 0 ? t('report_agency_pays_supplier') : t('report_supplier_pays_agency');
          rows.push(["", "", "", "", "", `<i>${direction}</i>`, ""]);
      }

      printReport(title, `${entityName} - ${monthName}`, metrics, headers, rows);
  };

  const handleExport = () => {
      const filename = `invoices_${mode.toLowerCase()}_${selectedMonth}`;
       const headers = [
          t('date'), 
          'Service ID', 
          t('reference'), 
          mode === 'RECEIVABLE' ? t('share_client') : t('share_supplier'),
          t('payment_method'), 
          t('total_amount'),
          'Deposit/Partial',
          t('balance_due'), 
          t('status')
      ];

      const rows = filteredData.map(s => {
          const amount = (mode === 'RECEIVABLE' ? s.clientPrice : s.supplierCost) || 0;
          const deposit = mode === 'RECEIVABLE' ? (s.deposit || 0) : 0;
          const isPaid = (mode === 'RECEIVABLE' ? s.clientPaymentStatus : s.supplierPaymentStatus) === PaymentStatus.PAID;
          const balance = isPaid ? 0 : Math.max(0, amount - deposit);
          const localeMap: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR' };
          const locale = localeMap[settings.language] || 'en-US';

          return [
            new Date(s.startTime).toLocaleDateString(locale),
            s.id,
            s.title,
            mode === 'RECEIVABLE' ? s.clientName : (suppliers.find(sup => sup.id === s.supplierId)?.name || 'Unknown'),
            s.paymentMethod || '',
            amount.toFixed(2),
            deposit.toFixed(2),
            balance.toFixed(2),
            (mode === 'RECEIVABLE' ? s.clientPaymentStatus : s.supplierPaymentStatus) || 'PENDING'
          ];
      });
      
      if (settlementData) {
          rows.push(["", "", "", "", "", "", "", "", ""]);
          rows.push(["", "", t('calculation'), `${t('report_total_cost')} ${settlementData.totalCost.toFixed(2)}`, `${t('report_total_held')} -${settlementData.totalHeld.toFixed(2)}`, `${t('report_agency_price')} -${settlementData.agencyPrice.toFixed(2)}`, `= ${t('report_final_total')} ${Math.abs(settlementData.netToPay).toFixed(2)}`, "", ""]);
          const direction = settlementData.netToPay >= 0 ? t('report_agency_pays_supplier') : t('report_supplier_pays_agency');
          rows.push(["", "", t('report_final_settlement'), "", "", "", direction, "", ""]);
      }

      downloadCSV(filename, headers, rows);
  };

  return (
    <div className="space-y-6 animate-fade-in-down h-full flex flex-col">
        {/* Header & Controls */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button 
                    onClick={() => { setMode('RECEIVABLE'); setSelectedEntity(''); }}
                    className={`px-5 py-2 text-sm font-bold rounded-md transition-all ${mode === 'RECEIVABLE' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    {t('client_invoices')}
                </button>
                <button 
                     onClick={() => { setMode('PAYABLE'); setSelectedEntity(''); }}
                    className={`px-5 py-2 text-sm font-bold rounded-md transition-all ${mode === 'PAYABLE' ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    {t('supplier_bills')}
                </button>
            </div>

            <div className="flex items-center space-x-2">
                 <button 
                    onClick={handleExport}
                    className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    CSV
                </button>
                 <button 
                    onClick={handlePrint}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print
                </button>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t('month')}</label>
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 py-2"
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    {mode === 'RECEIVABLE' ? t('filter_by_client') : t('filter_by_supplier')}
                </label>
                <select
                    value={selectedEntity}
                    onChange={e => setSelectedEntity(e.target.value)}
                    className="block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 py-2"
                >
                    <option value="">-- All --</option>
                    {mode === 'RECEIVABLE' 
                        ? clientNames.map(name => <option key={name} value={name}>{name}</option>)
                        : suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    }
                </select>
            </div>

             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t('search_placeholder')}</label>
                 <input
                    type="text"
                    placeholder="Service ID, Ref..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 py-2"
                />
            </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('invoices_found')}</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{totals.count}</p>
                    {mode === 'RECEIVABLE' && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mt-1">Future Invoice Only</p>}
                </div>
                 <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
                    <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('past_paid')}</p>
                    <p className="text-3xl font-black text-green-600 dark:text-green-400">${totals.totalPaid.toFixed(2)}</p>
                </div>
                 <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('future_to_be_paid')}</p>
                    <p className="text-3xl font-black text-red-600 dark:text-red-400">${totals.totalDue.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
            </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm">
            <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('date')}</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('reference')}</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{mode === 'RECEIVABLE' ? t('share_client') : t('share_supplier')}</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('total_amount')}</th>
                             <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredData.length > 0 ? filteredData.map(s => {
                             const amount = mode === 'RECEIVABLE' ? s.clientPrice : s.supplierCost;
                             const status = mode === 'RECEIVABLE' ? s.clientPaymentStatus : s.supplierPaymentStatus;
                             const entityName = mode === 'RECEIVABLE' ? s.clientName : (suppliers.find(sup => sup.id === s.supplierId)?.name || 'Unknown');
                             const localeMap: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR' };
                             const locale = localeMap[settings.language] || 'en-US';

                             return (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(s.startTime).toLocaleDateString(locale)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400 dark:text-slate-500 text-xs">#{s.id.slice(-6).toUpperCase()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">{s.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{entityName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-800 dark:text-slate-100">${amount?.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                         <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wide ${
                                            status === PaymentStatus.PAID ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                            status === PaymentStatus.PARTIAL ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                         }`}>
                                            {status || 'PENDING'}
                                        </span>
                                    </td>
                                </tr>
                             );
                        }) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                    No invoice records found for this selection.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        
        {mode === 'PAYABLE' && selectedEntity && settlementData && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Net Settlement Available:</strong> This supplier also acts as a client in some transactions. Print or Export CSV to see the consolidated net payment calculation.
                </p>
            </div>
        )}
    </div>
  );
};
