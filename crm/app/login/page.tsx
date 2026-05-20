"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * CRM login is now handled by the unified admin login portal.
 * This page redirects to /admin/login.
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-sm text-zinc-400">Redirecting to login...</div>
    </main>
  );
}
