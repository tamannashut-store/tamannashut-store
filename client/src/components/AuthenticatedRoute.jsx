import { Navigate, useLocation } from "react-router-dom";
import { readSession } from "../utils/storage";

export default function AuthenticatedRoute({ children }) {
  const location = useLocation();
  const session = readSession();
  if (session) return children;
  sessionStorage.setItem("redirectAfterLogin", `${location.pathname}${location.search}`);
  return <Navigate to="/login" replace />;
}
