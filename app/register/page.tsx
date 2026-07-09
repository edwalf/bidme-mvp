"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  "Tecnología", "SAP", "Ciberseguridad", "Construcción", "Transporte",
  "Mantenimiento", "Limpieza", "Seguridad",
  "Agroindustria", "Alimentos", "Automotriz", "Banca y Finanzas",
  "Bienes Raíces", "Comercio y Retail", "Consultoría", "Educación",
  "Energía", "Gobierno", "Hotelería y Turismo", "Legal",
  "Marketing y Comunicación", "Salud", "Seguros", "Otros",
];

export default function RegisterPage() {
  const router = useRouter();
  const [orgType, setOrgType] = useState<"BUYER" | "SUPPLIER">("BUYER");
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleCategory(c: string) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgType, orgName, city, categories, name, email, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setError("El servidor no respondió correctamente. Intenta de nuevo en unos segundos.");
        return;
      }

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Revisa los datos ingresados");
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-7">
        <div className="flex justify-center mb-6">
          <Image src="/logo-full.png" alt="BidMe — Smart Procurement" width={140} height={130} priority />
        </div>
        <h1 className="text-[16px] font-semibold text-gray-900 mb-4">Crear cuenta</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[12.5px] rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setOrgType("BUYER")}
            className={`flex-1 text-[12.5px] font-medium py-2 rounded-lg border ${orgType === "BUYER" ? "border-[#C9A227] bg-[#C9A227]/5 text-[#C9A227]" : "border-gray-200 text-gray-500"}`}
          >
            Soy Comprador
          </button>
          <button
            type="button"
            onClick={() => setOrgType("SUPPLIER")}
            className={`flex-1 text-[12.5px] font-medium py-2 rounded-lg border ${orgType === "SUPPLIER" ? "border-[#C9A227] bg-[#C9A227]/5 text-[#C9A227]" : "border-gray-200 text-gray-500"}`}
          >
            Soy Proveedor
          </button>
        </div>

        <label className="text-[12.5px] font-medium text-gray-700">Nombre de la empresa</label>
        <input required value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1.5 mb-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="CIA Technology" />

        <label className="text-[12.5px] font-medium text-gray-700">Ciudad</label>
        <input required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5 mb-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="Guatemala City" />

        {orgType === "SUPPLIER" && (
          <div className="mb-3">
            <label className="text-[12.5px] font-medium text-gray-700">Categorías en las que ofreces servicios</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`text-[11px] rounded-full px-2.5 py-1 border ${categories.includes(c) ? "bg-[#C9A227] text-[#0F1B2E] border-[#C9A227]" : "border-gray-200 text-gray-600"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Tu cuenta quedará pendiente de verificación por un admin antes de poder recibir invitaciones automáticas.
            </p>
          </div>
        )}

        <label className="text-[12.5px] font-medium text-gray-700">Tu nombre</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 mb-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="Nombre y apellido" />

        <label className="text-[12.5px] font-medium text-gray-700">Correo</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 mb-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="tucorreo@empresa.com" />

        <label className="text-[12.5px] font-medium text-gray-700">Contraseña</label>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 mb-5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="Mínimo 8 caracteres" />

        <button disabled={loading} className="w-full bg-[#C9A227] text-[#0F1B2E] text-[13.5px] font-medium py-2 rounded-lg hover:bg-[#B8911F] transition-colors duration-150 disabled:opacity-60">
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        <p className="text-[12.5px] text-gray-500 text-center mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#C9A227] font-medium">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
