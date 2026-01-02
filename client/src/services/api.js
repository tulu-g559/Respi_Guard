import axios from "axios";

// 1. You defined this:
// const BASE_URL = "http://localhost:5000/api";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getAdvisory = async (payload) => {
  // 2. ERROR WAS HERE: You used ${API_BASE} instead of ${BASE_URL}
  const res = await axios.post(`${BASE_URL}/get-advisory`, payload);
  return res.data;
};

export const askDoctor = async (payload) => {
  const res = await axios.post(`${BASE_URL}/ask-doctor`, payload);
  return res.data;
};

export const saveUserProfile = async (payload) => {
  const res = await axios.post(`${BASE_URL}/users/profile`, payload);
  return res.data;
};

export const sendSOSAlert = async (payload) => {
  const res = await axios.post(`${BASE_URL}/sos-alert`, payload);
  return res.data;
};