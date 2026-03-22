import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@hooks/useAuth";
import { initAnalytics } from "@lib/analytics";
import { queryClient } from "@lib/queryClient";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AppRouter } from "./router";

// Boot analytics once
initAnalytics();

// Initialises the Supabase auth listener + restores any existing session.
// Must live inside QueryClientProvider so useAuth can use React hooks,
// but outside the router so it runs before any AuthGuard checks.
function AuthInit({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary scope="App">
      <GoogleOAuthProvider
        clientId={import.meta.env.GOOGLE_CLIENT_ID ?? ""}
      >
        <QueryClientProvider client={queryClient}>
          <AuthInit>
            <AppRouter />
          </AuthInit>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#0d0f1f",
                color: "#e4e5f0",
                border: "1px solid #1e2035",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: {
                  primary: "var(--ac)",
                  secondary: "var(--background)",
                },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#04060f" },
              },
            }}
          />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
