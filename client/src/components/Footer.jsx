import { Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    // "mt-auto" pushes the footer to the bottom if used in a flex-col layout
    <footer className="w-full mt-auto bg-linear-to-b from-white/10 to-white/30 backdrop-blur-md border-t border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-start gap-4">

        {/* TOP: BRANDING (Text) */}
        <div className="flex flex-col md:flex-row items-center gap-2 text-slate-600 font-normal text-sm">
          <span>© 2026 RespiGuard</span>
          <span className="hidden md:inline">•</span>
          <span className="flex items-center gap-1 opacity-80">
            Built for <span className="font-normal text-blue-800">Hack Zenith</span>
          </span>
        </div>

        {/* BOTTOM: ICONS (Moved below text) */}
        <div className="flex items-center gap-4">
          
          {/* GitHub */}
          <a
            href="https://github.com/tulu-g559/Respi_Guard"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-2 transition-all hover:-translate-y-1"
            aria-label="GitHub Repository"
          >
            <div className="absolute inset-0 bg-teal-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            <Github className="w-6 h-6 text-slate-600 group-hover:text-teal-700 transition-colors relative z-10" strokeWidth={1.5} />
          </a>

          {/* Email */}
          <a
            href="mailto:garnab559@gmail.com"
            className="group relative p-2 transition-all hover:-translate-y-1"
            aria-label="Contact Email"
          >
            <div className="absolute inset-0 bg-teal-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            <Mail className="w-6 h-6 text-slate-600 group-hover:text-teal-700 transition-colors relative z-10" strokeWidth={1.5} />
          </a>

        </div>
      </div>
      
      {/* BOTTOM THIN LINE */}
      <div className="w-full h-1 bg-linear-to-r from-transparent via-teal-500/20 to-transparent"></div>
    </footer>
  );
}