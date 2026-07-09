"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, Paperclip, Calendar, Radar, Sparkles, Lock } from "lucide-react";

const CATEGORIES = ["Tecnología", "SAP", "Ciberseguridad", "Construcción", "Transporte", "Mantenimiento", "Limpieza", "Seguridad"];

const SUBCATEGORIES: Record<string, string[]> = {
  "Tecnología": ["Computadoras", "Redes", "Software", "Impresión"],
  "SAP": ["Implementación", "Soporte", "Licenciamiento"],
  "Ciberseguridad": ["Perimetral", "Auditoría", "SOC"],
  "Construcción": ["Obra civil", "Remodelación", "Eléctrica"],
  "Transporte": ["Carga", "Personal", "Última milla"],
  "Mantenimiento": ["Industrial", "Edificios", "Aires acondicionados"],
  "Limpieza": ["Oficinas", "Industrial"],
  "Seguridad": ["Física", "Monitoreo", "Escoltas"],
};

type MatchingPhase = "idle" | "publishing" | "matching" | "done" | "error";

export default function NewRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const steps = ["Información", "Detalles", "Revisión"];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subCategory, setSubCategory] = useState("");
  const [city, setCity] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [requirements, setRequirements] = useState("");

  const [phase, setPhase] = useState<MatchingPhase>("idle");

  const [error, setError] = useState<string | null>(null);
  const [rfqId, setRfqId] = useState<string | null>(null);

  async function handlePublish() {
    setError(null);
    setPhase("publishing");

    try {
      const createRes = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          subCategory: subCategory || undefined,
          city,
          deadline: new Date(deadline).toISOString(),
          budget: budget ? Number(budget) : undefined,
          requirements: requirements || undefined,
        }),
      });
      const rfq = await createRes.json();
      if (!createRes.ok) {
        setError("No se pudo crear la solicitud. Revisa los campos.");
        setPhase("error");
        return;
      }
      setRfqId(rfq.id);
      setPhase("matching");

      const publishRes = await fetch(`/api/rfqs/${rfq.id}/publish`, { method: "POST" });
      const result = await publishRes.json();
      if (!publishRes.ok) {
        setError(result.error || "No se pudo publicar la solicitud.");
        setPhase("error");
        return;
      }
      // El Smart Matching ya corrió — llevar al comprador a la pantalla
      // de resultados para revisar e invitar automáticamente.
      router.push(result.redirectTo || `/buyer/requests/${rfq.id}/matching`);
    } catch {
      setError("No se pudo conectar con el servidor.");
      setPhase("error");
    }
  }

  if (phase === "publishing" || phase === "matching") {
    return (
      <div className="px-8 py-6 max-w-3xl">
        <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-[#C9A227]/10 flex items-center justify-center mb-4 animate-pulse">
            <Radar size={22} className="text-[#C9A227]" />
          </div>
          <div className="text-[15px] font-medium text-gray-900">Buscando proveedores calificados…</div>
          <div className="text-[12.5px] text-gray-400 mt-1.5 max-w-xs">
            BidMe está evaluando categoría, cobertura y verificación de cada proveedor.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 max-w-3xl">
      <div className="flex items-center mb-8 pt-5">
        {steps.map((s, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors duration-150 ${
                    done ? "bg-[#C9A227] text-[#0F1B2E]" : active ? "border-2 border-[#C9A227] text-[#C9A227]" : "border border-gray-300 text-gray-400"
                  }`}
                >
                  {done ? <Check size={12} /> : n}
                </div>
                <span className={`text-[12.5px] ${active ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className="w-10 h-px bg-gray-200 mx-3" />}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[12.5px] rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-[12.5px] font-medium text-gray-700">Título de la solicitud</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]"
                placeholder="Ej. Implementación de SAP Business One"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-gray-700">Descripción</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]"
                placeholder="Describe el alcance de lo que necesitas cotizar"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12.5px] font-medium text-gray-700">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}
                  className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <label className="text-[12.5px] font-medium text-gray-700 block mt-3">Subcategoría (opcional)</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] bg-white"
                >
                  <option value="">— Sin especificar —</option>
                  {(SUBCATEGORIES[category] || []).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-gray-700">Ciudad</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="Guatemala City" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12.5px] font-medium text-gray-700 flex items-center gap-1">
                  <Calendar size={12} /> Fecha límite
                </label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" />
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-gray-700">Presupuesto (opcional)</label>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="40000" />
              </div>
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-gray-700">Requisitos</label>
              <textarea rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="Certificaciones necesarias, experiencia mínima, etc." />
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center text-gray-400">
              <Paperclip size={18} />
              <span className="text-[12.5px] mt-1">Carga de adjuntos disponible en la siguiente versión (requiere S3)</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-gray-900 font-medium text-[13.5px]">Todo listo para publicar.</p>
              <p className="text-[13px] text-gray-500 mt-1">
                No necesitas elegir a quién invitar. Al publicar, BidMe identificará automáticamente a los proveedores más adecuados y les enviará tu solicitud de forma privada.
              </p>
            </div>
            <div className="rounded-lg bg-[#C9A227]/[0.04] border border-[#C9A227]/15 p-4">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#C9A227]">
                <Radar size={14} /> Criterios que usará el motor de matching
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {["Categoría", "Cobertura geográfica", "Certificaciones", "Historial de cumplimiento", "Calificación", "Tiempo de respuesta"].map((c) => (
                  <span key={c} className="text-[11px] bg-white border border-gray-200 text-gray-600 rounded-full px-2.5 py-1">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11.5px] text-gray-400 flex items-center gap-1">
              <Lock size={11} /> Ningún proveedor invitado sabrá quiénes más fueron invitados.
            </p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <button disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="text-[13px] text-gray-500 disabled:opacity-30 px-3 py-1.5">
            Atrás
          </button>
          <button
            onClick={() => (step === 3 ? handlePublish() : setStep((s) => Math.min(3, s + 1)))}
            className="bg-[#C9A227] text-[#0F1B2E] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#B8911F] transition-colors duration-150 flex items-center gap-1"
          >
            {step === 3 ? "Publicar solicitud" : "Continuar"} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
