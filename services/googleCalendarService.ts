
import { Service } from '../types';

// This is a MOCK service. In a real app, you would use the Google Calendar API.

const log = (action: string, details: any) => {
    console.log(`[Google Calendar MOCK] ${action}`, details);
}

export const createCalendarEvent = async (service: Service): Promise<string> => {
    const eventId = `gcal-${Date.now()}`;
    const event = {
        summary: service.title,
        // IMPORTANT: We save the original AI-extracted description or the raw input here
        description: service.description || `Client: ${service.clientName}\nNotes: ${service.notes || 'N/A'}`,
        start: { dateTime: service.startTime.toISOString() },
        end: { dateTime: (service.endTime || new Date(service.startTime.getTime() + 3600000)).toISOString() }, // Default 1 hr duration
        location: service.pickupAddress,
    };
    log('Creating event with sync description', { serviceId: service.id, eventId, event });
    // Simulate API delay
    await new Promise(res => setTimeout(res, 500));
    return eventId;
}

export const updateCalendarEvent = async (eventId: string, service: Service): Promise<void> => {
     const event = {
        summary: service.title,
        description: service.description || `Client: ${service.clientName}\nNotes: ${service.notes || 'N/A'}`,
        start: { dateTime: service.startTime.toISOString() },
        end: { dateTime: (service.endTime || new Date(service.startTime.getTime() + 3600000)).toISOString() },
        location: service.pickupAddress,
    };
    log('Updating event with sync description', { eventId, event });
    await new Promise(res => setTimeout(res, 500));
}

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
    log('Deleting event', { eventId });
    await new Promise(res => setTimeout(res, 500));
}

// New Function: Fetch incoming events to demonstrate AI extraction
export const fetchIncomingGoogleEvents = async (fromDate?: Date): Promise<{id: string, summary: string, description: string, start: Date}[]> => {
    log('Fetching incoming events from Google Calendar...', { fromDate });
    await new Promise(res => setTimeout(res, 1500)); // Simulate network delay

    // Return some unstructured data that the AI can parse
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2); dayAfter.setHours(14, 30, 0, 0);

    const events = [
        {
            id: `gcal-import-mock-1`, // Static ID to test deduplication
            summary: "Transfer Mr. Smith",
            description: "Pick up Mr. John Smith from JFK Terminal 4. Flight BA112 arriving from London. Drop off at The Plaza Hotel. 2 pax, 3 bags. Collect $150 cash.",
            start: tomorrow
        },
        {
            id: `gcal-import-mock-2`, // Static ID to test deduplication
            summary: "City Tour - Rossi",
            description: "Half day tour of Manhattan. Client: Mario Rossi (+39 333 123456). Start from Empire State Building. 4 adults, 1 child. Pre-paid.",
            start: dayAfter
        }
    ];

    if (fromDate) {
        return events.filter(e => e.start >= fromDate);
    }
    return events;
}
