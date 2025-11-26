
import React, { useState, useEffect, useCallback } from 'react';
import { Service, User, Supplier, SavedFilter, AppSettings, DriverLeave, ServiceType, Vehicle, VehicleAssignment } from '../types';
import { MOCK_SERVICES, MOCK_DRIVERS, MOCK_SUPPLIERS, MOCK_VEHICLES } from '../constants';

const reviveDates = (key: string, value: any) => {
    if ((key === 'startTime' || key === 'endTime' || key === 'date' || key === 'insuranceExpiry' || key === 'maintenanceDate' || key === 'deletedAt') && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }
    return value;
};

const usePersistentState = <T,>(key: string, defaultValue: T, reviver?: (key: string, value: any) => any): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                return JSON.parse(storedValue, reviver);
            }
        } catch (error) {
            console.error(`Error reading ${key} from localStorage`, error);
        }
        return defaultValue;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage`, error);
            // Check for quota exceeded
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                alert("Storage Quota Exceeded! Your recent changes may not be saved. Please clear some data or export a backup.");
            }
        }
    }, [state, key]);

    return [state, setState];
};

// Updated keys to 'v5' to accommodate new settings structure
export const useServiceManager = () => {
    const [services, setServices] = usePersistentState<Service[]>('tour-management-services-v5', MOCK_SERVICES, reviveDates);
    const [deletedServices, setDeletedServices] = usePersistentState<Service[]>('tour-management-trash-services-v1', [], reviveDates); // New Trash State
    const [drivers, setDrivers] = usePersistentState<User[]>('tour-management-drivers-v5', MOCK_DRIVERS);
    const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('tour-management-suppliers-v5', MOCK_SUPPLIERS);
    const [vehicles, setVehicles] = usePersistentState<Vehicle[]>('tour-management-vehicles-v5', MOCK_VEHICLES, reviveDates);
    const [savedFilters, setSavedFilters] = usePersistentState<SavedFilter[]>('tour-management-saved-filters-v5', []);
    const [driverLeaves, setDriverLeaves] = usePersistentState<DriverLeave[]>('tour-management-driver-leaves-v5', [], reviveDates);
    const [vehicleAssignments, setVehicleAssignments] = usePersistentState<VehicleAssignment[]>('tour-management-veh-assign-v5', [], reviveDates);
    
    const [settings, setSettings] = usePersistentState<AppSettings>('tour-management-settings-v5', {
        theme: 'dark',
        primaryColor: 'indigo',
        borderRadius: 'lg',
        fontStyle: 'inter',
        defaultView: 'calendar',
        defaultServiceDuration: 60,
        autoSyncGoogleCalendar: false,
        currency: 'EUR', // Changed default to EUR
        timeFormat: '12h',
        calendarStartHour: 0,
        calendarEndHour: 24,
        compactMode: false,
        language: 'en',
        // New Defaults
        paymentMethods: ['Prepaid', 'Pay to the driver', 'Deposit + Balance', 'Future Invoice', 'Cash', 'Credit Card'],
        serviceAliases: {
            [ServiceType.TRANSFER]: { label: 'Transfer', color: 'indigo' },
            [ServiceType.TRANSFER_WITH_STOP]: { label: 'Transfer w/ Stop', color: 'cyan' },
            [ServiceType.TOUR]: { label: 'Tour / Hourly', color: 'emerald' },
            [ServiceType.CUSTOM]: { label: 'Custom / Event', color: 'fuchsia' },
        },
        companyName: 'NCC: New ChAIffeur Calendar',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        reportHeader: 'Official Service Voucher',
        reportFooter: 'Thank you for choosing our premium services.'
    });

    // Auto-Cleanup Trash (30 days)
    useEffect(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        setDeletedServices(prev => {
            const filtered = prev.filter(s => {
                const deletedAt = s.deletedAt ? new Date(s.deletedAt) : new Date();
                return deletedAt > thirtyDaysAgo;
            });
            // Only update if there were changes to avoid infinite loop / redundant renders
            if (filtered.length !== prev.length) return filtered;
            return prev;
        });
    }, [setDeletedServices]);


    const saveService = useCallback((service: Service) => {
        setServices(prev => prev.some(s => s.id === service.id) ? prev.map(s => s.id === service.id ? service : s) : [...prev, service]);
    }, [setServices]);

    const deleteService = useCallback((serviceId: string) => {
        setServices(prev => {
            const serviceToDelete = prev.find(s => s.id === serviceId);
            if (serviceToDelete) {
                // Move to trash with timestamp
                setDeletedServices(trash => [...trash, { ...serviceToDelete, deletedAt: new Date() }]);
                return prev.filter(s => s.id !== serviceId);
            }
            return prev;
        });
    }, [setServices, setDeletedServices]);

    const restoreService = useCallback((serviceId: string) => {
        setDeletedServices(prev => {
            const serviceToRestore = prev.find(s => s.id === serviceId);
            if (serviceToRestore) {
                const { deletedAt, ...rest } = serviceToRestore;
                setServices(services => [...services, rest as Service]);
                return prev.filter(s => s.id !== serviceId);
            }
            return prev;
        });
    }, [setDeletedServices, setServices]);

    const permanentDeleteService = useCallback((serviceId: string) => {
        setDeletedServices(prev => prev.filter(s => s.id !== serviceId));
    }, [setDeletedServices]);

    const saveDriver = useCallback((driver: User) => {
        setDrivers(prev => prev.some(d => d.id === driver.id) ? prev.map(d => d.id === driver.id ? driver : d) : [...prev, driver]);
    }, [setDrivers]);
    
    const deleteDriver = useCallback((driverId: string) => {
        setDrivers(prev => prev.filter(d => d.id !== driverId));
    }, [setDrivers]);

    const saveSupplier = useCallback((supplier: Supplier) => {
        setSuppliers(prev => prev.some(s => s.id === supplier.id) ? prev.map(s => s.id === supplier.id ? supplier : s) : [...prev, supplier]);
    }, [setSuppliers]);

    const deleteSupplier = useCallback((supplierId: string) => {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    }, [setSuppliers]);

    const saveVehicle = useCallback((vehicle: Vehicle) => {
        setVehicles(prev => prev.some(v => v.id === vehicle.id) ? prev.map(v => v.id === vehicle.id ? vehicle : v) : [...prev, vehicle]);
    }, [setVehicles]);

    const deleteVehicle = useCallback((vehicleId: string) => {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    }, [setVehicles]);

    const saveFilter = useCallback((filter: SavedFilter) => {
        setSavedFilters(prev => {
            const existing = prev.find(f => f.id === filter.id);
            if (existing) {
                return prev.map(f => f.id === filter.id ? filter : f);
            }
            return [...prev, filter];
        });
    }, [setSavedFilters]);

    const deleteFilter = useCallback((filterId: string) => {
        setSavedFilters(prev => prev.filter(f => f.id !== filterId));
    }, [setSavedFilters]);

    const saveSettings = useCallback((newSettings: AppSettings) => {
        setSettings(newSettings);
    }, [setSettings]);

    const toggleDriverLeave = useCallback((driverId: string, date: Date) => {
        setDriverLeaves(prev => {
            const dateStr = date.toDateString();
            const exists = prev.find(l => l.driverId === driverId && l.date.toDateString() === dateStr);
            if (exists) {
                return prev.filter(l => l.id !== exists.id);
            } else {
                return [...prev, {
                    id: `leave-${Date.now()}-${Math.random()}`,
                    driverId,
                    date
                }];
            }
        });
    }, [setDriverLeaves]);

    const saveVehicleAssignment = useCallback((assignment: VehicleAssignment) => {
        setVehicleAssignments(prev => {
            const dateStr = assignment.date.toDateString();
            // Remove existing assignment for this vehicle on this day if exists
            const filtered = prev.filter(a => !(a.vehicleId === assignment.vehicleId && a.date.toDateString() === dateStr));
            // Also remove any other assignment for this driver on this day (one vehicle per driver per day rule? Optional, let's allow flexibility for now, but cleaning up the same vehicle is must)
            
            // If driverId is empty, we are just removing the assignment (clearing)
            if (!assignment.driverId) return filtered;

            return [...filtered, assignment];
        });
    }, [setVehicleAssignments]);

    const clearAllData = useCallback((initialData?: { drivers?: User[] }) => {
        setServices([]);
        setDeletedServices([]);
        setDrivers(initialData?.drivers || []);
        setSuppliers([]);
        setVehicles([]);
        setSavedFilters([]);
        setDriverLeaves([]);
        setVehicleAssignments([]);
    }, [setServices, setDeletedServices, setDrivers, setSuppliers, setVehicles, setSavedFilters, setDriverLeaves, setVehicleAssignments]);

    const importData = useCallback((data: any): boolean => {
        try {
            if (data && data.services && data.drivers && data.suppliers) {
                 const revivedServices = data.services.map((s: any) => ({
                    ...s,
                    startTime: new Date(s.startTime),
                    endTime: s.endTime ? new Date(s.endTime) : undefined,
                }));

                setServices(revivedServices);
                setDrivers(data.drivers);
                setSuppliers(data.suppliers);
                if(data.vehicles) {
                    const revivedVehicles = data.vehicles.map((v: any) => ({
                        ...v,
                        insuranceExpiry: v.insuranceExpiry ? new Date(v.insuranceExpiry) : undefined,
                        maintenanceDate: v.maintenanceDate ? new Date(v.maintenanceDate) : undefined,
                    }));
                    setVehicles(revivedVehicles);
                }
                if(data.savedFilters) setSavedFilters(data.savedFilters);
                if(data.driverLeaves) {
                    const revivedLeaves = data.driverLeaves.map((l: any) => ({
                        ...l,
                        date: new Date(l.date)
                    }));
                    setDriverLeaves(revivedLeaves);
                }
                if(data.vehicleAssignments) {
                    const revivedVA = data.vehicleAssignments.map((a: any) => ({
                        ...a,
                        date: new Date(a.date)
                    }));
                    setVehicleAssignments(revivedVA);
                }
                if(data.deletedServices) {
                    const revivedDeleted = data.deletedServices.map((s: any) => ({
                        ...s,
                        startTime: new Date(s.startTime),
                        endTime: s.endTime ? new Date(s.endTime) : undefined,
                        deletedAt: s.deletedAt ? new Date(s.deletedAt) : undefined
                    }));
                    setDeletedServices(revivedDeleted);
                }
                
                // Merge imported settings with defaults to ensure new fields exist
                if(data.settings) {
                    setSettings(prev => ({...prev, ...data.settings}));
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("Failed to import data:", error);
            return false;
        }
    }, [setServices, setDrivers, setSuppliers, setVehicles, setSavedFilters, setDriverLeaves, setSettings, setVehicleAssignments, setDeletedServices]);


    return { 
        services, saveService, deleteService,
        deletedServices, restoreService, permanentDeleteService,
        drivers, saveDriver, deleteDriver,
        suppliers, saveSupplier, deleteSupplier,
        vehicles, saveVehicle, deleteVehicle,
        savedFilters, saveFilter, deleteFilter,
        settings, saveSettings,
        driverLeaves, toggleDriverLeave,
        vehicleAssignments, saveVehicleAssignment,
        clearAllData,
        importData,
    };
};
