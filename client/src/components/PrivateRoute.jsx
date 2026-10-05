import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { readSession } from "../utils/storage";
import { accountTypeFromUser, homeForAccount } from "../utils/accountSession";

function PrivateRoute({ children }) {
  const user = readSession();
  const location = useLocation();
  useEffect(() => {
    if (!user) sessionStorage.setItem("redirectAfterLogin", `${location.pathname}${location.search}${location.hash}`);
  }, [user, location.pathname, location.search, location.hash]);

  if (!user) return <Navigate to="/login" replace />;
  if (accountTypeFromUser(user.user) !== "customer") return <Navigate to={homeForAccount(user.user)} replace />;
  return children;
}

export default PrivateRoute;
