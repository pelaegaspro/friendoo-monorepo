"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/crm/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        router.replace("/crm");
      } else {
        const json = await response.json();
        setError(json.error || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#2b2b2b] bg-[#161616] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto w-fit mb-4 select-none">
            <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c5cff" />
                  <stop offset="100%" stopColor="#ff7ab6" />
                </linearGradient>
              </defs>
              <text x="0" y="22" fill="url(#logoGrad)" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>friendoo</text>
            </svg>
          </div>
          <h1 className="mt-5 text-xl font-semibold text-zinc-200">CRM Intelligence Portal</h1>
          <p className="mt-2 text-sm text-zinc-400">Enter the CRM password to access data.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">CRM Password</span>
            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter password"
                className="w-full rounded-2xl border border-[#343434] bg-[#101010] pl-11 pr-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                required
              />
              <LockKeyhole className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
            </div>
          </label>

          {error && (
            <div className="rounded-xl bg-red-500/10 p-3 text-center text-xs font-medium text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
