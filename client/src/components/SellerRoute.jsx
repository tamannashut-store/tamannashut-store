import { Navigate } from "react-router-dom";
import { readSession } from "../utils/storage";

function SellerRoute({ children }) {
  const session = readSession();
  const seller = session?.user?.accountType === "seller" || session?.user?.sellerRole === "member";
  if (!seller || session?.user?.sellerAccessStatus !== "active") return <Navigate to="/admin-login" replace />;
  return children;
}

export default SellerRoute;
