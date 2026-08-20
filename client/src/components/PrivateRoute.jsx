import { Navigate } from "react-router-dom";
import { readSession } from "../utils/storage";
import { accountTypeFromUser, homeForAccount } from "../utils/accountSession";

function PrivateRoute({ children }) {
  const user = readSession();

  if (!user) return <Navigate to="/login" replace />;
  if (accountTypeFromUser(user.user) !== "customer") return <Navigate to={homeForAccount(user.user)} replace />;
  return children;
}

export default PrivateRoute;
