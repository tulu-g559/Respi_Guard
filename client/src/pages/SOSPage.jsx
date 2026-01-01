import { useEffect, useRef, useState } from "react";
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

  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-rose-100 to-white text-rose-900 flex flex-col px-6 py-10">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-pulse blur-xl" />
          <div className="relative w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center text-3xl shadow-lg text-white">
            🚨
          </div>
        </div>

        <h1 className="text-3xl font-bold text-rose-700">
          Emergency Mode Active
        </h1>

        <p className="mt-2 text-rose-600 text-lg max-w-md">
          Stay calm. Follow the instructions below.
        </p>
      </div>

      {/* Instruction Box */}
      <div className="relative mt-10 flex-1 bg-white/70 backdrop-blur-xl border border-rose-200 rounded-2xl p-6 shadow-xl overflow-y-auto">
        {/* Speaker Icon (Top Right, Icon Only) */}
        {speaking && (
          <div className="absolute top-4 right-4 text-2xl text-rose-500 animate-pulse">
            🔊
          </div>
        )}

        {/* Title + Replay Button (No Collision) */}
        <div className="flex items-start justify-between gap-4 mb-4 pr-10">
          <h2 className="text-xl font-semibold text-rose-700">
            Breathing & Safety Instructions
          </h2>

          <button
            onClick={replayVoice}
            className="shrink-0 text-sm px-3 py-1 rounded-lg border border-rose-400 text-rose-700 hover:bg-rose-100 transition"
          >
            🔁 Replay
          </button>
        </div>

        {/* Instructions */}
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-rose-900">
          {sos.data.voice_text}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8">
        <button
          onClick={() => {
            speechSynthesis.cancel();
            clearSOS();
            window.location.href = "/";
          }}
          className="w-full py-4 rounded-xl border border-rose-400 text-rose-700 font-semibold hover:bg-rose-100 transition"
        >
          End SOS (Only If Safe)
        </button>
      </div>
    </div>
  );
}