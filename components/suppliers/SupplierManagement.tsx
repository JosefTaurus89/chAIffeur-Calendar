
import React, { useState, useMemo } from 'react';
import { Supplier, Service, AppSettings } from '../../types';
import { SupplierReports } from '../financials/SupplierReports'; 
import { useTranslation } from '../../hooks/useTranslation';

interface SupplierManagementProps {
  suppliers: Supplier[];
  onSave: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  services: Service[];
  settings: AppSettings;
}

type SupplierView = 'list' | 'reports';

const emptyFormState: Partial<Supplier> = {
    name: '',
    contactPerson: '',
    email: '',
    phone: ''
};

export const SupplierManagement: React.FC<SupplierManagementProps> = ({ suppliers, onSave, onDelete, services, settings }) => {
  const [activeTab, setActiveTab] = useState<SupplierView>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState(emptyFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation(settings.language);

  const handleAddNew = () => {
      setEditingSupplier(null);
      setFormData(emptyFormState);
      setIsFormOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
      setEditingSupplier(supplier);
      setFormData(supplier);
      setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
      if (window.confirm(t('confirm_delete_supplier'))) {
          onDelete(id);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name) return;
      
      onSave({
          ...formData,
          id: editingSupplier?.id || `supplier-${Date.now()}`,
      } as Supplier);
      
      setIsFormOpen(false);
      setEditingSupplier(null);
  };

  const filteredSuppliers = useMemo(() => {
      if (!searchTerm) return suppliers;
      return suppliers.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [suppliers, searchTerm]);

  const TabButton = ({ name, label }: { name: SupplierView, label: string }) => (
      <button
          onClick={() => setActiveTab(name)}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === name ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
      >
          {label}
      </button>
  );

  const inputStyles = "mt-1 block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 p-2.5";

  return (
      <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
          <div className="flex-shrink-0 mb-6">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('suppliers')}</h1>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                  <TabButton name="list" label={t('supplier_list')} />
                  <TabButton name="reports" label={t('tab_reports')} />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
              {activeTab === 'list' && (
                  <>
                      {!isFormOpen && (
                          <div className="mb-6 flex flex-col sm:flex-row justify-start items-center gap-4">
                              <button
                                  onClick={handleAddNew}
                                  className="flex items-center px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                              >
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                  {t('add_supplier')}
                              </button>
                              <div className="relative w-full sm:w-64">
                                  <input 
                                      type="text" 
                                      placeholder={t('search_placeholder')}
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm" 
                                  />
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                  </div>
                              </div>
                          </div>
                      )}

                      {isFormOpen ? (
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto animate-fade-in-down">
                              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">{editingSupplier ? t('edit_supplier') : t('add_supplier')}</h2>
                              <form onSubmit={handleSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="col-span-2">
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('supplier_name')}</label>
                                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputStyles} required />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('contact_person')}</label>
                                          <input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className={inputStyles} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('contact_email')}</label>
                                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputStyles} />
                                      </div>
                                      <div className="col-span-2">
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('contact_phone')}</label>
                                          <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputStyles} />
                                      </div>
                                  </div>
                                  <div className="flex justify-end space-x-3 pt-4">
                                      <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">{t('cancel')}</button>
                                      <button type="submit" className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700">{t('save_supplier')}</button>
                                  </div>
                              </form>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredSuppliers.map(supplier => (
                                  <div key={supplier.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-start space-x-4">
                                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{supplier.name}</h3>
                                          {supplier.contactPerson && <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{supplier.contactPerson}</p>}
                                          {supplier.email && <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{supplier.email}</p>}
                                          {supplier.phone && <p className="text-sm text-slate-500 dark:text-slate-400">{supplier.phone}</p>}
                                          
                                          <div className="flex space-x-2 mt-3">
                                              <button onClick={() => handleEdit(supplier)} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">{t('edit')}</button>
                                              <button onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }} type="button" className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Supplier">
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              {filteredSuppliers.length === 0 && (
                                  <div className="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">
                                      No suppliers found.
                                  </div>
                              )}
                          </div>
                      )}
                  </>
              )}
              
              {activeTab === 'reports' && (
                  <SupplierReports suppliers={suppliers} services={services} settings={settings} />
              )}
          </div>
      </div>
  );
};
