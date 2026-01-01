export default function ChatBubble({ sender, text }) {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-lg shadow-sm text-sm leading-relaxed
        ${
          isUser
            ? "bg-teal-600 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
