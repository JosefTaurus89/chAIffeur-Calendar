
import { Service, ServiceStatus, ServiceType, User, Supplier, PaymentStatus, Vehicle } from './types';

// User selectable colors for calendar events
export const EVENT_COLORS: Record<string, string> = {
  'Default': 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-400 dark:hover:bg-blue-900/50',
  'Red': 'bg-red-50 text-red-700 border-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200 dark:border-red-400 dark:hover:bg-red-900/50',
  'Green': 'bg-green-50 text-green-700 border-green-500 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 dark:border-green-400 dark:hover:bg-green-900/50',
  'Purple': 'bg-purple-50 text-purple-700 border-purple-500 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-400 dark:hover:bg-purple-900/50',
  'Orange': 'bg-orange-50 text-orange-700 border-orange-500 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-400 dark:hover:bg-orange-900/50',
  'Teal': 'bg-teal-50 text-teal-700 border-teal-500 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-400 dark:hover:bg-teal-900/50',
  'Gray': 'bg-slate-100 text-slate-700 border-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-700',
  'Yellow': 'bg-yellow-50 text-yellow-700 border-yellow-500 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-400 dark:hover:bg-yellow-900/50',
  'Black': 'bg-zinc-800 text-zinc-100 border-zinc-900 hover:bg-zinc-700 dark:bg-black dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-900',
};

// Modern Palette for Service Types - Used as defaults when no custom color is selected
export const ServiceColors: Record<string, string> = {
  [ServiceType.TRANSFER]: 'bg-indigo-50 text-indigo-700 border-indigo-500 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-400',
  [ServiceType.TRANSFER_WITH_STOP]: 'bg-cyan-50 text-cyan-700 border-cyan-500 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-200 dark:border-cyan-400',
  [ServiceType.TOUR]: 'bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-400',
  [ServiceType.CUSTOM]: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-500 hover:bg-fuchsia-100 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 dark:border-fuchsia-400',
};

// Helper to get just the border color class for specific uses
export const ServiceBorderColors: Record<string, string> = {
    [ServiceType.TRANSFER]: 'border-indigo-500 dark:border-indigo-400',
    [ServiceType.TRANSFER_WITH_STOP]: 'border-cyan-500 dark:border-cyan-400',
    [ServiceType.TOUR]: 'border-emerald-500 dark:border-emerald-400',
    [ServiceType.CUSTOM]: 'border-fuchsia-500 dark:border-fuchsia-400',
};

