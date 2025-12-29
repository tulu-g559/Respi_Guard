export default function AdvisoryCard({ advisory, source }) {
  return (
    <div className="mt-6 bg-white border-l-4 border-teal-500 p-4 rounded shadow">
      <p
        className="text-gray-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: advisory }}
      />

      {source && (
        <span className="inline-block mt-3 text-xs bg-slate-100 px-2 py-1 rounded text-gray-600">
          Source: {source}
        </span>
      )}
    </div>
  );
}
