import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-teal-700 mb-4">
          Welcome to Respi-Guard
        </h1>

        <p className="text-gray-600 text-lg mb-8">
          A personalized respiratory health assistant that combines real-time
          air quality data with AI-driven medical guidance.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          {!user && (
            <Link
              to="/login"
              className="bg-teal-600 text-white px-6 py-3 rounded hover:bg-teal-700"
            >
              Login / Signup
            </Link>
          )}

          {user && (
            <>
              <Link
                to="/dashboard"
                className="bg-teal-600 text-white px-6 py-3 rounded hover:bg-teal-700"
              >
                Go to Dashboard
              </Link>

              <Link
                to="/chat"
                className="bg-white border border-teal-600 text-teal-600 px-6 py-3 rounded hover:bg-teal-50"
              >
                Ask Respi-Guard
              </Link>
            </>
          )}
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Live AQI Monitoring</h3>
            <p className="text-sm text-gray-600">
              Get real-time air quality updates based on your location.
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Medical Twin</h3>
            <p className="text-sm text-gray-600">
              Advice tailored to your personal respiratory conditions.
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">AI Health Advisory</h3>
            <p className="text-sm text-gray-600">
              Evidence-based recommendations powered by medical guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
