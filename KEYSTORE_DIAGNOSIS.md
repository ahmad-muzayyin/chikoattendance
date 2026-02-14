# Keystore Diagnosis

## Findings
1. **Expected Certificate Fingerprint**: `36:58:38:9D:71:44:A5:9B:C0:DE:17:32:73:33:E8:35:42:FA:35:41`
   - This matches the content of `mobile/upload_cert.pem`.
   - **Conclusion**: `mobile/upload_cert.pem` is the correct public certificate for the upload key expected by Google Play.

2. **Current Configured Keystore**: `mobile/new_upload_key.jks`
   - Fingerprint (SHA1): `5E:39:70:25:1F:E0:CE:58:51:98:FC:E8:97:45:BF:6D:FD:E6:6E:0E`
   - This matches `mobile/google_upload_cert.pem`.
   - **Conclusion**: This is a **new** key, likely generated for a key reset request. It does **not** match the current expected key.

3. **Candidate Keystore**: `mobile/production.jks`
   - This file exists but could not be opened with the password `Chiko123!` or `android`.
   - **Hypothesis**: This file likely contains the private key for `36:58...` (the expected key), assuming it is the original keystore.

## Action Items
To resolve the "incorrect certificate" error, you must sign the APK with the key that matches `36:58...`.

### Option A: Use existing key (Faster)
If `mobile/production.jks` is the original keystore:
- We need the correct password for `mobile/production.jks`.
- Once unlocked, we can configure `keystore.properties` to use it.

### Option B: Reset Upload Key (Slower)
If the original key/password is lost:
- You must contact Google Play Support to reset the upload key.
- You should provide `mobile/google_upload_cert.pem` (which matches `new_upload_key.jks`) to Google during this process.
- After Google processes the request (usually 48 hours), you can use `new_upload_key.jks` to sign and upload.

### Question for you
- Do you know the password for `mobile/production.jks`?
- Or, have you already requested a key reset from Google using `google_upload_cert.pem`? If so, when?
