import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSOS } from "../utils/sosStorage";

export default function SOSGuard({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const sos = getSOS();
    if (sos?.active) {
      navigate("/sos", { replace: true });
    }
  }, []);

  return children;
}
