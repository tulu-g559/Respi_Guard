import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const checkUserProfile = async (uid) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  return snap.exists();
};
