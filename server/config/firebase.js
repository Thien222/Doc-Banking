const admin = require('firebase-admin');
let initialized = false;

try {
  if (!admin.apps.length) {
    const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceJson) {
      const creds = JSON.parse(serviceJson);
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    } else {
      // Fallback order: config/firebase-service-account.json → root service account json
      try {
        const serviceAccount = require('./firebase-service-account.json');
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } catch (e1) {
        // Try reading a JSON file placed at server root (e.g. authentication-bank-firebase-adminsdk-*.json)
        const path = require('path');
        const fs = require('fs');
        const serverRoot = path.join(__dirname, '..');
        const files = fs.readdirSync(serverRoot).filter(f => f.endsWith('.json'));
        const candidate = files.find(f => f.includes('firebase-adminsdk')) || files[0];
        if (!candidate) throw e1;
        const raw = fs.readFileSync(path.join(serverRoot, candidate), 'utf8');
        const creds = JSON.parse(raw);
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      }
    }
    initialized = true;
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Failed to init Firebase Admin:', e.message);
}

module.exports = admin;


