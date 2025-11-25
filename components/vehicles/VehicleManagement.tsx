
import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, Service, AppSettings, User, VehicleAssignment } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface VehicleManagementProps {
  vehicles: Vehicle[];
  onSave: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  services: Service[];
  settings: AppSettings;
  drivers: User[];
  assignments: VehicleAssignment[];
  onSaveAssignment: (assignment: VehicleAssignment) => void;
}

type VehicleView = 'list' | 'assignments' | 'history';

const emptyFormState: Omit<Vehicle, 'id'> & { id?: string } = {
    make: '',
    model: '',
    plate: '',
    status: 'Active',
    seats: 0,
    year: ''
};

const TabButton = ({ tabName, activeTab, label, onClick }: { tabName: VehicleView, activeTab: VehicleView, label: string, onClick: (t: VehicleView) => void }) => (
    <button
        onClick={() => onClick(tabName)}
        className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === tabName ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
    >
        {label}
    </button>
);

export const VehicleManagement: React.FC<VehicleManagementProps> = ({ vehicles, onSave, onDelete, services, settings, drivers, assignments, onSaveAssignment }) => {
  const [activeTab, setActiveTab] = useState<VehicleView>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'> & { id?: string }>(emptyFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedHistoryVehicleId, setSelectedHistoryVehicleId] = useState<string>('');
  const { t } = useTranslation(settings.language);

  useEffect(() => {
    if (editingVehicle) {
      setFormData(editingVehicle);
      setIsFormOpen(true);
    } else {
      setFormData(emptyFormState);
    }
  }, [editingVehicle]);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => {
    setEditingVehicle(null);
    setFormData(emptyFormState);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingVehicle(null);
    setIsFormOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value ? new Date(value) : undefined }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!formData.make || !formData.plate) {
        alert("Make, Model and Plate are required.");
        return;
    }
    onSave({
      ...formData,
      id: editingVehicle?.id || `veh-${Date.now()}`,
      make: formData.make,
      model: formData.model,
      plate: formData.plate,
      status: (formData.status as any) || 'Active',
    } as Vehicle);
    handleCancel();
  };

  const handleDelete = (id: string) => {
      if (window.confirm(t('confirm_delete_vehicle'))) {
          onDelete(id);
      }
  };

  const filteredVehicles = useMemo(() => {
      if (!searchTerm) return vehicles;
      const lowerTerm = searchTerm.toLowerCase();
      return vehicles.filter(v => 
        v.make.toLowerCase().includes(lowerTerm) || 
        v.model.toLowerCase().includes(lowerTerm) ||
        v.plate.toLowerCase().includes(lowerTerm)
      );
  }, [vehicles, searchTerm]);

  const handleAssignmentChange = (vehicleId: string, driverId: string) => {
      onSaveAssignment({
          id: `assign-${vehicleId}-${selectedDate}`,
          vehicleId,
          driverId,
          date: new Date(selectedDate)
      });
  };

  const vehicleHistory = useMemo(() => {
      if (!selectedHistoryVehicleId) return [];
      return assignments
        .filter(a => a.vehicleId === selectedHistoryVehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assignments, selectedHistoryVehicleId]);

  // Rule: Check if selected date is in the past (strictly before today's date start)
  const isPastDate = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      return selected.getTime() < today.getTime();
  }, [selectedDate]);

  const inputStyles = "mt-1 block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 p-2.5";
  const labelStyles = "block text-xs font-bold text-slate-500 uppercase tracking-wide dark:text-slate-400 mb-1";

  // Helper to format dates for input fields
  const formatDateForInput = (date?: Date) => {
      if(!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
  }

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
       <div className="flex-shrink-0 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('manual_fleet_title')}</h1>
            </div>
            <nav className="flex space-x-3 overflow-x-auto pb-2">
                <TabButton tabName="list" activeTab={activeTab} label={t('tab_vehicle_list')} onClick={setActiveTab} />
                <TabButton tabName="assignments" activeTab={activeTab} label={t('tab_assignments')} onClick={setActiveTab} />
                <TabButton tabName="history" activeTab={activeTab} label={t('tab_history')} onClick={setActiveTab} />
            </nav>
        </div>

      {activeTab === 'assignments' && (
          <div className="flex-1 overflow-y-auto pb-20">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="w-full md:w-auto">
                      <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">{t('date')}</label>
                      <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="w-full md:w-64 p-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                      />
                  </div>
                  {isPastDate && (
                      <div className="flex items-center px-4 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                          <span className="text-sm font-bold">History (Read-only)</span>
                      </div>
                  )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                          <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('vehicle_driver')}</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                          {vehicles.filter(v => v.status === 'Active').map(vehicle => {
                              const assignment = assignments.find(a => a.vehicleId === vehicle.id && new Date(a.date).toDateString() === new Date(selectedDate).toDateString());
                              
                              return (
                                  <tr key={vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="font-bold text-slate-800 dark:text-slate-200">{vehicle.make} {vehicle.model}</div>
                                          <div className="text-xs font-mono text-slate-500">{vehicle.plate}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <select 
                                              value={assignment?.driverId || ''} 
                                              onChange={(e) => handleAssignmentChange(vehicle.id, e.target.value)}
                                              disabled={isPastDate}
                                              className={`block w-full md:w-64 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:border-slate-600 dark:text-slate-200 py-2 ${isPastDate ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed opacity-70' : 'bg-slate-50 dark:bg-slate-700'}`}
                                          >
                                              <option value="">-- {t('unassigned')} --</option>
                                              {drivers.map(driver => (
                                                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                                              ))}
                                          </select>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          {assignment ? (
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                  Assigned
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                  Free
                                              </span>
                                          )}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'history' && (
          <div className="flex-1 overflow-auto animate-fade-in-down p-4">
                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('select_vehicle_history')}</label>
                        <select
                            value={selectedHistoryVehicleId}
                            onChange={e => setSelectedHistoryVehicleId(e.target.value)}
                            className="block w-full md:w-1/2 bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                        >
                            <option value="">-- Select --</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</option>)}
                        </select>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-0">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('assignment_date')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('vehicle_driver')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {vehicleHistory.length > 0 ? (
                                    vehicleHistory.map((assignment) => {
                                        const driver = drivers.find(d => d.id === assignment.driverId);
                                        return (
                                            <tr key={assignment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                                    {new Date(assignment.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-bold">
                                                    {driver ? driver.name : 'Unknown Driver'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                                            {selectedHistoryVehicleId ? t('no_history') : t('select_vehicle_history')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
      )}

      {activeTab === 'list' && (
        <>
        {!isFormOpen && (
            <div className="mb-6 flex flex-col sm:flex-row justify-start items-center gap-4">
                <button
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    {t('add_vehicle')}
                </button>
                <div className="relative max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm" 
                    />
                </div>
            </div>
        )}

        {isFormOpen && (
            <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg flex-shrink-0 animate-fade-in-down max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
                    <button onClick={handleCancel} className="text-slate-400 hover:text-slate-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelStyles}>Make *</label>
                            <input type="text" name="make" value={formData.make} onChange={handleChange} className={inputStyles} required placeholder="e.g. Mercedes-Benz" />
                        </div>
                        <div>
                            <label className={labelStyles}>Model *</label>
                            <input type="text" name="model" value={formData.model || ''} onChange={handleChange} className={inputStyles} required placeholder="e.g. V-Class" />
                        </div>
                        <div>
                            <label className={labelStyles}>License Plate *</label>
                            <input type="text" name="plate" value={formData.plate || ''} onChange={handleChange} className={inputStyles} required placeholder="ABC-123" />
                        </div>
                        <div>
                            <label className={labelStyles}>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={inputStyles}>
                                <option value="Active">Active</option>
                                <option value="Maintenance">In Maintenance</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyles}>Insurance Expiry</label>
                            <input type="date" name="insuranceExpiry" value={formatDateForInput(formData.insuranceExpiry)} onChange={handleDateChange} className={inputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>Maintenance Due</label>
                            <input type="date" name="maintenanceDate" value={formatDateForInput(formData.maintenanceDate)} onChange={handleDateChange} className={inputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>Year</label>
                            <input type="text" name="year" value={formData.year || ''} onChange={handleChange} className={inputStyles} placeholder="YYYY" />
                        </div>
                        <div>
                            <label className={labelStyles}>Seats</label>
                            <input type="number" name="seats" value={formData.seats || ''} onChange={handleChange} className={inputStyles} placeholder="7" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button type="button" onClick={handleCancel} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors">{t('cancel')}</button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors">{t('save')}</button>
                    </div>
                </form>
            </div>
        )}

        <div className="flex-1 overflow-y-auto pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map(vehicle => {
                    // Expiry Warning Logic
                    const now = new Date();
                    const warningDays = 30;
                    let insuranceWarning = false;
                    let maintenanceWarning = false;

                    if (vehicle.insuranceExpiry) {
                        const daysUntil = Math.ceil((new Date(vehicle.insuranceExpiry).getTime() - now.getTime()) / (1000 * 3600 * 24));
                        if (daysUntil <= warningDays) insuranceWarning = true;
                    }
                    if (vehicle.maintenanceDate) {
                        const daysUntil = Math.ceil((new Date(vehicle.maintenanceDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
                        if (daysUntil <= warningDays) maintenanceWarning = true;
                    }

                    return (
                    <div key={vehicle.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col group">
                        <div className="p-5 flex-1">
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-lg mb-4 ${vehicle.status === 'Active' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2"></path></svg>
                                </div>
                                <div className="flex space-x-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(vehicle); }} type="button" className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(vehicle.id); }} type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Vehicle">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{vehicle.make} {vehicle.model}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{vehicle.plate}</span>
                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${vehicle.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{vehicle.status}</span>
                            </div>
                            
                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                                <div className={`flex justify-between items-center text-sm ${insuranceWarning ? 'text-red-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                                    <span>Insurance:</span>
                                    <span>{vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className={`flex justify-between items-center text-sm ${maintenanceWarning ? 'text-red-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                                    <span>Maintenance:</span>
                                    <span>{vehicle.maintenanceDate ? new Date(vehicle.maintenanceDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )})}
                {filteredVehicles.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        <p>{searchTerm ? 'No vehicles match your search.' : 'No vehicles found. Add one to start tracking fleet.'}</p>
                    </div>
                )}
            </div>
        </div>
        </>
      )}
    </div>
  );
};
