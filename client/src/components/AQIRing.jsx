export default function AQIRing({ value, color }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-40 h-40 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${value * 2}deg, #e5e7eb 0deg)`,
        }}
      >
        <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{value}</span>
          <span className="text-sm text-gray-500">AQI</span>
        </div>
      </div>
    </div>
  );
}
