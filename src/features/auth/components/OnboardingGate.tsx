import { useUser } from "@store";
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

export const OnboardingGate = ({ children }: { children: ReactNode }) => {
  const user = useUser();
  if (user && !user.onboardingComplete)
    return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};
