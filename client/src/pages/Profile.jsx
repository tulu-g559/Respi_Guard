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
    if (user) loadProfile();
  }, [user]);

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

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "US";

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 relative"
      style={{
        backgroundImage: "url('/aero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* soft overlay */}
      <div className="absolute inset-0 bg-white/35" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Patient Profile
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your health data and emergency settings.
            </p>
          </div>

          {!edit ? (
            <button
              onClick={() => setEdit(true)}
              className="flex items-center gap-2 bg-white/85 border border-white/40 
                         text-slate-700 hover:bg-white px-5 py-2.5 rounded-xl 
                         font-semibold shadow-sm transition-all"
            >
              Edit Details
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setEdit(false)}
                className="px-5 py-2.5 text-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 
                           rounded-xl font-semibold shadow-md transition-all 
                           disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white/85 rounded-2xl shadow-sm border border-teal-700/50 p-6 flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-full bg-teal-100 text-teal-700 
                              flex items-center justify-center text-3xl font-bold 
                              mb-4 border-4 border-white shadow-lg"
              >
                {getInitials(profile.name)}
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {profile.name}
              </h2>
              <p className="text-slate-600 text-sm mb-6">{profile.email}</p>

              <div className="w-full border-t border-slate-100 pt-6 text-left space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Home City
                  </label>
                  {edit ? (
                    <input
                      name="home_city"
                      value={profile.home_city}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 bg-slate-100/80 
                                 border border-slate-300 rounded-lg outline-none
                                 focus:ring-2 focus:ring-teal-500/30"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium mt-1">
                      {profile.home_city || "Not set"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Medical Info */}
            <div className="bg-white/85 rounded-2xl shadow-sm border border-teal-700/50 p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-6">
                Medical Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Primary Condition
                  </label>
                  <input
                    name="condition"
                    value={profile.condition}
                    onChange={handleChange}
                    disabled={!edit}
                    className={`w-full rounded-xl px-4 py-3 transition-all outline-none ${
                      edit
                        ? "bg-white border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                        : "bg-slate-100/80 border border-transparent"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Severity Level
                  </label>
                  <select
                    name="severity"
                    value={profile.severity}
                    onChange={handleChange}
                    disabled={!edit}
                    className={`w-full rounded-xl px-4 py-3 appearance-none transition-all outline-none ${
                      edit
                        ? "bg-white border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                        : "bg-slate-100/80 border border-transparent"
                    }`}
                  >
                    <option>Mild</option>
                    <option>Moderate</option>
                    <option>Severe</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Medications
                  </label>
                  <textarea
                    name="medications"
                    value={profile.medications}
                    onChange={handleChange}
                    disabled={!edit}
                    rows={3}
                    className={`w-full rounded-xl px-4 py-3 resize-none transition-all outline-none ${
                      edit
                        ? "bg-white border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                        : "bg-slate-100/80 border border-transparent"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white/85 rounded-2xl shadow-sm border border-teal-700/50 p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-6">
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  name="name"
                  value={profile.emergency_contact?.name || ""}
                  onChange={handleEmergencyChange}
                  disabled={!edit}
                  className="rounded-xl px-4 py-3 bg-slate-100/80 
                             border border-slate-300 outline-none
                             focus:ring-2 focus:ring-rose-500/30"
                />

                <input
                  name="phone"
                  value={profile.emergency_contact?.phone || ""}
                  onChange={handleEmergencyChange}
                  disabled={!edit}
                  className="rounded-xl px-4 py-3 bg-slate-100/80 
                             border border-slate-300 outline-none
                             focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
