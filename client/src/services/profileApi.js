import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const getUserProfile = async (uid) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Profile not found");
  }

  return snap.data();
};

export const updateUserProfile = async (uid, payload) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, payload);
};