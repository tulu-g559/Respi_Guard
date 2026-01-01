import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          setProfileCompleted(snap.data().profileCompleted === true);
        } else {
          setProfileCompleted(false);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ⏳ Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    toast.error("Please login to continue");
    return <Navigate to="/login" replace />;
  }

  // ❌ Email not verified (Email/Password users only)
  if (!user.emailVerified && user.providerData[0]?.providerId === "password") {
    toast.error("Please verify your email before continuing");
    return <Navigate to="/login" replace />;
  }

  // ❌ Profile not completed → onboarding (ONE TIME)
  if (!profileCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // ✅ Everything OK
  return children;
}
