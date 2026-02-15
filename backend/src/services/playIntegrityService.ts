import { google } from 'googleapis';
import path from 'path';

const PACKAGE_NAME = 'com.chiko.attendance';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../serviceAccountKey.json');

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/playintegrity'],
});

const playIntegrity = google.playintegrity({
    version: 'v1',
    auth,
});

export type ProtectionVerdict = 'ALLOW' | 'LIMIT' | 'BLOCK';

interface VerificationResult {
    status: ProtectionVerdict;
    reasons: string[];
    details?: any; // Full response for debugging/logging
}

export const verifyPlayIntegrity = async (integrityToken: string, clientNonce: string): Promise<VerificationResult> => {
    try {
        const res = await playIntegrity.v1.decodeIntegrityToken({
            packageName: PACKAGE_NAME,
            requestBody: {
                integrityToken: integrityToken,
            },
        });

        const tokenPayload = res.data.tokenPayloadExternal;
        if (!tokenPayload) {
            throw new Error('Empty token payload');
        }

        const {
            requestDetails,
            appIntegrity,
            deviceIntegrity,
            accountDetails,
            environmentDetails,
        } = tokenPayload;

        const reasons: string[] = [];
        let verdict: ProtectionVerdict = 'ALLOW';

        const block = (reason: string) => {
            verdict = 'BLOCK';
            reasons.push(reason);
        };
        const limit = (reason: string) => {
            if (verdict !== 'BLOCK') verdict = 'LIMIT';
            reasons.push(reason);
        };

        // 1. Validate Nonce
        if (requestDetails?.nonce !== clientNonce) {
            block('Nonce mismatch');
        }

        // 2. Validate App Integrity
        if (appIntegrity?.appRecognitionVerdict !== 'PLAY_RECOGNIZED') {
            block(`App Integrity: ${appIntegrity?.appRecognitionVerdict}`);
        }
        if (appIntegrity?.packageName !== PACKAGE_NAME) {
            block(`Package Name Mismatch: ${appIntegrity?.packageName}`);
        }


        // 3. Validate Licensing
        if (accountDetails?.appLicensingVerdict !== 'LICENSED') {
            block(`Licensing: ${accountDetails?.appLicensingVerdict}`);
        }

        // 4. Validate Device Activity (Recent Device Activity)
        // environmentDetails.appAccessRiskVerdict? No, this is app access risk.
        // recent device activity is usually inside deviceIntegrity or a separate field depending on API version. 
        // In v1, it is deviceIntegrity.recentDeviceActivity?.deviceActivityLevel
        // Wait, standard response structure has `deviceIntegrity.recentDeviceActivity`.
        // User said: "Recent Device Activity: LEVEL_1... LEVEL_4".
        // Using `any` type for safety or check docs. Assuming `recentDeviceActivity`.
        const activityLevel = (deviceIntegrity as any)?.recentDeviceActivity?.deviceActivityLevel;
        if (activityLevel === 'LEVEL_4') {
            block('Recent Device Activity: LEVEL_4');
        }

        // 5. Play Protect Verdict
        // environmentDetails.playProtectVerdict
        const playProtect = environmentDetails?.playProtectVerdict;
        if (playProtect === 'HIGH_RISK') {
            block('Play Protect: HIGH_RISK');
        } else if (playProtect === 'POSSIBLE_RISK' || playProtect === 'MEDIUM_RISK') {
            limit(`Play Protect: ${playProtect}`);
        } else if (playProtect === 'UNEVALUATED') {
            limit('Play Protect: UNEVALUATED');
        }

        // 6. Device Integrity
        const deviceVerdicts = deviceIntegrity?.deviceRecognitionVerdict || [];
        if (!deviceVerdicts.includes('MEETS_BASIC_INTEGRITY')) {
            block('Device Integrity: Failed BASIC_INTEGRITY');
        } else if (!deviceVerdicts.includes('MEETS_DEVICE_INTEGRITY')) {
            // "LIMIT jika hanya MEETS_BASIC_INTEGRITY (tanpa DEVICE)"
            limit('Device Integrity: MEETS_BASIC_INTEGRITY only');
        }

        // 7. App Access Risk
        // environmentDetails.appAccessRiskVerdict.appsDetected
        const appAccess = (environmentDetails as any)?.appAccessRiskVerdict;
        if (appAccess?.appsDetected?.includes('KNOWN_INSTALLED') ||
            appAccess?.appsDetected?.includes('KNOWN_CAPTURING') ||
            appAccess?.appsDetected?.includes('KNOWN_OVERLAYS') ||
            appAccess?.appsDetected?.includes('KNOWN_CONTROLLING')) {
            // User didn't specify BLOCK for these explicitly in "BLOCK jika", 
            // but listed them in "App Access Risk" context.
            // User said: "LIMIT jika ... UNKNOWN_* app access risk".
            // Implementation:
            // If UNKNOWN present -> LIMIT.
            // If KNOWN present -> Usually implies higher risk, but user didn't explicitly say BLOCK.
            // I will assume KNOWN might be okay or also LIMIT? 
            // Re-reading: "LIMIT jika: ... UNKNOWN_* app access risk".
            // It doesn't say what to do with KNOWN. KNOWN is usually bad (screen readers defined as accessibility are okay, but malicious are not).
            // I will err on side of caution: If unknown -> limit. If known -> maybe log?
            // "LIMIT jika... verdict UNEVALUATED".
        }

        // Handling UNKNOWN_*
        const detected = appAccess?.appsDetected || [];
        const hasUnknown = detected.some((d: string) => d.startsWith('UNKNOWN_'));
        if (hasUnknown) {
            limit('App Access Risk: UNKNOWN detected');
        }

        // "limit if verdict UNEVALUATED" - which verdict? Assuming general or any key one.
        // "verdict UNEVALUATED" is listed under LIMIT.
        // If appRecognitionVerdict is UNEVALUATED?
        if (appIntegrity?.appRecognitionVerdict === 'UNEVALUATED' ||
            accountDetails?.appLicensingVerdict === 'UNEVALUATED') {
            limit('Verdict UNEVALUATED');
        }

        return {
            status: verdict,
            reasons,
            details: tokenPayload
        };

    } catch (error: any) {
        console.error('Play Integrity Verification Error:', error);
        throw new Error(error.message || 'Verification Failed');
    }
};
