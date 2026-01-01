import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* =========================
     EMAIL + PASSWORD REGISTER
     ========================= */
  const registerEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Creating account...");

    try {
      // 1. Create user
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Set display name (🔥 FIX)
      await updateProfile(res.user, {
        displayName: name,
      });

      // 3. Save user profile in Firestore
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        name,
        email: res.user.email,
        provider: "password",
        createdAt: serverTimestamp(),
      });

      // 4. Send email verification
      await sendEmailVerification(res.user);

      toast.success("Verification email sent. Please verify and login.", {
        id: toastId,
      });

      navigate("/login");
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     GOOGLE REGISTER
     ========================= */
  const registerGoogle = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      // Check if user already exists in Firestore
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email,
          provider: "google",
          createdAt: serverTimestamp(),
        });
      }

      navigate(snap.exists() ? "/" : "/onboarding");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Glass Card */}
      <div className="w-full max-w-md rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl border border-white/40 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-700">Create Account</h2>
          <p className="text-sm text-gray-600 mt-1">
            Start your personalized health journey
          </p>
        </div>

        {/* Google Signup */}
        <button
          onClick={registerGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2
                     rounded-full border border-gray-200 py-2.5
                     text-sm font-medium hover:bg-gray-100 transition
                     disabled:opacity-50"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
            alt="Google"
          />
          Continue with Google
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-3 text-xs text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Email Signup */}
        <form onSubmit={registerEmail} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5
                       focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5
                       focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5
                       focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <button
            disabled={loading || !name || !email || !password}
            className="w-full rounded-full bg-linear-to-r
                       from-teal-500 to-cyan-500 text-white py-2.5
                       font-semibold shadow-md hover:opacity-90
                       transition disabled:opacity-50"
          >
            {loading ? <Spinner /> : "Register"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}