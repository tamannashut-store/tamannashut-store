import { Navigate } from "react-router-dom";
import Container from "../components/Container";
function AdminRoute({ children }) {

    const userData = JSON.parse(
        localStorage.getItem("user")
    );

    if (!userData?.user?.isAdmin) {

        return <Container className="py-20"><Navigate to="/admin-login" /></Container>;
    }

    return <Container className="py-20">{children}</Container>;
}

export default AdminRoute;