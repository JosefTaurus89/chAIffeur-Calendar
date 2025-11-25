
import { UserProfile } from '../types';

// This service simulates the Google Identity Services SDK interaction.
// In a real production app, you would use `window.google.accounts.oauth2.initTokenClient`.

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'mock-client-id';
const SESSION_KEY = 'ncc_user_session';

export const signInWithGoogle = async (rememberMe: boolean = true): Promise<UserProfile> => {
    console.log("Initiating Google Sign-In...");
    
    // SIMULATION: In a real app, this would open the Google Popup
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockUser: UserProfile = {
                id: 'google-user-123',
                name: 'Demo Google User',
                email: 'user@example.com',
                picture: 'https://lh3.googleusercontent.com/a/ACg8ocIq8d_8z_...=s96-c', // Generic Google-like avatar
                accessToken: 'mock-access-token-' + Date.now(),
            };
            
            // ALWAYS use localStorage as requested, regardless of rememberMe flag
            // This supports the requirement to always save all data permanently
            localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
            
            // Clean up session storage if it was ever used previously to avoid conflicts
            sessionStorage.removeItem(SESSION_KEY);

            resolve(mockUser);
        }, 1500); // Simulate network delay
    });
};

export const signOutGoogle = async (): Promise<void> => {
    console.log("Signing out of session (Data persisted in storage)...");
    return new Promise((resolve) => {
        // NOTE: We do NOT clear localStorage here as per requirements.
        // "dont clear localStorage or deviceStorage... when signOutGoogle"
        // We just resolve, and the UI state in App.tsx will handle the view transition to LandingPage.
        resolve();
    });
};

export const getStoredSession = (): UserProfile | null => {
    try {
        // Check local storage (primary persistence)
        const localStored = localStorage.getItem(SESSION_KEY);
        if (localStored) return JSON.parse(localStored);

        return null;
    } catch (e) {
        return null;
    }
};
