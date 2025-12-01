import { auth } from '../firebaseConfig';
import { signInAnonymously } from 'firebase/auth';

export const signInUser = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Signed in anonymously:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Error signing in:', error);
    throw error;
  }
};