
import React, { useState, useMemo } from 'react';
import { User, Service, AppSettings, DriverLeave, VehicleAssignment, Vehicle } from '../../types';
import { DriverAvailability } from './DriverAvailability';
import { DriverAgenda } from './DriverAgenda';
import { DriverReports } from './DriverReports';
import { useTranslation } from '../../hooks/useTranslation';

interface DriverManagementProps {
  drivers: User[];
  onSave: (driver: User) => void;
  onDelete: (driverId: string) => void;
  services: Service[];
  settings: AppSettings;
  driverLeaves: DriverLeave[];
  onToggleLeave: (driverId: string, date: Date) => void;
  currentUser?: User;
  assignments: VehicleAssignment[];
  vehicles: Vehicle[];
}

type DriverTab = 'team' | 'availability' | 'agenda' | 'reports';

const emptyFormState: Partial<User> = {
    name: '',
    email: '',
    phone: '',
    role: 'DRIVER',
    availability: 'Available',
    photoUrl: ''
};

export const DriverManagement: React.FC<DriverManagementProps> = ({ 
    drivers, onSave, onDelete, services, settings, driverLeaves, onToggleLeave, currentUser, assignments, vehicles
}) => {
  const [activeTab, setActiveTab] = useState<DriverTab>('team');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [formData, setFormData] = useState(emptyFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation(settings.language);

  const handleAddNew = () => {
      setEditingDriver(null);
      setFormData(emptyFormState);
      setIsFormOpen(true);
  };

  const handleEdit = (driver: User) => {
      setEditingDriver(driver);
      setFormData(driver);
      setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
      if (window.confirm(t('confirm_delete_driver'))) {
          onDelete(id);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.email) return;
      
      onSave({
          ...formData,
          id: editingDriver?.id || `driver-${Date.now()}`,
      } as User);
      
      setIsFormOpen(false);
      setEditingDriver(null);
  };

  const filteredDrivers = useMemo(() => {
      if (!searchTerm) return drivers;
      return drivers.filter(d => 
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          d.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [drivers, searchTerm]);

  const TabButton = ({ name, label }: { name: DriverTab, label: string }) => (
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
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('drivers')}</h1>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                  <TabButton name="team" label={t('tab_team')} />
                  <TabButton name="availability" label={t('tab_availability')} />
                  <TabButton name="agenda" label={t('tab_agenda')} />
                  <TabButton name="reports" label={t('tab_reports')} />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
              {activeTab === 'team' && (
                  <>
                      {!isFormOpen && (
                          <div className="mb-6 flex flex-col sm:flex-row justify-start items-center gap-4">
                              <button
                                  onClick={handleAddNew}
                                  className="flex items-center px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                              >
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                  {t('add_driver')}
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
                              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
                              <form onSubmit={handleSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputStyles} required />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputStyles} required />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                                          <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputStyles} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                                          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className={inputStyles}>
                                              <option value="DRIVER">Driver</option>
                                              <option value="ADMIN">Admin</option>
                                              <option value="PARTNER">Partner</option>
                                          </select>
                                      </div>
                                  </div>
                                  <div className="flex justify-end space-x-3 pt-4">
                                      <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">{t('cancel')}</button>
                                      <button type="submit" className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700">{t('save')}</button>
                                  </div>
                              </form>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredDrivers.map(driver => (
                                  <div key={driver.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-start space-x-4">
                                      <img src={driver.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=random`} alt={driver.name} className="w-16 h-16 rounded-full object-cover" />
                                      <div className="flex-1 min-w-0">
                                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{driver.name}</h3>
                                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{driver.email}</p>
                                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{driver.phone || 'No phone'}</p>
                                          <div className="flex space-x-2">
                                              <button onClick={() => handleEdit(driver)} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">{t('edit')}</button>
                                              <button onClick={(e) => { e.stopPropagation(); handleDelete(driver.id); }} type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Driver">
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </>
              )}
              
              {activeTab === 'availability' && (
                  <DriverAvailability drivers={drivers} driverLeaves={driverLeaves} onToggleLeave={onToggleLeave} />
              )}

              {activeTab === 'agenda' && (
                  <DriverAgenda drivers={drivers} services={services} settings={settings} vehicles={vehicles} assignments={assignments} />
              )}

              {activeTab === 'reports' && (
                  <DriverReports drivers={drivers} services={services} />
              )}
          </div>
      </div>
  );
};
