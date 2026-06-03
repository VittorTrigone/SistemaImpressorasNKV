import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAH2Vm2Or_V07AL4MvtPGFVKp6VFfpkW8",
  authDomain: "sistemasimpressorasnkv.firebaseapp.com",
  projectId: "sistemasimpressorasnkv",
  storageBucket: "sistemasimpressorasnkv.firebasestorage.app",
  messagingSenderId: "1070278535635",
  appId: "1:1070278535635:web:c110b677d2b3ab1c712726",
  measurementId: "G-7LCMEBJG21"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
