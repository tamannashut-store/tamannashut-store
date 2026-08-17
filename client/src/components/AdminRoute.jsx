import { Navigate } from "react-router-dom";
import { readSession } from "../utils/storage";

function AdminRoute({ children }) {

    const userData = readSession();

    const platformAdmin = userData?.user?.accountType === "platform_admin"
      || (userData?.user?.isAdmin && userData?.user?.sellerRole !== "member");
    if (!platformAdmin) {

        return <Navigate to="/admin-login" />;
    }

    return children;
}

export default AdminRoute;
