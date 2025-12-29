export const getAdvisory = async (payload) => {
  const res = await fetch("http://localhost:5000/api/get-advisory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
};
