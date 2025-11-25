
import React, { useRef, useState } from 'react';
import { AppSettings, View, ServiceType, Service } from '../../types';
import { THEME_COLORS } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';

interface SettingsManagementProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onImportData: (data: any) => void;
  onClearData: () => void; // New prop
  appData: any;
  deletedServices?: Service[];
  onRestoreService?: (id: string) => void;
  onPermanentDeleteService?: (id: string) => void;
}

const SettingsCard: React.FC<React.PropsWithChildren<{title: string, description: string}>> = ({ title, description, children }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-b-lg">
            {children}
        </div>
    </div>
);

export const SettingsManagement: React.FC<SettingsManagementProps> = ({ 
    settings: globalSettings, 
    onSaveSettings, 
    onImportData, 
    onClearData,
    appData,
    deletedServices = [],
    onRestoreService,
    onPermanentDeleteService
}) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(globalSettings);
    const [activeTab, setActiveTab] = useState<'general' | 'config' | 'branding' | 'trash'>('general');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation(localSettings.language);
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newServiceTypeLabel, setNewServiceTypeLabel] = useState('');

    // Handlers
    const handleThemeChange = (theme: 'light' | 'dark') => setLocalSettings(prev => ({ ...prev, theme }));
    const handleColorChange = (color: string) => setLocalSettings(prev => ({ ...prev, primaryColor: color }));
    const handleRadiusChange = (radius: any) => setLocalSettings(prev => ({ ...prev, borderRadius: radius }));
    const handleFontChange = (font: any) => setLocalSettings(prev => ({ ...prev, fontStyle: font }));
    const handleSettingChange = (key: keyof AppSettings, value: any) => setLocalSettings(prev => ({ ...prev, [key]: value }));

    // Payment Methods Logic
    const addPaymentMethod = () => {
        if (newPaymentMethod.trim() && !localSettings.paymentMethods.includes(newPaymentMethod.trim())) {
            setLocalSettings(prev => ({
                ...prev,
                paymentMethods: [...prev.paymentMethods, newPaymentMethod.trim()]
            }));
            setNewPaymentMethod('');
        }
    };
    const removePaymentMethod = (method: string) => {
        setLocalSettings(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.filter(m => m !== method)
        }));
    };

    // Service Alias Logic
    const availableColors = ['indigo', 'cyan', 'emerald', 'fuchsia', 'orange', 'red', 'blue', 'slate'];
    
    const cycleColor = (currentColor: string) => {
        const idx = availableColors.indexOf(currentColor);
        const nextIdx = (idx + 1) % availableColors.length;
        return availableColors[nextIdx];
    };

    const handleServiceAliasChange = (type: string, field: 'label' | 'color', value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            serviceAliases: {
                ...prev.serviceAliases,
                [type]: {
                    ...prev.serviceAliases[type],
                    [field]: value
                }
            }
        }));
    };

    const addServiceType = () => {
        const label = newServiceTypeLabel.trim();
        // Auto-generate key from label (Uppercase, underscores)
        const key = label.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        
        if (key && label && !localSettings.serviceAliases[key]) {
            setLocalSettings(prev => ({
                ...prev,
                serviceAliases: {
                    ...prev.serviceAliases,
                    [key]: { label: label, color: 'blue' }
                }
            }));
            setNewServiceTypeLabel('');
        } else if (localSettings.serviceAliases[key]) {
            alert("A service type with this name already exists.");
        } else {
            alert("Please enter a valid label.");
        }
    };

    const deleteServiceType = (key: string) => {
        // Prevent deleting core types to avoid breaking system
        if (Object.values(ServiceType).includes(key as ServiceType)) {
            alert("Cannot delete default system types.");
            return;
        }
        if (window.confirm(`Delete service type "${key}"? Services using this type will retain the key but lose formatting.`)) {
            const newAliases = { ...localSettings.serviceAliases };
            delete newAliases[key];
            setLocalSettings(prev => ({ ...prev, serviceAliases: newAliases }));
        }
    }

    const handleSave = () => {
        onSaveSettings(localSettings);
        alert(t('save') + ' ' + t('completed'));
    };
    
    const handleBackup = () => {
        try {
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(appData, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `NCC_Backup_${new Date().toISOString().slice(0,10)}.json`;
            link.click();
        } catch (error) {
            console.error("Failed to create backup:", error);
            alert("An error occurred while creating the backup file.");
        }
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const data = JSON.parse(text);
                    onImportData(data);
                }
            } catch (error) {
                alert("Invalid backup file.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };
    
    const handleClearAllData = () => {
        // onClearData prop handles the confirmation and logic
        onClearData();
    };

    const TabButton = ({ id, label }: { id: 'general' | 'config' | 'branding' | 'trash', label: string }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === id ? 'bg-primary-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}
        >
            {label}
        </button>
    );

    const standardInputStyle = "block w-full p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400";

    return (
        <div className="p-4 sm:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="max-w-5xl mx-auto pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('settings')}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Customize your application experience.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg shadow-md hover:bg-primary-700 transition-all active:scale-95"
                    >
                        {t('save_changes')}
                    </button>
                </div>

                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                    <TabButton id="general" label={t('settings_general')} />
                    <TabButton id="config" label={t('settings_config')} />
                    <TabButton id="branding" label={t('settings_branding')} />
                    <TabButton id="trash" label={t('settings_trash')} />
                </div>
                
                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-fade-in-down">
                        <SettingsCard title={t('interface_theme')} description="Customize the look and feel.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{t('theme_mode')}</label>
                                    <div className="flex gap-3">
                                        {['light', 'dark'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => handleThemeChange(mode as any)}
                                                className={`flex-1 py-2 px-4 rounded-lg border capitalize transition-all ${localSettings.theme === mode ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-2 ring-primary-500/20' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                            >
                                                {mode === 'light' ? t('light_mode') : t('dark_mode')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{t('color_theme')}</label>
                                    <div className="flex flex-wrap gap-3">
                                        {Object.keys(THEME_COLORS).map(color => (
                                            <button 
                                                key={color}
                                                onClick={() => handleColorChange(color)}
                                                className={`w-8 h-8 rounded-full capitalize shadow-sm transition-transform hover:scale-110 ${THEME_COLORS[color].main} ${localSettings.primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{t('font_style')}</label>
                                    <select 
                                        value={localSettings.fontStyle} 
                                        onChange={(e) => handleFontChange(e.target.value)}
                                        className="block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm dark:text-slate-200"
                                    >
                                        <option value="inter">Inter (Clean Sans)</option>
                                        <option value="roboto">Roboto (Modern)</option>
                                        <option value="serif">Playfair (Elegant Serif)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{t('border_radius')}</label>
                                    <div className="flex gap-2 bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                        {['sm', 'md', 'lg', 'full'].map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => handleRadiusChange(r)}
                                                className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${localSettings.borderRadius === r ? 'bg-primary-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 dark:text-slate-300'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SettingsCard>

                        <SettingsCard title={t('app_behavior')} description="Regional settings and defaults.">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">{t('language')}</label>
                                    <select value={localSettings.language} onChange={(e) => handleSettingChange('language', e.target.value)} className={standardInputStyle}>
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                        <option value="it">Italiano</option>
                                        <option value="de">Deutsch</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Currency</label>
                                    <select value={localSettings.currency} onChange={(e) => handleSettingChange('currency', e.target.value)} className={standardInputStyle}>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Time Format</label>
                                    <select value={localSettings.timeFormat} onChange={(e) => handleSettingChange('timeFormat', e.target.value)} className={standardInputStyle}>
                                        <option value="12h">12 Hour (1:00 PM)</option>
                                        <option value="24h">24 Hour (13:00)</option>
                                    </select>
                                 </div>
                             </div>
                        </SettingsCard>

                        <SettingsCard title={t('data_backup')} description="Manage your data safety.">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleBackup} className="flex-1 py-3 px-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50">
                                    {t('download_backup')}
                                </button>
                                <button onClick={handleImportClick} className="flex-1 py-3 px-4 bg-white text-slate-700 border border-slate-300 rounded-lg font-bold hover:bg-slate-50 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
                                    {t('restore_data')}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-red-600 font-bold mb-2 text-sm uppercase flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    {t('danger_zone')}
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        This will permanently delete all services, drivers, clients, and history. Use this to clear example/mock data.
                                    </p>
                                    <button 
                                        onClick={handleClearAllData} 
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                    >
                                        {t('delete_all_data')}
                                    </button>
                                </div>
                            </div>
                        </SettingsCard>
                    </div>
                )}

                {/* CONFIG TAB */}
                {activeTab === 'config' && (
                    <div className="space-y-6 animate-fade-in-down">
                        <SettingsCard title={t('payment_methods_config')} description="Customize the list of available payment methods.">
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={newPaymentMethod} 
                                    onChange={(e) => setNewPaymentMethod(e.target.value)} 
                                    placeholder="Add new method (e.g. Bitcoin)"
                                    className={standardInputStyle}
                                />
                                <button onClick={addPaymentMethod} className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm flex-shrink-0">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {localSettings.paymentMethods.map(method => (
                                    <div key={method} className="flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm dark:bg-slate-700 dark:border-slate-600">
                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{method}</span>
                                        <button onClick={() => removePaymentMethod(method)} className="ml-2 text-slate-400 hover:text-red-500">×</button>
                                    </div>
                                ))}
                            </div>
                        </SettingsCard>

                        <SettingsCard title={t('service_types_config')} description="Create new types, rename them, and set their colors.">
                            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Add New Service Type</h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Service Name (e.g. Wedding Service)" 
                                        value={newServiceTypeLabel}
                                        onChange={(e) => setNewServiceTypeLabel(e.target.value)}
                                        className={standardInputStyle}
                                    />
                                    <button onClick={addServiceType} className="px-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-bold shadow-sm">Add</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {Object.keys(localSettings.serviceAliases).map(type => (
                                    <div key={type} className="flex items-center gap-3">
                                        <input 
                                            type="text"
                                            value={localSettings.serviceAliases[type]?.label || type}
                                            onChange={(e) => handleServiceAliasChange(type, 'label', e.target.value)}
                                            className={`${standardInputStyle} flex-1`}
                                            placeholder="Label"
                                        />
                                        <div className="flex items-center flex-shrink-0">
                                            <button 
                                                onClick={() => handleServiceAliasChange(type, 'color', cycleColor(localSettings.serviceAliases[type]?.color || 'blue'))}
                                                className={`w-9 h-9 rounded-full bg-${localSettings.serviceAliases[type]?.color || 'blue'}-500 border-2 border-white dark:border-slate-600 shadow-md hover:scale-110 transition-transform`}
                                                title="Click to cycle color"
                                            ></button>
                                        </div>
                                        <button 
                                            onClick={() => deleteServiceType(type)} 
                                            className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                            title="Delete Type"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </SettingsCard>
                    </div>
                )}

                {/* BRANDING TAB */}
                {activeTab === 'branding' && (
                    <div className="space-y-6 animate-fade-in-down">
                        <SettingsCard title={t('company_identity')} description="These details appear on printed Vouchers and Reports.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Company Name</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.companyName} 
                                        onChange={(e) => handleSettingChange('companyName', e.target.value)}
                                        className={standardInputStyle}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Company Address</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.companyAddress} 
                                        onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
                                        placeholder="123 Business St, City, Country"
                                        className={standardInputStyle}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Phone</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.companyPhone} 
                                        onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                                        className={standardInputStyle}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Email</label>
                                    <input 
                                        type="email" 
                                        value={localSettings.companyEmail} 
                                        onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                                        className={standardInputStyle}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Website</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.companyWebsite} 
                                        onChange={(e) => handleSettingChange('companyWebsite', e.target.value)}
                                        className={standardInputStyle}
                                    />
                                </div>
                            </div>
                        </SettingsCard>

                        <SettingsCard title={t('document_templates')} description="Customize headers and footers for PDF exports.">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Voucher Header Title</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.reportHeader} 
                                        onChange={(e) => handleSettingChange('reportHeader', e.target.value)}
                                        className={standardInputStyle}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Voucher Footer Text</label>
                                    <textarea 
                                        rows={3}
                                        value={localSettings.reportFooter} 
                                        onChange={(e) => handleSettingChange('reportFooter', e.target.value)}
                                        className={standardInputStyle}
                                    />
                                </div>
                            </div>
                        </SettingsCard>
                    </div>
                )}

                {/* TRASH TAB */}
                {activeTab === 'trash' && (
                    <div className="space-y-6 animate-fade-in-down">
                        <SettingsCard title={t('trash_bin')} description="Manage deleted services. Items are automatically permanently removed after 30 days.">
                            {deletedServices.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    <p>{t('trash_empty')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {deletedServices.map((service) => {
                                        const deletedDate = service.deletedAt ? new Date(service.deletedAt) : new Date();
                                        const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                                        const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                        return (
                                            <div key={service.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold uppercase px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                                                            Deleted
                                                        </span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {daysLeft} days left
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{service.title}</h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {new Date(service.startTime).toLocaleDateString()} - {service.clientName}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => onRestoreService && onRestoreService(service.id)}
                                                        className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-md transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                        {t('restore')}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(window.confirm(t('confirm_permanent_delete') || "Delete permanently?")) {
                                                                onPermanentDeleteService && onPermanentDeleteService(service.id);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        {t('delete_permanently')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SettingsCard>
                    </div>
                )}

            </div>
        </div>
    );
};
