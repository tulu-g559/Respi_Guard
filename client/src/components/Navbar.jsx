import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <h1 className="font-bold text-teal-600">Respi-Guard</h1>

      <div className="flex gap-4">
        <Link to="/dashboard" className="text-gray-600 hover:text-teal-600">
          Dashboard
        </Link>
        <Link to="/chat" className="text-gray-600 hover:text-teal-600">
          Ask Doctor
        </Link>
        {auth.currentUser && (
          <button onClick={logout} className="text-red-500">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
