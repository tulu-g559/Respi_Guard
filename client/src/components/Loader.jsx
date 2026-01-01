export default function Loader({ text }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
      
      {/* Uiverse Animation */}
      <div className="flex flex-row gap-2 mb-4">
        <div className="w-4 h-4 rounded-full bg-teal-600 animate-bounce"></div>
        <div className="w-4 h-4 rounded-full bg-teal-600 animate-bounce [animation-delay:-.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-teal-600 animate-bounce [animation-delay:-.5s]"></div>
      </div>

      {/* Loading Text */}
      {text && (
        <div className="text-teal-800 font-bold tracking-wide animate-pulse">
          {text}
        </div>
      )}
    </div>
  );
}