// Added for theme customization
export const THEME_COLORS: Record<string, { main: string; hover: string; ring: string }> = {
    blue: { main: 'bg-blue-600', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-500' },
    indigo: { main: 'bg-indigo-600', hover: 'hover:bg-indigo-700', ring: 'focus:ring-indigo-500' },
    purple: { main: 'bg-purple-600', hover: 'hover:bg-purple-700', ring: 'focus:ring-purple-500' },
    green: { main: 'bg-green-600', hover: 'hover:bg-green-700', ring: 'focus:ring-green-500' },
    red: { main: 'bg-red-600', hover: 'hover:bg-red-700', ring: 'focus:ring-red-500' },
    orange: { main: 'bg-orange-600', hover: 'hover:bg-orange-700', ring: 'focus:ring-orange-500' },
    amber: { main: 'bg-amber-600', hover: 'hover:bg-amber-700', ring: 'focus:ring-amber-500' },
    teal: { main: 'bg-teal-600', hover: 'hover:bg-teal-700', ring: 'focus:ring-teal-500' },
    cyan: { main: 'bg-cyan-600', hover: 'hover:bg-cyan-700', ring: 'focus:ring-cyan-500' },
    rose: { main: 'bg-rose-600', hover: 'hover:bg-rose-700', ring: 'focus:ring-rose-500' },
    slate: { main: 'bg-slate-600', hover: 'hover:bg-slate-700', ring: 'focus:ring-slate-500' },
};


const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

// Helper to generate specific dates in the current year
// Month is 0-indexed (0=Jan, 10=Nov, 11=Dec)
const getDate = (month: number, day: number, hour: number = 12, minute: number = 0) => {
    return new Date(currentYear, month, day, hour, minute);
};

// --- GENERATING 30 MOCK SERVICES ---
const generateMockServices = (): Service[] => {
    const services: Service[] = [];
    const statuses = [ServiceStatus.CONFIRMED, ServiceStatus.COMPLETED, ServiceStatus.PENDING];
    const types = [ServiceType.TRANSFER, ServiceType.TOUR, ServiceType.TRANSFER_WITH_STOP];
    const drivers = ['admin1', 'driver2', 'driver3'];
    const clients = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const locations = ['JFK Airport', 'Manhattan Hotel', 'Brooklyn Bridge', 'Newark Airport', 'Statue of Liberty', 'Central Park', 'Times Square', 'LaGuardia', 'Wall St', 'Empire State'];

    // Base Date: Start of current month
    const baseDate = new Date(currentYear, currentMonth, 1);

    for (let i = 0; i < 30; i++) {
        const dayOffset = i % 28; // Spread over 28 days
        const hour = 8 + Math.floor(Math.random() * 12); // 8 AM to 8 PM
        const start = new Date(baseDate);
        start.setDate(baseDate.getDate() + dayOffset);
        start.setHours(hour, 0, 0, 0);
        
        const duration = 1 + Math.floor(Math.random() * 3); // 1-4 hours
        const end = new Date(start);
        end.setHours(start.getHours() + duration);

        const type = types[Math.floor(Math.random() * types.length)];
        const client = clients[Math.floor(Math.random() * clients.length)];
        const price = 100 + Math.floor(Math.random() * 400);
        
        services.push({
            id: `mock-${i}`,
            title: type === ServiceType.TRANSFER ? `Transfer: ${locations[i % locations.length]} -> Hotel` : `Tour: ${locations[i % locations.length]}`,
            clientName: `${client} Family`,
            pickupAddress: locations[i % locations.length],
            dropoffAddress: locations[(i + 1) % locations.length],
            startTime: start,
            endTime: end,
            status: statuses[i % statuses.length],
            serviceType: type,
            clientPrice: price,
            supplierCost: Math.floor(price * 0.3), // 30% cost
            driverId: Math.random() > 0.3 ? drivers[Math.floor(Math.random() * drivers.length)] : undefined, // 70% assigned
            vehicleId: Math.random() > 0.3 ? `veh${(i % 3) + 1}` : undefined,
            createdById: 'admin1',
            numberOfPassengers: 1 + Math.floor(Math.random() * 6),
            passengersAdults: 1 + Math.floor(Math.random() * 2),
            passengersKids: Math.floor(Math.random() * 2),
            clientPaymentStatus: Math.random() > 0.5 ? PaymentStatus.PAID : PaymentStatus.UNPAID,
            paymentMethod: Math.random() > 0.5 ? 'Credit Card' : 'Cash',
            color: 'Default'
        });
    }
    return services;
};

export const MOCK_SERVICES: Service[] = generateMockServices();

export const MOCK_DRIVERS: User[] = [
    { id: 'admin1', name: 'Administrator (Me)', email: 'admin@example.com', phone: '15550000000', role: 'ADMIN', availability: 'Available', photoUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff' },
    { id: 'driver2', name: 'Sarah Chen', email: 'sarah@example.com', phone: '15557654321', role: 'DRIVER', availability: 'Busy', photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 'driver3', name: 'David Lee', email: 'david@example.com', phone: '15559876543', role: 'DRIVER', availability: 'On Leave', photoUrl: 'https://randomuser.me/api/portraits/men/36.jpg' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 'supplier1', name: 'Luxury Fleet Inc.', contactPerson: 'John Smith', email: 'john@luxury.com', phone: '15551112222' },
    { id: 'supplier2', name: 'Cityscape Tours LLC', contactPerson: 'Maria Garcia', email: 'maria@cityscape.com', phone: '15553334444' },
    { id: 'supplier3', name: 'Incomplete Buses Co.' },
];

export const MOCK_VEHICLES: Vehicle[] = [
    { id: 'veh1', make: 'Mercedes-Benz', model: 'S-Class', plate: 'NCC-001', year: '2023', seats: 3, status: 'Active', insuranceExpiry: getDate(11, 1), maintenanceDate: getDate(10, 15) },
    { id: 'veh2', make: 'Mercedes-Benz', model: 'V-Class', plate: 'NCC-VAN', year: '2022', seats: 7, status: 'Active', insuranceExpiry: getDate(5, 20) },
    { id: 'veh3', make: 'BMW', model: '7 Series', plate: 'NCC-002', year: '2024', seats: 3, status: 'Maintenance', insuranceExpiry: getDate(11, 31) },
];
