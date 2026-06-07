import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return user
    ? children
    : <Navigate to="/login" />;
}

export default PrivateRoute;