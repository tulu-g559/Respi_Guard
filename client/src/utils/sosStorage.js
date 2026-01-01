const SOS_KEY = "respi_guard_sos";

export const saveSOS = (data) => {
  localStorage.setItem(
    SOS_KEY,
    JSON.stringify({
      active: true,
      timestamp: Date.now(),
      data,
    })
  );
};

export const getSOS = () => {
  const raw = localStorage.getItem(SOS_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearSOS = () => {
  localStorage.removeItem(SOS_KEY);
};
