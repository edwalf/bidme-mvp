"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // El servidor respondió algo que no es JSON (ej. error 500 sin body,
        // timeout, o la base de datos aún no tiene las tablas migradas).
        setError("El servidor no respondió correctamente. Intenta de nuevo en unos segundos.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-7">
        <div className="flex justify-center mb-6">
          <Image src="/logo-full.png" alt="BidMe — Smart Procurement" width={168} height={156} priority />
        </div>
        <h1 className="text-[16px] font-semibold text-gray-900 mb-4">Iniciar sesión</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[12.5px] rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <label className="text-[12.5px] font-medium text-gray-700">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 mb-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]"
          placeholder="tucorreo@empresa.com"
        />

        <label className="text-[12.5px] font-medium text-gray-700">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 mb-5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]"
          placeholder="••••••••"
        />

        <button
          disabled={loading}
          className="w-full bg-[#C9A227] text-[#0F1B2E] text-[13.5px] font-medium py-2 rounded-lg hover:bg-[#B8911F] transition-colors duration-150 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="text-[12.5px] text-gray-500 text-center mt-4">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-[#C9A227] font-medium">
            Regístrate
          </Link>
        </p>
        <p className="text-[11px] text-gray-400 text-center mt-3">
          Prueba: eoliveros@ciatechnology.net / password123 (comprador de ejemplo del seed)
        </p>
      </form>
    </div>
  );
}
