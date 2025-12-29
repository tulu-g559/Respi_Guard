export default function ChatBubble({ sender, text, sources }) {
  const isUser = sender === "user";

  return (
    <div className={`my-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isUser ? "bg-teal-600 text-white" : "bg-slate-100 text-gray-800"
        }`}
      >
        <p>{text}</p>

        {!isUser && sources && (
          <div className="mt-2 text-xs text-gray-500">
            Sources:
            <ul className="list-disc ml-4">
              {sources.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
