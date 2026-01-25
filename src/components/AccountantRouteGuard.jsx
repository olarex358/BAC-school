import { Navigate } from "react-router-dom";

export default function AccountantRouteGuard({ children }) {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) return <Navigate to="/login" />;
  if (user.type !== "accountant")
    return <Navigate to="/unauthorized" />;

  return children;
}
