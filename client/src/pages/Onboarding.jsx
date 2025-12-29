import { useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const CONDITIONS = ["Asthma", "Dust Allergy", "Sinusitis", "None"];

export default function Onboarding() {
  const [conditions, setConditions] = useState([]);
  const [medication, setMedication] = useState("");
  const navigate = useNavigate();

  const saveProfile = async () => {
    await setDoc(doc(db, "medical_profiles", auth.currentUser.uid), {
      conditions,
      medication,
      uid: auth.currentUser.uid,
    });
    navigate("/dashboard");
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Create Your Medical Twin</h2>

      {CONDITIONS.map((c) => (
        <label key={c} className="block">
          <input
            type="checkbox"
            onChange={() =>
              setConditions((prev) =>
                prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
              )
            }
          />{" "}
          {c}
        </label>
      ))}

      <input
        className="border p-2 w-full mt-4"
        placeholder="Current medications"
        onChange={(e) => setMedication(e.target.value)}
      />

      <button
        onClick={saveProfile}
        className="mt-4 bg-teal-600 text-white px-4 py-2 rounded"
      >
        Create My Health Profile
      </button>
    </div>
  );
}
