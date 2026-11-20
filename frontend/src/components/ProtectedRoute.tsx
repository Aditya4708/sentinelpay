import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMe } from "../services/api";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authed" | "guest">("checking");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setStatus("guest");
      return;
    }

    fetchMe()
      .then(() => setStatus("authed"))
      .catch(() => setStatus("guest"));
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-secondary)" }}>
        Loading
      </div>
    );
  }

  if (status === "guest") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}