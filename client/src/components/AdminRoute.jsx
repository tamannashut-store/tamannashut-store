import { Navigate } from "react-router-dom";
import { readSession } from "../utils/storage";

function AdminRoute({ children }) {

    const userData = readSession();

    if (!userData?.user?.isAdmin) {

        return <Navigate to="/admin-login" />;
    }

    return children;
}

export default AdminRoute;
