import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";
import { Spin } from "antd";

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission) {
    const isSpecialRole =
      currentUser.role === "ADMIN" ||
      currentUser.role === "SUPERADMIN" ||
      currentUser.role === "Manager";

    if (!isSpecialRole && !currentUser.permissions?.includes(permission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
