import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Điền các giá trị từ Firebase Console → Project settings → General
const firebaseConfig = {
  apiKey: 'AIzaSyBB6xTwpqkfeBVQvo7bIzcP6CkhiJsUGww',
  authDomain:  'authentication-bank.firebaseapp.com',
  projectId:  'authentication-bank',
  appId: '1:600086651355:web:16d25a7a76c385aa1f47fe',
};

const app = initializeApp(firebaseConfig);
// Debug an toàn: chỉ log trạng thái có/không, không in giá trị
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
  // eslint-disable-next-line no-console
  console.error('[Firebase Config] Missing keys:', {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    appId: !!firebaseConfig.appId,
  });
}
export const firebaseAuth = getAuth(app);


