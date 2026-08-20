import { Navigate } from "react-router-dom";
import { readSession } from "../utils/storage";
import { homeForAccount } from "../utils/accountSession";

export default function CustomerGuestRoute({ children }) {
  const session = readSession();
  return session ? <Navigate to={homeForAccount(session.user)} replace /> : children;
}
