import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { checkUserProfile } from "../utils/checkUserProfile";
import { doc, getDoc } from "firebase/firestore";
import Spinner from "../components/Spinner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Authenticating...");

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        await signOut(auth);
        toast.error("Email not verified. Verification email resent.", {
          id: toastId,
        });
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      toast.success("Welcome back!", { id: toastId });

      if (snap.exists()) navigate("/");
      else navigate("/onboarding");
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const exists = await checkUserProfile(user.uid);
    navigate(exists ? "/" : "/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Glass Card */}
      <div className="w-full max-w-md rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl border border-white/40 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-700">Welcome Back</h2>
          <p className="text-sm text-gray-600 mt-1">
            Sign in to continue to Respi-Guard
          </p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-100 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-3 text-xs text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Email Login */}
        <form onSubmit={loginEmail} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <button
            disabled={loading || !email || !password}
            className="w-full rounded-full bg-linear-to-r from-teal-500 to-cyan-500 text-white py-2.5 font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? <Spinner /> : "Login"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="flex justify-between mt-5 text-sm">
          <Link to="/forgot-password" className="text-teal-600 hover:underline">
            Forgot password?
          </Link>
          <Link to="/register" className="text-teal-600 hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}