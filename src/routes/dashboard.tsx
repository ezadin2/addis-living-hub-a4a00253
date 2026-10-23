import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FaydaRent" },
      { name: "description", content: "Opening your FaydaRent dashboard." },
      { property: "og:title", content: "Dashboard — FaydaRent" },
      { property: "og:description", content: "Your FaydaRent dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

/** Sends each signed-in user to the dashboard built for their role. */
function Page() {
  const { loading, session, role } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!session) void navigate({ to: "/signin", replace: true });
    else if (role === "admin") void navigate({ to: "/admin", replace: true });
    else if (role === "owner") void navigate({ to: "/owner", replace: true });
    else if (role) void navigate({ to: "/renter", replace: true });
  }, [loading, session, role, navigate]);
  return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Opening your dashboard…</div>;
}
