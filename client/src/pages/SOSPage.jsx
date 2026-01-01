import { useEffect } from "react";
import { getSOS, clearSOS } from "../utils/sosStorage";

export default function SOSPage() {
  const sos = getSOS();

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

  if (!sos || !sos.active) return null;

  const { status, voice_text } = sos.data;

  return (
    <div className="min-h-screen bg-red-50 flex flex-col p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-700">🚨 SOS ACTIVATED</h1>
        <p className="mt-2 text-gray-700 text-lg">
          Stay calm. Follow the instructions carefully.
        </p>
      </div>

      {/* Status */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow text-center">
        <p className="text-xl font-semibold text-red-600">{status}</p>
        <p className="text-gray-600 mt-1">
          Emergency alert has been sent successfully.
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow flex-1 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          🫁 Emergency Instructions
        </h2>

        <pre className="whitespace-pre-wrap text-xl text-gray-900 leading-relaxed">
          {voice_text}
        </pre>
      </div>

      {/* Footer Action */}
      <div className="mt-6">
        <button
          onClick={() => {
            clearSOS();
            window.location.href = "/";
          }}
          className="w-full border border-red-600 text-red-600 py-3 rounded-lg text-lg font-semibold"
        >
          ❌ End SOS (Only if Safe)
        </button>
      </div>
    </div>
  );
}
