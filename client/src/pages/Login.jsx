import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth} from "../services/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);

    navigate("/");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Respi-Guard</h1>
        <button
          onClick={loginWithGoogle}
          className="bg-teal-600 text-white px-4 py-2 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
