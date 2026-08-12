import { Navigate } from "react-router-dom";
import { readSession } from "../utils/storage";

function PrivateRoute({ children }) {
  const user = readSession();

  return user
    ? children
    : <Navigate to="/login" />;
}

export default PrivateRoute;
