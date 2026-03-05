import { FullScreenLoader } from "@shared/components/ui/FullScreenLoader";
import { useIsLoading, useUser } from "@store";
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const user = useUser();
  const loading = useIsLoading();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
