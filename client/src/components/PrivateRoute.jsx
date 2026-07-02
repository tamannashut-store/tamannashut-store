import { Navigate } from "react-router-dom";
import Container from "../components/Container";
function PrivateRoute({ children }) {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return user
    ? <Container className="py-20">{children}</Container>
    : <Container className="py-20"><Navigate to="/login" /></Container>;
}

export default PrivateRoute;