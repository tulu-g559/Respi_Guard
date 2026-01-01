import axios from "axios";

// const API_BASE = "http://localhost:5000/api";
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";


export const getAdvisory = async (payload) => {
  const res = await axios.post(`${API_BASE}/get-advisory`, payload);
  return res.data;
};

export const askDoctor = async (payload) => {
  const res = await axios.post(`${API_BASE}/ask-doctor`, payload);
  return res.data;
};

export const saveUserProfile = async (payload) => {
  const res = await axios.post(`${API_BASE}/users/profile`, payload);
  return res.data;
};

export const sendSOSAlert = async (payload) => {
  const res = await axios.post(`${API_BASE}/sos-alert`, payload);
  return res.data;
}; 