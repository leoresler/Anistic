import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/auth.store";

export const RequireAdmin = () => {
  const isAdmin = useAuthStore((state) => state.user?.isAdmin);

  useEffect(() => {
    if (!isAdmin) {
      toast.error("No tenés permisos de administrador");
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
