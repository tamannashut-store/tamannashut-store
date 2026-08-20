import { Navigate } from "react-router-dom";
import { readSession } from "../utils/storage";

function SellerApplicantRoute({ children }) {
  const session = readSession();
  const seller = session?.user?.accountType === "seller" || session?.user?.sellerRole === "member";
  if (!seller || ["closed", "suspended"].includes(session?.user?.sellerAccessStatus)) return <Navigate to="/admin-login" replace/>;
  return children;
}

export default SellerApplicantRoute;
