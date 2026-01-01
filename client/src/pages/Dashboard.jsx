import { useEffect, useState } from "react";
import { getAdvisory } from "../services/api";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

// Icons
import { Wind, Activity, MapPin, AlertTriangle, CheckCircle, Loader2, Footprints, Home, Dumbbell } from "lucide-react";

// --- HELPERS ---

// Official Indian CPCB Color Scale
const getAQIColorHex = (aqi) => {
  if (aqi <= 50) return "#10B981";   // Green (Good)
  if (aqi <= 100) return "#84CC16";  // Light Green/Lime (Satisfactory)
  if (aqi <= 200) return "#EAB308";  // Yellow (Moderate)
  if (aqi <= 300) return "#F97316";  // Orange (Poor)
  if (aqi <= 400) return "#EF4444";  // Red (Very Poor)
  return "#7F1D1D";                  // Maroon (Severe)
};

const getReactionImage = (aqi) => {
  if (aqi <= 50) return "/man-happy.png"; 
  if (aqi <= 100) return "/man-mask.png";
  if (aqi <= 300) return "/man-mask.png";
  return "/man-panic.png";
};

const getActivityIcon = (key) => {
  const k = key.toLowerCase();
  if (k.includes("outdoor") || k.includes("exercise")) return <Dumbbell size={24} />;
  if (k.includes("walk") || k.includes("commute")) return <Footprints size={24} />;
  if (k.includes("indoor") || k.includes("ventilation")) return <Home size={24} />;
  return <Activity size={24} />;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState({ 
     name: "Locating...", 
     coords: "GPS Initializing" 
  });
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (!auth.currentUser) return navigate("/login");

      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!snap.exists()) {
        navigate("/onboarding", { replace: true });
        return;
      }
      

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          // 1. Set Coordinates immediately
          setLocationInfo(prev => ({ 
             ...prev, 
             coords: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E` 
          }));

          // 2. Fetch Area Name (Reverse Geocoding)
          try {
             const geoRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
             );
             const geoData = await geoRes.json();
             // Priority: City -> Locality -> Principal Subdivision
             const areaName = geoData.city || geoData.locality || geoData.principalSubdivision || "Unknown Area";
             
             setLocationInfo(prev => ({ ...prev, name: areaName }));
          } catch (e) {
             console.error("Geocoding failed", e);
             setLocationInfo(prev => ({ ...prev, name: "Area Unknown" }));
          }

          // 3. Get API Data
          try {
            const res = await getAdvisory({
              uid: auth.currentUser.uid,
              lat: lat,
              lon: lon,
            });
            setData(res);
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
        () => alert("Location access is required")
      );
    };

    init();
  }, [navigate]);

  if (loading) return <FullScreenLoader />;

  const { advisory, aqi } = data;

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 font-sans text-slate-800">
      
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* === HEADER === */}
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="p-3 bg-white/40 backdrop-blur-md rounded-xl shadow-sm border border-white/50">
            <Activity className="text-teal-700" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 drop-shadow-sm">Health Command Center</h1>
            <p className="text-slate-600 font-medium">Live Respiratory Analysis</p>
          </div>
        </div>

        {/* === TOP SECTION: SPEEDOMETER & METRICS === */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* 1. PROFESSIONAL SPEEDOMETER BOX */}
          <div className="relative overflow-hidden rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 shadow-xl p-8 flex flex-col items-center justify-center min-h-80">
            
            {/* Background Texture */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply"
              style={{ backgroundImage: `url('/smoke-texture.png')`, backgroundSize: 'cover' }}
            />

            <div className="relative z-10 w-full flex flex-col items-center">
              {/* UPDATED: Sentence case, slightly larger text */}
              <h2 className="text-base font-bold text-slate-600 mb-8 border-b border-slate-300/50 pb-2 tracking-wide">
                Real-time Monitoring
              </h2>
              
              {/* SIDE-BY-SIDE CONTAINER */}
              <div className="flex flex-row items-center justify-center gap-12 w-full px-4">
                  
                  {/* LEFT: SPEEDOMETER */}
                  <div className="relative transform scale-110">
                     <AQISpeedometer value={aqi.indian_aqi} />
                     
                     {/* Centered Stats inside the Ring */}
                     <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center">
                        <span className="text-5xl font-['Poppins'] text-slate-800 tracking-tighter drop-shadow-sm">
                            {aqi.indian_aqi}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded-full mt-1 shadow-sm">
                            IND AQI
                        </span>
                     </div>
                  </div>

                  {/* RIGHT: REACTION IMAGE (Significantly Bigger) */}
                  <div className="flex flex-col items-center justify-center gap-3">
                     <div className="relative">
                        {/* Optional: Subtle glow behind the character */}
                        <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full"></div>
                        <img 
                          src={getReactionImage(aqi.indian_aqi)} 
                          alt="Reaction" 
                          // UPDATED: Increased size to w-40 h-40
                          className="relative w-40 h-40 object-contain drop-shadow-2xl animate-fade-in-up filter contrast-110 transform hover:scale-105 transition-transform duration-500"
                        />
                     </div>
                     
                     <span className="text-base font-extrabold text-slate-700 tracking-wide bg-white/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/40">
                        {getAQICategoryLabel(aqi.indian_aqi)}
                     </span>
                  </div>

              </div>
            </div>
          </div>

          {/* 2. GLASS METRICS GRID */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard 
               label="PM 2.5 Level" 
               value={aqi.pm2_5} 
               unit="µg/m³" 
               icon={<Wind size={20}/>} 
            />
            <MetricCard 
               label="Risk Category" 
               value={getAQICategoryLabel(aqi.indian_aqi)} 
               unit="CPCB Std." 
               icon={<AlertTriangle size={20}/>} 
            />
            
            {/* UPDATED DYNAMIC LOCATION CARD */}
            <MetricCard 
               label="Live Location" 
               value={locationInfo.name}    // e.g., "Durgapur"
               unit={locationInfo.coords}   // e.g., "23.52°N, 87.31°E"
               icon={<MapPin size={20}/>} 
            />

            <MetricCard 
               label="Medical Twin" 
               value="Active" 
               unit="Personalized" 
               icon={<Activity size={20}/>} 
            />
          </div>
        </div>

        {/* === MIDDLE: PROFESSIONAL ACTIVITY GUIDANCE === */}
        <div>
           <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
             <div className="w-1.5 h-8 bg-teal-600 rounded-full"></div>
             Activity Guidance
           </h2>
           <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(advisory.activities).map(([key, value]) => {
                const dotColorClass = getDotColor(value.color); 
                const iconColor = getIconColor(value.color); 

                return (
                  <div key={key} className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                    
                    {/* Header: Icon + Pulsing Dot */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl bg-white/80 shadow-sm ${iconColor}`}>
                         {getActivityIcon(key)}
                      </div>
                      
                      {/* FLICKERING DOT ANIMATION */}
                      <div className="relative flex items-center justify-center w-4 h-4">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColorClass}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColorClass}`}></span>
                      </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 capitalize mb-1">
                        {key.replace(/_/g, " ")}
                        </h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {value.status}
                        </p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* === BOTTOM: MEDICAL ADVISORY === */}
        <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-200/50 pb-4">
              <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-xl font-bold text-teal-900">Personalized Medical Advisory</h2>
           </div>
           
           <div className="text-slate-700 font-medium">
              <ReactMarkdown 
                components={{
                  // Paragraphs: relaxed line height and bottom spacing
                  p: ({node, ...props}) => <p className="mb-6 leading-8 text-slate-700" {...props} />,
                  
                  // Strong/Bold: Teal highlight
                  strong: ({node, ...props}) => <span className="font-extrabold text-teal-900 bg-teal-50 px-1 py-0.5 rounded shadow-sm border border-teal-100" {...props} />,
                  
                  // Unordered Lists: Disc bullets, proper indentation
                  ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-6 space-y-3 marker:text-teal-600" {...props} />,
                  
                  // Ordered Lists: Decimal numbers, proper indentation
                  ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-3 marker:text-teal-600" {...props} />,
                  
                  // List Items: Padding for readability
                  li: ({node, ...props}) => <li className="pl-2 leading-7" {...props} />,

                  // Headings (Handling structured AI responses)
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-teal-800 mt-6 mb-3 border-l-4 border-teal-500 pl-3" {...props} />,
                }}
              >
                {advisory.advisory_text}
              </ReactMarkdown>
           </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

// 1. PROFESSIONAL SEGMENTED SPEEDOMETER
function AQISpeedometer({ value }) {
  // SVG Config - Tighter ViewBox to hide bottom dial
  const radius = 90;
  const stroke = 18; // Slightly thinner for elegance
  const center = radius + stroke;
  const circumference = Math.PI * radius; 
  
  // Logic
  const maxAQI = 500;
  const normalizedValue = Math.min(value, maxAQI);
  const rotation = (normalizedValue / maxAQI) * 180;

  const segments = [
    { color: "#10B981", percent: 0.1 },  // Good (0-50)
    { color: "#84CC16", percent: 0.1 },  // Satisfactory (50-100)
    { color: "#EAB308", percent: 0.2 },  // Moderate (100-200)
    { color: "#F97316", percent: 0.2 },  // Poor (200-300)
    { color: "#EF4444", percent: 0.2 },  // Very Poor (300-400)
    { color: "#AB94FF", percent: 0.2 },  // Severe (400+)
  ];

  let currentRotation = 0;

  return (
    <div className="w-60 h-32.5 flex justify-center overflow-hidden">
       <svg viewBox={`0 0 ${center * 2} ${center + 10}`} className="w-full h-full">
          {/* Segments */}
          {segments.map((seg, i) => {
             const dashArray = `${circumference * seg.percent} ${circumference}`;
             // Gap between segments for segmented look
             const dashGap = 4; 
             const rot = currentRotation;
             currentRotation += 180 * seg.percent;

             return (
               <circle
                 key={i}
                 cx={center}
                 cy={center}
                 r={radius}
                 fill="none"
                 stroke={seg.color}
                 strokeWidth={stroke}
                 strokeDasharray={`${(circumference * seg.percent) - dashGap} ${circumference}`}
                 strokeDashoffset={0}
                 strokeLinecap="round"
                 transform={`rotate(${rot + 180} ${center} ${center})`}
                 className="drop-shadow-sm opacity-90"
               />
             );
          })}

          {/* Needle - Minimalist Marker */}
          <g style={{ 
              transform: `rotate(${rotation}deg)`, 
              transformOrigin: `${center}px ${center}px`,
              transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' 
            }}>
             {/* Simple triangle indicator on the outside */}
             <polygon points={`${center - 8},${center - radius + 15} ${center + 8},${center - radius + 15} ${center},${center - radius - 5}`} fill="#1e293b" />
          </g>
       </svg>
    </div>
  );
}

function MetricCard({ label, value, unit, icon }) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
       <div className="flex justify-between items-start mb-2">
          <span className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">{label}</span>
          <div className="text-teal-700 opacity-60 group-hover:scale-110 transition-transform">{icon}</div>
       </div>
       <div>
          <div className="text-2xl font-extrabold text-slate-800">{value}</div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">{unit}</div>
       </div>
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100/50 backdrop-blur-sm relative z-50">
       <div className="p-8 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
          {/* <p className="text-lg font-bold text-teal-800 animate-pulse">Initializing...</p> */}
          <p className="text-lg font-bold text-teal-600 animate-pulse">
            Initializing...
          </p>
          <p className="text-lg font-bold text-teal-800 animate-pulse">Fetching Live Location</p>
       </div>
    </div>
  )
}

// --- UTILS ---

// 1. Dot Colors (Flickering Animation)
function getDotColor(color) {
    switch (color?.toLowerCase()) {
      case "red": return "bg-red-500 shadow-red-500/50";
      case "yellow": return "bg-yellow-400 shadow-yellow-400/50";
      case "green": return "bg-emerald-500 shadow-emerald-500/50";
      default: return "bg-gray-400";
    }
}

// 2. Icon Text Colors
function getIconColor(color) {
  switch (color?.toLowerCase()) {
    case "red": return "text-red-600";
    case "yellow": return "text-yellow-600";
    case "green": return "text-emerald-600";
    default: return "text-gray-600";
  }
}

// 3. Labels
function getAQICategoryLabel(aqi) {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Satisfactory";
    if (aqi <= 200) return "Moderate";
    if (aqi <= 300) return "Poor";
    if (aqi <= 400) return "Very Poor";
    return "Severe";
}