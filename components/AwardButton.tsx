"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";

export function AwardButton({ rfqId, invitationId, supplierName }: { rfqId: string; invitationId: string; supplierName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmAward() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setError("El servidor no respondió correctamente.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "No se pudo adjudicar.");
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-gray-500">¿Elegir a {supplierName}?</span>
        <button
          disabled={loading}
          onClick={confirmAward}
          className="text-[11px] font-medium bg-[#C9A227] text-[#0F1B2E] rounded-md px-2 py-1 hover:bg-[#B8911F] disabled:opacity-60"
        >
          {loading ? "…" : "Confirmar"}
        </button>
        <button
          disabled={loading}
          onClick={() => setConfirming(false)}
          className="text-[11px] text-gray-400 hover:text-gray-600"
        >
          Cancelar
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 text-[11.5px] font-medium text-[#C9A227] border border-[#C9A227]/30 rounded-md px-2.5 py-1 hover:bg-[#C9A227]/5"
    >
      <Trophy size={12} /> Adjudicar
    </button>
  );
}
