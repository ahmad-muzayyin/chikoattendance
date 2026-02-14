import { NativeModules } from 'react-native';
import * as Crypto from 'expo-crypto';

const { PlayIntegrity } = NativeModules;

export const getIntegrityToken = async (): Promise<{ token: string; nonce: string }> => {
    try {
        const nonce = Crypto.randomUUID();

        // Handle Development / Expo Go
        if (!PlayIntegrity) {
            if (__DEV__) {
                console.log('DEV MSG: PlayIntegrity not linked. Returning mock token.');
                return { token: 'mock-integrity-token-dev', nonce };
            }
            throw new Error('PlayIntegrity module not linked');
        }

        const token = await PlayIntegrity.requestIntegrityToken(nonce);
        return { token, nonce };
    } catch (error) {
        console.error('Integrity Token Error:', error);
        throw error;
    }
};
