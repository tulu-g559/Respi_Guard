import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import toast from "react-hot-toast";

export default function Onboarding() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    condition: "",
    medications: "",
    severity: "Moderate",
    emergencyName: "",
    emergencyPhone: "",
    homeCity: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.emergencyPhone) {
      toast.error("Please enter a valid emergency phone number");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || "",
        email: user.email,
        age: Number(formData.age),
        gender: formData.gender,
        condition: formData.condition,
        medications: formData.medications,
        severity: formData.severity,
        emergency_contact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
        },
        home_city: formData.homeCity,
        profileCompleted: true,
        role: "patient",
        created_at: serverTimestamp(),
      });

      toast.success("Profile completed successfully");
      navigate("/");
    } catch (err) {
      toast.error("Failed to save profile");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Glass Card */}
      <div className="w-full max-w-xl rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl border border-white/40 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-700">
            Complete Your Health Profile
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            This information helps us personalize your care
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            name="age"
            placeholder="Age"
            required
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <select
            name="gender"
            required
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <input
            type="text"
            name="condition"
            placeholder="Respiratory Condition (e.g. Asthma)"
            required
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <textarea
            name="medications"
            placeholder="Current Medications"
            rows={3}
            required
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <select
            name="severity"
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option>Mild</option>
            <option>Moderate</option>
            <option>Severe</option>
          </select>

          <input
            type="text"
            name="emergencyName"
            placeholder="Emergency Contact Name"
            required
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* Phone Input */}
          <div className="rounded-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-teal-400">
            <PhoneInput
              international
              defaultCountry="IN"
              value={formData.emergencyPhone}
              onChange={(value) =>
                setFormData({ ...formData, emergencyPhone: value })
              }
              placeholder="Emergency Contact Phone"
            />
          </div>

          <input
            type="text"
            name="homeCity"
            placeholder="Home City (optional)"
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <button
            disabled={loading}
            className="w-full rounded-full bg-linear-to-r from-teal-500 to-cyan-500 text-white py-2.5 font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50 flex justify-center"
          >
            {loading ? <Spinner /> : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}