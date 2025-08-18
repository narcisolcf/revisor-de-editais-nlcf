import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Seus valores reais do Firebase substituindo os exemplos.
const firebaseConfig = {
  apiKey: "AIzaSyBzH6WFt7wnRInLih0FuKNoSeE6zKrjJ_U",
  authDomain: "analisador-de-editais.firebaseapp.com",
  projectId: "analisador-de-editais",
  storageBucket: "analisador-de-editais.firebasestorage.app",
  messagingSenderId: "339989657396",
  appId: "1:339989657396:web:0620c29b426c5c8394d761",
};

// Lógica para evitar reinicialização do app (está ótima, pode manter)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Exporta a conexão com o banco de dados Firestore
export const db = getFirestore(app);

// Exporta a autenticação do Firebase
export const auth = getAuth(app);

// Exporta o Firebase Storage
export const storage = getStorage(app);

// Exporta o app do Firebase para outros usos
export default app;