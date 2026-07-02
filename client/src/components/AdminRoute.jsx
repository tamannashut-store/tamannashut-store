import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {

    const userData = JSON.parse(
        localStorage.getItem("user")
    );

    if (!userData?.user?.isAdmin) {

        return <Navigate to="/admin-login" />;
    }

    return children;
}

export default AdminRoute;