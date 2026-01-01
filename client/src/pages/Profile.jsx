import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { getUserProfile, updateUserProfile } from "../services/profileApi";
import Loader from "../components/Loader";
import { toast } from "react-hot-toast";

export default function Profile() {
  const user = auth.currentUser;

  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile(user.uid);
        setProfile(data);
      } catch (err) {
        toast.error(err.message);
      }
    };

    loadProfile();
  }, [user.uid]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleEmergencyChange = (e) => {
    setProfile({
      ...profile,
      emergency_contact: {
        ...profile.emergency_contact,
        [e.target.name]: e.target.value,
      },
    });
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        condition: profile.condition,
        medications: profile.medications,
        severity: profile.severity,
        emergency_contact: profile.emergency_contact,
        home_city: profile.home_city,
      });

      toast.success("Profile updated successfully");
      setEdit(false);
    } catch (err) {
      toast.error("Failed to update profile");
      console.log(err);
    }
    setLoading(false);
  };

  if (!profile) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-teal-700">My Profile</h1>
        <p className="text-sm text-gray-600">
          View and manage your personal health information
        </p>
      </div>

      {/* Glass Card */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl border border-white/40 p-8 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Name
          </label>
          <input
            value={profile.name}
            disabled
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-100"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <input
            value={profile.email}
            disabled
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-100"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Medical Condition
          </label>
          <input
            name="condition"
            value={profile.condition}
            onChange={handleChange}
            disabled={!edit}
            className={`w-full rounded-xl border px-4 py-2.5 ${
              edit
                ? "border-gray-200 focus:ring-2 focus:ring-teal-400"
                : "bg-gray-100 border-gray-200"
            }`}
          />
        </div>

        {/* Medications */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Medications
          </label>
          <input
            name="medications"
            value={profile.medications}
            onChange={handleChange}
            disabled={!edit}
            className={`w-full rounded-xl border px-4 py-2.5 ${
              edit
                ? "border-gray-200 focus:ring-2 focus:ring-teal-400"
                : "bg-gray-100 border-gray-200"
            }`}
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Severity
          </label>
          <select
            name="severity"
            value={profile.severity}
            onChange={handleChange}
            disabled={!edit}
            className={`w-full rounded-xl border px-4 py-2.5 ${
              edit
                ? "border-gray-200 focus:ring-2 focus:ring-teal-400"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <option>Mild</option>
            <option>Moderate</option>
            <option>Severe</option>
          </select>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Emergency Contact Name
            </label>
            <input
              name="name"
              value={profile.emergency_contact?.name || ""}
              onChange={handleEmergencyChange}
              disabled={!edit}
              className={`w-full rounded-xl border px-4 py-2.5 ${
                edit ? "border-gray-200" : "bg-gray-100 border-gray-200"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Emergency Contact Phone
            </label>
            <input
              name="phone"
              value={profile.emergency_contact?.phone || ""}
              onChange={handleEmergencyChange}
              disabled={!edit}
              className={`w-full rounded-xl border px-4 py-2.5 ${
                edit ? "border-gray-200" : "bg-gray-100 border-gray-200"
              }`}
            />
          </div>
        </div>

        {/* Home City */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Home City
          </label>
          <input
            name="home_city"
            value={profile.home_city}
            onChange={handleChange}
            disabled={!edit}
            className={`w-full rounded-xl border px-4 py-2.5 ${
              edit
                ? "border-gray-200 focus:ring-2 focus:ring-teal-400"
                : "bg-gray-100 border-gray-200"
            }`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          {!edit && (
            <button
              onClick={() => setEdit(true)}
              className="rounded-full bg-linear-to-r from-teal-500 to-cyan-500 text-white px-6 py-2.5 font-semibold shadow-md hover:opacity-90 transition"
            >
              Edit Profile
            </button>
          )}

          {edit && (
            <>
              <button
                onClick={saveProfile}
                disabled={loading}
                className="rounded-full bg-linear-to-r from-teal-500 to-cyan-500 text-white px-6 py-2.5 font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>

              <button
                onClick={() => setEdit(false)}
                className="rounded-full bg-gray-200 px-6 py-2.5 font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}