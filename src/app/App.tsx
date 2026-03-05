import { queryClient } from "@lib/queryClient";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AppRouter } from "./router";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
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
              iconTheme: { primary: "#00f0ff", secondary: "#04060f" },
            },
            error: { iconTheme: { primary: "#ef4444", secondary: "#04060f" } },
          }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
