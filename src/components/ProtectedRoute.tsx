import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";
import Spinner from "@/pages/components/shared/Spinner";

const PRIVILEGED_ROLES = ["ADMIN", "SUPERADMIN", "MANAGER", "OWNER"];

export default function ProtectedRoute({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: string;
}) {
  const { currentUser, loading } = useAppSelector((state) => state.authSlice);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas dark:bg-canvas-dark">
        <Spinner size="large" tip="AUTHENTICATING..." />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission) {
    const normalizedRole = currentUser.role?.toUpperCase() ?? "";
    const isPrivileged = PRIVILEGED_ROLES.includes(normalizedRole);

    if (!isPrivileged && !currentUser.permissions?.includes(permission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
