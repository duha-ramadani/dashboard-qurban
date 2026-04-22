"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email atau password salah.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-4">
            <Image src="/logo.png" alt="Logo Qurban" width={56} height={56} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard Qurban</h1>
          <p className="text-sm text-slate-500 mt-1">Masuk sebagai panitia</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="panitia@qurban.com"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-medium py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Hubungi admin untuk mendapatkan akses
        </p>
      </div>
    </div>
  );
}
