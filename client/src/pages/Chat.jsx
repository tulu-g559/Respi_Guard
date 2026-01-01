import { useState, useEffect, useRef } from "react";
import { askDoctor } from "../services/api";
import { auth } from "../services/firebase";
import ReactMarkdown from "react-markdown";
import { User, Sparkles, Loader2, ArrowUp, Stethoscope, Mic, MicOff } from "lucide-react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // --- PERSISTENCE LOGIC START ---
  
  // 1. Load messages from LocalStorage when component mounts or user changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const storageKey = `respi_chat_${user.uid}`;
        const savedMessages = localStorage.getItem(storageKey);
        if (savedMessages) {
          try {
            setMessages(JSON.parse(savedMessages));
          } catch (error) {
            console.error("Error parsing chat history:", error);
          }
        }
      } else {
        setMessages([]); // Clear messages if logged out
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Save messages to LocalStorage whenever they change
  useEffect(() => {
    if (auth.currentUser && messages.length > 0) {
      const storageKey = `respi_chat_${auth.currentUser.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages]);

  // --- PERSISTENCE LOGIC END ---

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- ROBUST VOICE INPUT LOGIC ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("⚠️ Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false; 
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript); 
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert("Microphone access blocked. Please allow permissions in your browser settings.");
      } else if (event.error === 'no-speech') {
        alert("No speech detected. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };
  // -------------------------

  const send = async (manualQuery = null) => {
    const textToSend = manualQuery || query;
    if (!textToSend.trim() || loading) return;

    // 1. Add User Message
    const userMsg = { s: "user", t: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      // 2. Call API
      const res = await askDoctor({
        uid: auth.currentUser.uid,
        query: textToSend,
      });

      // 3. Add Bot Response
      setMessages((prev) => [...prev, { s: "bot", t: res.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          s: "bot",
          t: "⚠️ I'm having trouble connecting to the medical database right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Can I go for a run right now?",
    "Is the air safe for my asthma?",
    "What precautions should I take?",
    "Show me my current risk level."
  ];

  return (
    <div className="h-screen pt-24 pb-6 px-4 md:px-6 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* === MAIN CHAT CONTAINER === */}
      <div className="flex-1 w-full max-w-5xl mx-auto bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* --- HEADER --- */}
        <div className="bg-white/40 backdrop-blur-md border-b border-white/50 px-6 py-4 flex items-center gap-4 shadow-sm z-10">
          <div className="bg-teal-100 p-2 rounded-xl text-teal-700 shadow-inner">
             <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Dr. Respo</h1>
            <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               Online • AI Medical Twin Active
            </p>
          </div>
        </div>

        {/* --- MESSAGES AREA --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
              <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center shadow-lg animate-float p-4">
                 <img src="/Wlogo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">How can I help your lungs today?</h2>
                 <p className="text-slate-600 max-w-md mx-auto">
                   I have access to your medical profile and live air quality data.
                 </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                 {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => send(s)}
                      className="px-4 py-3 bg-white/60 hover:bg-white/90 border border-white/60 rounded-xl text-sm font-medium text-slate-700 shadow-sm transition-all hover:scale-[1.02] text-left flex items-center gap-2 group"
                    >
                      <Sparkles size={14} className="text-teal-500 group-hover:rotate-12 transition-transform" />
                      {s}
                    </button>
                 ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
             <div key={i} className={`flex gap-4 ${m.s === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md overflow-hidden ${
                   m.s === "user" ? "bg-slate-700 text-white" : "bg-white p-1"
                }`}>
                   {m.s === "user" ? <User size={20} /> : <img src="/Wlogo.png" alt="Bot" className="w-full h-full object-contain" />}
                </div>
                
                <div className={`relative px-5 py-3.5 max-w-[85%] md:max-w-[70%] rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                   m.s === "user" 
                     ? "bg-slate-800 text-white rounded-tr-none" 
                     : "bg-white/80 backdrop-blur-md text-slate-800 border border-white/60 rounded-tl-none"
                }`}>
                   {m.s === "user" ? (
                      m.t
                   ) : (
                      <div className="w-full min-w-0">
                        <ReactMarkdown 
                          components={{
                            p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-teal-800" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 space-y-1 marker:text-teal-600" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 space-y-1 marker:text-teal-600" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />
                          }}
                        >
                          {m.t}
                        </ReactMarkdown>
                      </div>
                   )}
                </div>
             </div>
          ))}

          {loading && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-md">
                   <img src="/Wlogo.png" alt="Bot" className="w-full h-full object-contain" />
                </div>
                <div className="bg-white/60 backdrop-blur-md px-5 py-4 rounded-2xl rounded-tl-none border border-white/60 shadow-sm flex items-center gap-2">
                   <Loader2 size={16} className="animate-spin text-teal-600" />
                   <span className="text-sm font-medium text-slate-600">Analyzing clinical guidelines...</span>
                </div>
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* --- INPUT AREA --- */}
        <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/50">
           <div className="relative flex items-center max-w-4xl mx-auto">
              
              {/* VOICE BUTTON */}
              <button
                onClick={startListening}
                className={`absolute left-2 p-2 rounded-xl transition-all z-20 ${
                  isListening 
                    ? "bg-red-500 text-white animate-pulse shadow-md" 
                    : "text-slate-500 hover:text-teal-600 hover:bg-white"
                }`}
                title="Speak to type"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={isListening ? "Listening... (Speak now)" : "Type your health question here..."}
                disabled={loading}
                className="w-full bg-white/70 backdrop-blur-sm border border-white/50 text-slate-800 placeholder:text-slate-400 rounded-2xl pl-12 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-inner transition-all"
              />
              
              <button
                onClick={() => send()}
                disabled={loading || !query.trim()}
                className={`absolute right-2 p-2.5 rounded-xl transition-all duration-300 z-20 ${
                   !query.trim() || loading 
                     ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                     : "bg-teal-600 text-white shadow-lg shadow-teal-500/30 hover:bg-teal-700 hover:scale-105"
                }`}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} strokeWidth={3} />}
              </button>
           </div>
           
           <p className="text-center text-[10px] text-slate-500 mt-2 font-medium">
              Through I am a medical RAG; AI can make mistakes. Always consult a real doctor for emergencies.
           </p>
        </div>

      </div>
    </div>
  );
}