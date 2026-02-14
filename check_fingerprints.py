import hashlib
import base64
import re

def get_fingerprint(pem_content):
    body = "".join(line.strip() for line in pem_content.splitlines() if not line.startswith("-----"))
    try:
        der = base64.b64decode(body)
        sha1 = hashlib.sha1(der).hexdigest().upper()
        return ":".join(sha1[i:i+2] for i in range(0, len(sha1), 2))
    except Exception as e:
        return f"Error: {e}"

files = ["mobile/upload_cert.pem", "mobile/google_upload_cert.pem"]

for fpath in files:
    try:
        with open(fpath, "r") as f:
            content = f.read()
            fingerprint = get_fingerprint(content)
            print(f"File: {fpath}")
            print(f"SHA1: {fingerprint}")
    except Exception as e:
        print(f"Could not read {fpath}: {e}")
