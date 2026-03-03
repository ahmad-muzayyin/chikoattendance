const fs = require('fs');
const crypto = require('crypto');

const certPem = fs.readFileSync('mobile/upload_cert.pem', 'utf8');
const certBody = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '');

const certDer = Buffer.from(certBody, 'base64');

const sha1 = crypto.createHash('sha1').update(certDer).digest('hex').toUpperCase().match(/.{1,2}/g).join(':');
const sha256 = crypto.createHash('sha256').update(certDer).digest('hex').toUpperCase().match(/.{1,2}/g).join(':');

fs.writeFileSync('fingerprints_output.txt', `SHA1:\n${sha1}\n\nSHA256:\n${sha256}`);
console.log('Done writing fingerprints_output.txt');
