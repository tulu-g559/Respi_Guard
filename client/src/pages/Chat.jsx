import { useState } from "react";
import { auth } from "../services/firebase";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");

  const askDoctor = async () => {
    const res = await fetch("http://localhost:5000/api/ask-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: auth.currentUser.uid,
        query,
      }),
    });

    const data = await res.json();
    setMessages([...messages, { q: query, a: data.answer }]);
    setQuery("");
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {messages.map((m, i) => (
        <div key={i}>
          <p className="font-semibold">You: {m.q}</p>
          <p className="bg-slate-100 p-2 rounded">AI: {m.a}</p>
        </div>
      ))}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border w-full p-2 mt-4"
      />
      <button
        onClick={askDoctor}
        className="bg-teal-600 text-white px-4 py-2 mt-2"
      >
        Ask
      </button>
    </div>
  );
}
