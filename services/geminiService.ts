
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedReservation, ServiceType } from '../types';

export const extractReservationDetails = async (text: string): Promise<ExtractedReservation | null> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    // Return mock data for development if API key is not available
    return {
      title: "Extracted: JFK to Manhattan",
      clientName: "Jane Doe (from AI)",
      clientEmail: "jane.doe@example.com",
      clientPhone: "+15550199",
      flightNumber: "AA100",
      pickupAddress: "JFK International Airport",
      stopAddress: "Rockefeller Center",
      dropoffAddress: "1 Times Square, New York, NY",
      pickupTime: new Date().toISOString(),
      serviceType: ServiceType.TRANSFER_WITH_STOP,
      numberOfPassengers: 2,
      passengersAdults: 2,
      passengersKids: 0,
      luggageBig: 2,
      luggageSmall: 1,
      clientPrice: 120.50,
      deposit: 20.50,
      paymentMethod: "Cash",
      specialRequests: "Has 2 large bags. Needs a child seat.",
      agencyName: "Viator",
      extrasAmount: 50,
      extrasInfo: "Wine tasting commission"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Advanced System Instruction for the Model with Multilingual Capabilities
    const prompt = `
    You are an expert multilingual reservation assistant for a luxury Chauffeur & Transfer company. 
    Your goal is to extract structured data from unstructured reservation text (emails, WhatsApp messages, notes) in **English, Italian, Spanish, French, or German** and normalize it.
    
    **Current Context:**
    - Today's Date: ${dateString}
    - Resolve relative dates like "tomorrow" (domani, mañana, demain), "next Friday", "this weekend".
    - If the year is missing, assume the next upcoming occurrence.

    **Extraction & Reasoning Rules:**

    1.  **Service Type Inference:**
        - **${ServiceType.TRANSFER}**: Direct point-to-point.
        - **${ServiceType.TRANSFER_WITH_STOP}**: Look for: "stop at", "waypoint", "sosta a" (IT), "parada en" (ES), "arrêt à" (FR), "via".
        - **${ServiceType.TOUR}**: Look for: "tour", "sightseeing", "gita", "escursione", "visita", "disposal", "disposizione", "hourly", "ore".
        - **${ServiceType.CUSTOM}**: Weddings, events, complex itineraries.

    2.  **Title Generation:**
        - Concise summary (e.g., "Transfer: JFK -> Hotel", "Tour: Roma Centro").

    3.  **Logistics:**
        - **Flight/Train**: Extract codes like "BA123", "Frecciarossa 9600", "AVE 202".
        - **Addresses**: Be precise.
        - **Date/Time**: Output ISO 8601 format.

    4.  **Financials (CRITICAL - MULTILINGUAL):**
        - **Price (Total):** Look for "total", "price", "prezzo", "totale", "prix", "precio", "importo", "cost".
        - **Deposit (Partial Payment):** Look for "deposit", "acconto", "caparra", "acompte", "depósito", "anticipo". Extract the numerical value.
        - **Payment Method Detection**:
            - **"Cash"** or **"Pay to the driver"**:
                - Keywords: "cash", "contanti", "efectivo", "espèces", "pay driver", "al conducente", "all'autista", "a bordo", "saldo autista".
            - **"Prepaid"**:
                - Keywords: "paid", "prepaid", "pagato", "payé", "pagado", "credit card", "carta di credito", "stripe", "bonifico anticipato", "virement".
            - **"Paid deposit + balance to the driver"**:
                - Logic: If you find a **Deposit** amount AND the rest is to be paid to the driver/cash.
                - Keywords: "acconto... saldo", "deposit... balance", "acompte... solde".
            - **"Future Invoice"**:
                - Keywords: "invoice", "fattura", "facture", "factura", "account", "bill later", "bonifico (post)".
        - **Extras / Cross-Selling (Commission):**
            - Identify ANY additional revenue sources separate from the main transfer price.
            - Keywords: "commission", "fee", "guadagno extra", "commissione", "shopping", "wine tasting", "guide fee", "ristorante", "kickback".
            - Extract the amount and a short description.

    5.  **Passengers & Luggage:**
        - Passengers: "pax", "persone", "adulti", "bambini", "enfants", "niños".
        - **Luggage (CRITICAL)**: Look for "bags", "luggage", "suitcases", "valigie", "bagagli", "maletas", "bagages".
            - Distinguish **Big/Large/Checked** (Big) vs **Small/Hand/Carry-on** (Small).
            - If size isn't specified but count is, default to Big.

    6.  **Agency / Partner:**
        - Identify if the booking is from an agency or partner.
        - Keywords: "booked by", "via", "agency", "agenzia", "agent", "partner", "reference", "rif".
        - Extract the name of the agency (e.g., "Viator", "Booking.com", "Expedia", "Hotel Concierge").

    **Input Text to Analyze:**
    """
    ${text}
    """
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A short summary title for the calendar event." },
            clientName: { type: Type.STRING },
            clientEmail: { type: Type.STRING },
            clientPhone: { type: Type.STRING },
            flightNumber: { type: Type.STRING, description: "Flight, Train, or Ship number e.g. BA123" },
            pickupAddress: { type: Type.STRING },
            stopAddress: { type: Type.STRING, description: "Intermediate stop or waypoint if any" },
            dropoffAddress: { type: Type.STRING },
            pickupTime: { type: Type.STRING, description: "ISO 8601 Date Time string" },
            serviceType: { type: Type.STRING, enum: Object.values(ServiceType) },
            numberOfPassengers: { type: Type.INTEGER, description: "Total count" },
            passengersAdults: { type: Type.INTEGER },
            passengersKids: { type: Type.INTEGER },
            luggageBig: { type: Type.INTEGER, description: "Count of large/checked bags" },
            luggageSmall: { type: Type.INTEGER, description: "Count of small/carry-on bags" },
            clientPrice: { type: Type.NUMBER, description: "The total price agreed with the client." },
            deposit: { type: Type.NUMBER, description: "The amount already paid or to be paid as a deposit." },
            paymentMethod: { type: Type.STRING, enum: ["Cash", "Prepaid", "Future Invoice", "Pay to the driver", "Paid deposit + balance to the driver"] },
            specialRequests: { type: Type.STRING, description: "Luggage, child seats, notes, and extra details not covered elsewhere." },
            agencyName: { type: Type.STRING, description: "The name of the booking agency or partner if applicable." },
            extrasAmount: { type: Type.NUMBER, description: "Amount of extra commission or revenue from cross-selling." },
            extrasInfo: { type: Type.STRING, description: "Description of the extra revenue source (e.g., 'Wine Tasting Commission')." },
          },
        },
      },
    });

    const jsonString = response.text.trim();
    if (jsonString) {
      return JSON.parse(jsonString) as ExtractedReservation;
    }
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};

export const getFinancialInsights = async (financialData: any, query: string): Promise<string | null> => {
    if (!process.env.API_KEY) {
        console.warn("API_KEY not set. Returning mock AI financial insights.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `Mock AI Response: Based on the provided data, total revenue is $${financialData.totalRevenue.toFixed(2)} and net profit is $${financialData.netProfit.toFixed(2)}.`;
    }

    const simplifiedData = {
        totalRevenue: financialData.totalRevenue,
        totalCosts: financialData.totalCosts,
        netProfit: financialData.netProfit,
        totalServicesCount: financialData.totalServicesCount,
        reports: financialData.reports,
    };

    const prompt = `
        You are a financial analyst. Analyze this JSON data and answer the user's question concisely.
        
        DATA:
        ${JSON.stringify(simplifiedData, null, 2)}
        
        QUESTION:
        ${query}
    `;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for financial insights:", error);
        throw new Error("Failed to get insights from AI service.");
    }
};
