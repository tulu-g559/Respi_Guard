import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner"; // ✅ your shared spinner

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading("Sending reset link...");
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
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
          <h2 className="text-2xl font-bold text-teal-700">Reset Password</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter your registered email address
          </p>
        </div>

        {/* Form */}
        <form onSubmit={resetPassword} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <button
            disabled={loading || !email}
            className="w-full rounded-full bg-linear-to-r from-teal-500 to-cyan-500 text-white py-2.5 font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50 flex justify-center"
          >
            {loading ? <Spinner /> : "Send Reset Link"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="text-teal-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
