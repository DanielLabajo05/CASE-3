// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBU70lMsYeedd6JyXzlJ2eEpddZx4sIf-g",
  authDomain: "filipinoemigrantsdb-labajo.firebaseapp.com",
  projectId: "filipinoemigrantsdb-labajo",
  storageBucket: "filipinoemigrantsdb-labajo.firebasestorage.app",
  messagingSenderId: "1055736882629",
  appId: "1:1055736882629:web:2f8bed718250343a8397ac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;