"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Lock } from "lucide-react";

interface Props {
  invitationId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  hasProposal: boolean;
}

export function InvitationActions({ invitationId, status, hasProposal }: Props) {
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState(status);
  const [showForm, setShowForm] = useState(false);
  const [price, setPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [warranty, setWarranty] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(hasProposal);
  const [loading, setLoading] = useState(false);

  async function respond(action: "ACCEPT" | "REJECT") {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invitations/${invitationId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo registrar tu respuesta.");
      return;
    }
    setLocalStatus(action === "ACCEPT" ? "ACCEPTED" : "REJECTED");
    if (action === "ACCEPT") setShowForm(true);
    router.refresh();
  }

  async function submitProposal(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitationId,
        price: Number(price),
        deliveryTime,
        warranty,
        comments: comments || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo enviar la propuesta. Revisa los campos.");
      return;
    }
    setSubmitted(true);
    setShowForm(false);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] px-4 py-3">
        Tu propuesta fue enviada de forma privada. Solo el comprador puede verla.
      </div>
    );
  }

  if (localStatus === "REJECTED") {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-[13px] px-4 py-3">
        Rechazaste esta invitación.
      </div>
    );
  }

  if (localStatus === "PENDING") {
    return (
      <div>
        {error && <div className="text-red-600 text-[12.5px] mb-2">{error}</div>}
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() => respond("ACCEPT")}
            className="flex items-center gap-1.5 bg-[#C9A227] text-[#0F1B2E] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#B8911F] disabled:opacity-60"
          >
            <Check size={14} /> Participar
          </button>
          <button
            disabled={loading}
            onClick={() => respond("REJECT")}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          >
            <X size={14} /> No participar
          </button>
        </div>
      </div>
    );
  }

  // ACCEPTED, sin propuesta enviada todavía
  return (
    <form onSubmit={submitProposal} className="space-y-3">
      {error && <div className="text-red-600 text-[12.5px]">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[12.5px] font-medium text-gray-700">Precio (USD)</label>
          <input required type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="42000" />
        </div>
        <div>
          <label className="text-[12.5px] font-medium text-gray-700">Tiempo de entrega</label>
          <input required value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="6 semanas" />
        </div>
      </div>
      <div>
        <label className="text-[12.5px] font-medium text-gray-700">Garantía</label>
        <input required value={warranty} onChange={(e) => setWarranty(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="12 meses" />
      </div>
      <div>
        <label className="text-[12.5px] font-medium text-gray-700">Observaciones (opcional)</label>
        <textarea rows={2} value={comments} onChange={(e) => setComments(e.target.value)} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" />
      </div>
      <p className="text-[11px] text-gray-400 flex items-center gap-1">
        <Lock size={10} /> Tu propuesta es privada. Ningún otro proveedor la verá.
      </p>
      <button disabled={loading} className="bg-[#C9A227] text-[#0F1B2E] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#B8911F] disabled:opacity-60">
        {loading ? "Enviando…" : "Enviar propuesta"}
      </button>
    </form>
  );
}
