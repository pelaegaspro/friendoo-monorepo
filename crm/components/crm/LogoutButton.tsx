"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/crm/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <Button variant="secondary" size="sm" onClick={logout}>
      Logout
    </Button>
  );
}
