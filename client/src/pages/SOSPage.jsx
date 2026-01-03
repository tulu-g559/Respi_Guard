import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom"; // Assuming you use react-router
import { getSOS, clearSOS } from "../utils/sosStorage";

export default function SOSPage() {
  const sos = getSOS();
  const utteranceRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);

  // Block back navigation during SOS
  useEffect(() => {
    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockBack);

    return () => {
      window.removeEventListener("popstate", blockBack);
    };
  }, []);

  // Voice guidance
  useEffect(() => {
    if (!sos?.active || !sos?.data?.voice_text) return;

    const utterance = new SpeechSynthesisUtterance(sos.data.voice_text);
    utterance.rate = 0.9;
    utterance.lang = "en-US";

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);

    utteranceRef.current = utterance;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);

    return () => speechSynthesis.cancel();
  }, [sos]);

  if (!sos?.active) return null;

  const replayVoice = () => {
    if (!utteranceRef.current) return;
    speechSynthesis.cancel();
    speechSynthesis.speak(utteranceRef.current);
  };

  const handleEndSOS = () => {
    speechSynthesis.cancel();
    clearSOS();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-red-50 text-gray-900 flex flex-col relative overflow-hidden font-sans">
      {/* Background Pulse Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-200/30 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Top Bar: Status */}
      <div className="relative z-10 w-full bg-red-600 text-white px-6 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="font-bold tracking-wider text-sm uppercase">
            SOS Active
          </span>
        </div>
        <div className="text-xs font-medium opacity-90">Emergency Mode</div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col px-6 py-8 max-w-lg mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-red-600 mb-6 border border-red-100">
            {/* Medical/Alert Icon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10"
            >
              <path
                fillRule="evenodd"
                d="M11.484 2.17a.75.75 0 011.032 0 11.209 11.209 0 007.877 3.08.75.75 0 01.75.75V12a11.386 11.386 0 01-3.533 8.161A44.817 44.817 0 0112 22.5a44.816 44.816 0 01-5.612-2.339A11.386 11.386 0 012.857 12V6a.75.75 0 01.75-.75 11.209 11.209 0 007.877-3.08zM12 9.75a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V10.5a.75.75 0 00-.75-.75H12zM12 12.75a.75.75 0 00-.75.75v2.25a.75.75 0 00.75.75h.008a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H12z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Safety Instructions
          </h1>
          <p className="mt-2 text-gray-600 text-base">
            Please remain calm and follow the voice guide.
          </p>
        </div>

        {/* Dynamic Card */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col relative">
          {/* Audio Visualizer / Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {speaking ? (
                // Simple CSS Audio Bars Animation
                <div className="flex items-end gap-1 h-5">
                  <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite] h-3"></div>
                  <div className="w-1 bg-red-500 rounded-full animate-[bounce_1.2s_infinite] h-5"></div>
                  <div className="w-1 bg-red-500 rounded-full animate-[bounce_0.8s_infinite] h-2"></div>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-gray-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.953 1.042a.75.75 0 01.528 1.28L13.75 9.062h-3.5v-3.5l6.732-6.733a.75.75 0 011.28.528v1.685zM5.5 5.5a3 3 0 00-3 3v7a3 3 0 003 3h7a3 3 0 003-3v-7a3 3 0 00-3-3h-7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <span
                className={`text-sm font-semibold ${
                  speaking ? "text-red-600" : "text-gray-500"
                }`}
              >
                {speaking ? "Speaking..." : "Voice Paused"}
              </span>
            </div>

            <button
              onClick={replayVoice}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Replay
            </button>
          </div>

          {/* Text Content */}
          <div className="p-6 overflow-y-auto max-h-[40vh]">
            <p className="text-xl leading-relaxed font-medium text-gray-800 whitespace-pre-wrap">
              {sos.data.voice_text}
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-8">
          <button
            onClick={handleEndSOS}
            className="group w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-gray-300 bg-transparent text-gray-600 font-bold text-lg hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all active:scale-[0.98]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-gray-400 group-hover:text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            End Emergency Mode
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Only exit if you are in a safe location.
          </p>
        </div>
      </div>
    </div>
  );
}
