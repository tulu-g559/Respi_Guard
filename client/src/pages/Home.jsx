import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { auth } from "../services/firebase";
import { saveSOS } from "../utils/sosStorage";
import { sendSOSAlert } from "../services/api";
import { Wind, Activity, ShieldCheck, ChevronRight, AlertCircle } from "lucide-react";
import Footer from "../components/Footer";


export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sosLoading, setSosLoading] = useState(false);

  const handleSOS = () => {
    if (!user) return;

    setSosLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await sendSOSAlert({
            uid: auth.currentUser.uid,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });

          saveSOS(data);
          navigate("/sos");
        } catch (err) {
          console.error(err);
          setSosLoading(false);
          alert("Failed to activate SOS. Please try again.");
        }
      },
      () => {
        setSosLoading(false);
        alert("Location permission is required for SOS");
      }
    );
  };

  return (
    // CHANGED: Replaced 'font-sans' with "font-['Poppins']" to force the font
    <div className="min-h-screen relative overflow-hidden font-['Poppins'] text-slate-800">
      
      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12 text-center lg:pt-15">
        
        {/* --- HERO SECTION --- */}
        <div className="animate-fade-in-up mb-16">
            {/* Glass Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-sm font-semibold text-teal-900 tracking-wide">
                  Care that Adapts to YOU
                </span>
            </div>

            {/* Crystal Typography */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-sm">
                {/* Applied Rubik Puddles here */}
                <span className="text-transparent bg-clip-text bg-linear-to-br from-teal-900 to-teal-600 font-['Rubik_Glitch'] font-normal">
                    Breathe Smarter
                </span>
                <br />
                {/* "with Respi-Guard" stays in Poppins (inherited from h1 or default) */}
                <span className="text-slate-700/80 drop-shadow-md font-['Michroma']">with <span> _ </span> RespiGuard</span>
            </h1>

            <p className="text-base md:text-lg text-slate-700 font-medium max-w-2xl mx-auto leading-relaxed mb-10 text-shadow-sm">
              Your personalized respiratory health assistant combining
              <span className="font-bold text-teal-800"> real-time air quality </span>
              with <span className="font-bold text-teal-800">AI-driven medical guidance</span>.
            </p>

            {/* --- ACTION BUTTONS (Aero Style) --- */}
            <div className="flex justify-center gap-5 flex-wrap">
            {!user && (
                <Link
                to="/login"
                className="group relative px-8 py-4 bg-linear-to-b from-teal-400 to-teal-600 text-white rounded-2xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 transition-all duration-300 font-bold text-lg flex items-center gap-2 border-t border-white/30"
                >
                Get Started
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            )}

            {user && (
                <>
                <Link
                    to="/dashboard"
                    className="group px-8 py-4 bg-linear-to-b from-teal-500 to-teal-700 text-white rounded-2xl shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 transition-all duration-300 font-bold text-lg flex items-center gap-2 border-t border-white/30"
                >
                    Go to Dashboard
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                    to="/chat"
                    className="px-8 py-4 bg-white/50 backdrop-blur-lg border border-white/60 text-teal-900 rounded-2xl shadow-lg hover:bg-white/80 hover:scale-105 transition-all duration-300 font-bold text-lg flex items-center gap-2"
                >
                    Ask Respo
                </Link>
                </>
            )}
            </div>
        </div>

        {/* --- MODULAR GLASS CARDS --- */}
        <div className="grid md:grid-cols-3 gap-6 text-left relative z-10">
          
          {/* Card 1 */}
          <div className="group bg-white/30 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 hover:bg-white/50 hover:-translate-y-2 transition-all duration-300">
            <div className="bg-linear-to-br from-teal-100 to-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-teal-600 shadow-inner group-hover:scale-110 transition-transform">
              <Wind size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Live AQI Monitoring</h3>
            <p className="text-slate-500 font-light leading-relaxed">
              Get hyper-local, real-time air quality updates instantly based on your GPS location.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white/30 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 hover:bg-white/50 hover:-translate-y-2 transition-all duration-300">
             <div className="bg-linear-to-br from-blue-100 to-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
              <Activity size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Medical Twin</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              A digital profile that adapts advice tailored specifically to your respiratory conditions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white/30 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 hover:bg-white/50 hover:-translate-y-2 transition-all duration-300">
             <div className="bg-linear-to-br from-emerald-100 to-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">AI Health Advisory</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Evidence-based recommendations powered by global medical guidelines and AI.
            </p>
          </div>

        </div>
      </div>

      {/* --- CRYSTAL SOS BUTTON --- */}
      {user && (
        <button
          onClick={handleSOS}
          disabled={sosLoading}
          className={`fixed bottom-8 right-8 z-50 flex items-center justify-center w-20 h-20 rounded-full shadow-[0_0_40px_rgba(239,68,68,0.6)] border-4 border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95
            ${
              sosLoading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-linear-to-br from-red-500 to-red-700 animate-pulse-slow hover:shadow-[0_0_60px_rgba(239,68,68,0.8)]"
            }`}
        >
          {sosLoading ? (
             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <div className="flex flex-col items-center">
                <AlertCircle size={32} className="text-white drop-shadow-md" />
                <span className="text-[10px] font-bold text-white tracking-widest mt-1">SOS</span>
             </div>
          )}
        </button>
      )}
      <Footer />
    </div>
  );
}