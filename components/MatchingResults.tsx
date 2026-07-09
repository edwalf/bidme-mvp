"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Sparkles, Check, Crown, MapPin, Globe } from "lucide-react";

interface MatchedSupplier {
  id: string;
  name: string;
  category: string;
  city: string;
  score: number;
  tier: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  isPremium: boolean;
  verified: boolean;
  coverageNational: boolean;
  coverageDepartment: string | null;
}

interface MatchingData {
  rfq: { id: string; title: string; category: string; city: string };
  counts: { total: number; high: number; medium: number; low: number };
  suppliers: MatchedSupplier[];
}

type Filter = "ALL" | "PREMIUM" | "VERIFIED" | "CITY" | "DEPARTMENT" | "NATIONAL" | "SCORE80";

const TIER_STYLES = {
  HIGH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-gray-100 text-gray-500 border-gray-200",
};
const TIER_LABELS = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" };

export function MatchingResults({ rfqId }: { rfqId: string }) {
  const router = useRouter();
  const [data, setData] = useState<MatchingData | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/rfqs/${rfqId}/matching`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Error cargando resultados");
          return;
        }
        setData(json);
        // preselección: coincidencia alta y media
        setSelected(
          new Set(
            json.suppliers
              .filter((s: MatchedSupplier) => s.tier !== "LOW")
              .map((s: MatchedSupplier) => s.id)
          )
        );
      } catch {
        setError("No se pudo conectar con el servidor.");
      }
    })();
  }, [rfqId]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.suppliers.filter((s) => {
      switch (filter) {
        case "PREMIUM": return s.isPremium;
        case "VERIFIED": return s.verified;
        case "CITY": return s.city === data.rfq.city;
        case "DEPARTMENT": return !!s.coverageDepartment;
        case "NATIONAL": return s.coverageNational;
        case "SCORE80": return s.score >= 80;
        default: return true;
      }
    });
  }, [data, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function inviteSelected() {
    if (selected.size === 0) {
      setError("Selecciona al menos un proveedor.");
      return;
    }
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/matching/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierOrgIds: Array.from(selected) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudieron enviar las invitaciones.");
        return;
      }
      setDone(json.invitedCount);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setInviting(false);
    }
  }

  if (done !== null) {
    return (
      <div className="px-8 py-16 max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Sparkles size={22} className="text-emerald-500" />
          </div>
          <div className="text-[15px] font-medium text-gray-900">
            Invitaciones enviadas a {done} proveedor{done === 1 ? "" : "es"}
          </div>
          <div className="text-[12.5px] text-gray-400 mt-1.5 max-w-sm">
            Cada proveedor recibió una notificación privada. Ninguno sabe quiénes más fueron invitados. Te avisaremos cuando lleguen las primeras cotizaciones.
          </div>
          <button
            onClick={() => router.push(`/buyer/requests/${rfqId}/compare`)}
            className="mt-5 text-[12.5px] font-medium text-[#C9A227] border border-[#C9A227]/30 rounded-lg px-3.5 py-1.5 hover:bg-[#C9A227]/5"
          >
            Ir al comparador →
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-8 py-16 max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-[#C9A227]/10 flex items-center justify-center mb-4 animate-pulse">
            <Radar size={22} className="text-[#C9A227]" />
          </div>
          <div className="text-[15px] font-medium text-gray-900">
            {error || "Analizando proveedores compatibles…"}
          </div>
        </div>
      </div>
    );
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "Todos" },
    { key: "PREMIUM", label: "Solo Premium" },
    { key: "VERIFIED", label: "Solo Verificados" },
    { key: "CITY", label: "Solo Ciudad" },
    { key: "DEPARTMENT", label: "Departamento" },
    { key: "NATIONAL", label: "Cobertura Nacional" },
    { key: "SCORE80", label: "Score 80+" },
  ];

  return (
    <div>
      <div className="px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">Smart Matching</h1>
          <div className="text-[12px] text-gray-400 mt-0.5">{data.rfq.title}</div>
        </div>
        <button
          onClick={inviteSelected}
          disabled={inviting || selected.size === 0}
          className="flex items-center gap-1.5 bg-[#C9A227] text-[#0F1B2E] text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#B8911F] transition-colors duration-150 disabled:opacity-50"
        >
          <Sparkles size={14} />
          {inviting ? "Enviando…" : `Invitar automáticamente (${selected.size})`}
        </button>
      </div>

      <div className="px-8 py-6 max-w-5xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[12.5px] rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-[#0F1B2E] text-white p-6 mb-6 flex items-center justify-between">
          <div>
            <div className="text-[13px] text-gray-400">Smart Matching encontró</div>
            <div className="text-[28px] font-semibold mt-0.5">
              {data.counts.total} proveedores compatibles
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-[22px] font-semibold text-emerald-400">{data.counts.high}</div>
              <div className="text-[11px] text-gray-400">Coincidencia alta</div>
            </div>
            <div>
              <div className="text-[22px] font-semibold text-amber-400">{data.counts.medium}</div>
              <div className="text-[11px] text-gray-400">Media</div>
            </div>
            <div>
              <div className="text-[22px] font-semibold text-gray-500">{data.counts.low}</div>
              <div className="text-[11px] text-gray-400">Baja</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[11.5px] rounded-full px-3 py-1.5 border transition-colors duration-150 ${
                filter === f.key
                  ? "bg-[#0F1B2E] text-white border-[#0F1B2E]"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <div className="text-[13px] text-gray-400 text-center py-10">
              Ningún proveedor coincide con este filtro.
            </div>
          )}
          {filtered.map((s) => {
            const isSelected = selected.has(s.id);
            return (
              <div
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`rounded-xl border bg-white p-4 flex items-center gap-4 cursor-pointer transition-all duration-150 ${
                  isSelected ? "border-[#C9A227]/60 shadow-sm" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(s.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 accent-[#C9A227] shrink-0"
                />

                <div className="h-9 w-9 rounded-full bg-[#0F1B2E]/5 flex items-center justify-center text-[12px] font-medium text-[#0F1B2E] shrink-0">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-[13.5px]">{s.name}</span>
                    {s.verified && <Check size={12} className="text-emerald-500" />}
                    {s.isPremium && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-[#C9A227]/10 text-[#8a6d15] rounded-full px-2 py-0.5">
                        <Crown size={9} /> PREMIUM
                      </span>
                    )}
                    {s.coverageNational && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                        <Globe size={9} /> Nacional
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11.5px] text-gray-400">
                    <span>{s.category}</span>
                    <span className="flex items-center gap-0.5"><MapPin size={10} /> {s.city}</span>
                    <span className="truncate">{s.reasons.join(" · ")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${TIER_STYLES[s.tier]}`}>
                    {TIER_LABELS[s.tier]}
                  </span>
                  <div className="w-14 text-right">
                    <div className={`text-[17px] font-semibold ${s.score >= 70 ? "text-emerald-600" : s.score >= 40 ? "text-amber-600" : "text-gray-400"}`}>
                      {s.score}
                    </div>
                    <div className="text-[9.5px] text-gray-400 uppercase tracking-wide">score</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
