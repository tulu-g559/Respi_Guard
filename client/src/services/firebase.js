import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiitscZ38LGGCwa9uB_3NeUdRnMgM5VEw",
  authDomain: "campusguard-7fac6.firebaseapp.com",
  projectId: "campusguard-7fac6",
  storageBucket: "campusguard-7fac6.firebasestorage.app",
  messagingSenderId: "967644929216",
  appId: "1:967644929216:web:7276ca87740c341536e125",
  measurementId: "G-5W21P40Z0E"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);