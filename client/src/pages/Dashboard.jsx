import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { getAdvisory } from "../services/api";
import Loader from "../components/Loader";
import AQIRing from "../components/AQIRing";
import AdvisoryCard from "../components/AdvisoryCard";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const payload = {
        user_id: auth.currentUser.uid,
        location: {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        },
      };
      const res = await getAdvisory(payload);
      setData(res);
    });
  }, []);

  if (!data) return <Loader text="Analyzing medical records..." />;

  return (
    <div className="p-6">
      <AQIRing value={data.aqi} color={data.color_code} />
      <AdvisoryCard advisory={data.advisory} source={data.source} />
    </div>
  );
}
