import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../hooks/useAuth";


export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
    setOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3 bg-white/10 backdrop-blur-md border-b border-white/30 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/Wlogo.png" className="h-8 w-auto group-hover:scale-105 transition-transform" />
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-teal-800 to-teal-600 tracking-tight">
            RespiGuard
          </h1>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-3">
          <NavLink to="/" isActive={isActive("/")}>Home</NavLink>

          {/* 🟢 GUEST: Show Login Button */}
          {!user && (
            <Link
              to="/login"
              className="ml-2 px-5 py-2 rounded-full bg-teal-600 text-white font-semibold shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Login / Signup
            </Link>
          )}

          {/* 🔵 USER: Show Dashboard & Profile */}
          {user && (
            <>
              <NavLink to="/dashboard" isActive={isActive("/dashboard")}>Dashboard</NavLink>
              <NavLink to="/chat" isActive={isActive("/chat")}>Chat</NavLink>
              <NavLink to="/profile" isActive={isActive("/profile")}>Profile</NavLink>

              <button
                onClick={logout}
                className="ml-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-700 font-semibold border border-red-200/50 hover:bg-red-500/20 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* HAMBURGER (Mobile Only) */}
        <button
          className="md:hidden text-slate-700 p-1 rounded-md hover:bg-white/20 transition"
          onClick={() => setOpen(!open)}
        >
          {open ? (
             <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M6 18L18 6M6 6l12 12" />
             </svg>
          ) : (
             <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M4 8h16M4 16h16" />
             </svg>
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden mt-3 mx-2 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-xl p-4 space-y-2 animate-fade-in-up">
          <MobileLink to="/" onClick={() => setOpen(false)}>Home</MobileLink>

          {/* 🟢 GUEST MOBILE */}
          {!user && (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block w-full text-center px-4 py-3 mt-2 rounded-xl bg-teal-600 text-white font-bold shadow-md active:scale-95 transition-all"
            >
              Login / Signup
            </Link>
          )}

          {/* 🔵 USER MOBILE */}
          {user && (
            <>
              <MobileLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
              <MobileLink to="/chat" onClick={() => setOpen(false)}>Chat</MobileLink>
              <MobileLink to="/profile" onClick={() => setOpen(false)}>Profile</MobileLink>

              <div className="pt-2 border-t border-slate-200/30">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 rounded-lg bg-red-500/10 text-red-700 font-semibold border border-red-200/50 hover:bg-red-500/20"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}


// Helper Component for mobile links
function MobileLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-3 rounded-xl font-semibold text-slate-700 hover:bg-white/50 hover:text-teal-800 transition-colors"
    >
      {children}
    </Link>
  );
}

// Helper Component for consistent link styling
function NavLink({ to, children, isActive }) {
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300
        ${
          isActive
            ? "bg-white/60 text-teal-800 shadow-sm backdrop-blur-md"
            : "text-slate-600 hover:text-teal-700 hover:bg-white/30"
        }
      `}
    >
      {children}
    </Link>
  );
}