// src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const initFirebase = async ({ config, token, onAuth }) => {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      onAuth({ user, db });
    } else {
      try {
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Error en autenticación:', e);
        await signInAnonymously(auth);
      }
    }
  });
};
