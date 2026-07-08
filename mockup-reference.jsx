import React, { useState } from "react";
import {
  LayoutGrid, FileText, MessageSquare, Users, Settings, Plus,
  Lock, Star, Download, ChevronRight, Paperclip, Calendar,
  MapPin, Check, X, Search, Bell, Sparkles, Radar
} from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "requests", label: "Solicitudes", icon: FileText },
  { id: "compare", label: "Comparador", icon: Star },
  { id: "messages", label: "Mensajes", icon: MessageSquare },
  { id: "suppliers", label: "Historial de Proveedores", icon: Users },
];

const STATUS_STYLES = {
  Activa: "bg-blue-50 text-blue-700 border-blue-200",
  Finalizada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  Cancelada: "bg-gray-100 text-gray-500 border-gray-200",
};

const REQUESTS = [
  { id: 1, title: "Implementación SAP Business One", cat: "SAP", city: "Guatemala City", status: "Activa", quotes: 4, deadline: "12 jul" },
  { id: 2, title: "Servicio de ciberseguridad perimetral", cat: "Ciberseguridad", city: "San Salvador", status: "Activa", quotes: 2, deadline: "18 jul" },
  { id: 3, title: "Mantenimiento de flotilla vehicular", cat: "Transporte", city: "Guatemala City", status: "Pendiente", quotes: 0, deadline: "25 jul" },
  { id: 4, title: "Renovación de licencias Microsoft 365", cat: "Tecnología", city: "Remoto", status: "Finalizada", quotes: 6, deadline: "02 jul" },
];

const PROPOSALS = [
  { supplier: "Nexus IT Solutions", price: "$42,000", time: "6 semanas", warranty: "12 meses", fav: true, verified: true },
  { supplier: "Vector Consulting", price: "$38,500", time: "8 semanas", warranty: "6 meses", fav: false, verified: true },
  { supplier: "Proveedor confidencial C", price: "•••••", time: "•••••", warranty: "•••••", fav: false, verified: true, locked: true },
];

function Sidebar({ active, setActive }) {
  return (
    <aside className="w-56 shrink-0 bg-[#0F1B2E] flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-[#C9A227] flex items-center justify-center">
          <Lock size={14} className="text-[#0F1B2E]" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight text-[#F5F1E8]">BidMe</span>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors duration-150 ${
                isActive
                  ? "bg-[#C9A227]/15 text-[#C9A227] font-medium"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              {n.label}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-1">
          <div className="h-7 w-7 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-[11px] font-medium text-[#C9A227]">
            CT
          </div>
          <div className="text-[12px] leading-tight">
            <div className="font-medium text-[#F5F1E8]">CIA Technology</div>
            <div className="text-gray-500">Comprador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title, action }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10">
      <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="h-8 w-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
          <Search size={15} />
        </button>
        <button className="h-8 w-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 relative">
          <Bell size={15} />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center">2</span>
        </button>
        {action}
      </div>
    </div>
  );
}

function KPICard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-[12px] text-gray-500">{label}</div>
      <div className="text-[24px] font-semibold text-gray-900 mt-1">{value}</div>
      {sub && <div className="text-[11.5px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Dashboard() {
  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard label="Solicitudes activas" value="7" sub="2 nuevas esta semana" />
        <KPICard label="Cotizaciones recibidas" value="23" sub="+6 vs. semana pasada" />
        <KPICard label="Proveedores invitados" value="15" sub="12 verificados" />
        <KPICard label="Alertas" value="2" sub="Fechas límite próximas" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 text-[13px] font-medium text-gray-700">
          Solicitudes recientes
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11.5px] uppercase tracking-wide">
              <th className="px-5 py-2.5 font-medium">Título</th>
              <th className="px-5 py-2.5 font-medium">Categoría</th>
              <th className="px-5 py-2.5 font-medium">Ciudad</th>
              <th className="px-5 py-2.5 font-medium">Cotizaciones</th>
              <th className="px-5 py-2.5 font-medium">Fecha límite</th>
              <th className="px-5 py-2.5 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {REQUESTS.map((r) => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors duration-150 cursor-pointer">
                <td className="px-5 py-3 text-gray-900 font-medium">{r.title}</td>
                <td className="px-5 py-3 text-gray-500">{r.cat}</td>
                <td className="px-5 py-3 text-gray-500 flex items-center gap-1"><MapPin size={12} />{r.city}</td>
                <td className="px-5 py-3 text-gray-500">{r.quotes}</td>
                <td className="px-5 py-3 text-gray-500">{r.deadline}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchingResult({ onReset }) {
  const [phase, setPhase] = useState("searching");
  React.useEffect(() => {
    const t = setTimeout(() => setPhase("done"), 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center text-center">
      {phase === "searching" ? (
        <>
          <div className="h-14 w-14 rounded-full bg-[#C9A227]/10 flex items-center justify-center mb-4 animate-pulse">
            <Radar size={22} className="text-[#C9A227]" />
          </div>
          <div className="text-[15px] font-medium text-gray-900">Buscando proveedores calificados…</div>
          <div className="text-[12.5px] text-gray-400 mt-1.5 max-w-xs">
            BidMe está evaluando categoría, cobertura, certificaciones e historial de cumplimiento.
          </div>
        </>
      ) : (
        <>
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Sparkles size={22} className="text-emerald-500" />
          </div>
          <div className="text-[15px] font-medium text-gray-900">Enviado a 5 proveedores calificados</div>
          <div className="text-[12.5px] text-gray-400 mt-1.5 max-w-sm">
            BidMe seleccionó automáticamente a los proveedores con mejor puntuación para esta categoría y ciudad. Te avisaremos cuando respondan.
          </div>
          <button onClick={onReset} className="mt-5 text-[12.5px] font-medium text-[#C9A227] border border-[#C9A227]/30 rounded-lg px-3.5 py-1.5 hover:bg-[#C9A227]/5">
            Ver solicitud en el dashboard
          </button>
        </>
      )}
    </div>
  );
}

function NewRequestWizard() {
  const [step, setStep] = useState(1);
  const [published, setPublished] = useState(false);
  const steps = ["Información", "Detalles", "Revisión"];

  if (published) {
    return (
      <div className="px-8 py-6 max-w-3xl">
        <MatchingResult onReset={() => { setPublished(false); setStep(1); }} />
      </div>
    );
  }

  return (
    <div className="px-8 py-6 max-w-3xl">
      <div className="flex items-center mb-8">
        {steps.map((s, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors duration-150 ${
                  done ? "bg-[#C9A227] text-[#0F1B2E]" : active ? "border-2 border-[#C9A227] text-[#C9A227]" : "border border-gray-300 text-gray-400"
                }`}>
                  {done ? <Check size={12} /> : n}
                </div>
                <span className={`text-[12.5px] ${active ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className="w-10 h-px bg-gray-200 mx-3" />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-[12.5px] font-medium text-gray-700">Título de la solicitud</label>
              <input className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]" placeholder="Ej. Implementación de SAP Business One" />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-gray-700">Descripción</label>
              <textarea rows={3} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]" placeholder="Describe el alcance de lo que necesitas cotizar" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12.5px] font-medium text-gray-700">Categoría</label>
                <select className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] bg-white">
                  <option>Tecnología</option>
                  <option>SAP</option>
                  <option>Ciberseguridad</option>
                  <option>Construcción</option>
                </select>
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-gray-700">Ciudad</label>
                <input className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="Guatemala City" />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12.5px] font-medium text-gray-700 flex items-center gap-1"><Calendar size={12} /> Fecha límite</label>
                <input type="date" className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" />
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-gray-700">Presupuesto (opcional)</label>
                <input className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="$ 40,000" />
              </div>
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-gray-700">Requisitos</label>
              <textarea rows={2} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px]" placeholder="Certificaciones necesarias, experiencia mínima, etc." />
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center text-gray-400">
              <Paperclip size={18} />
              <span className="text-[12.5px] mt-1">Arrastra archivos o haz clic para adjuntar</span>
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
                  <span key={c} className="text-[11px] bg-white border border-gray-200 text-gray-600 rounded-full px-2.5 py-1">{c}</span>
                ))}
              </div>
            </div>
            <p className="text-[11.5px] text-gray-400 flex items-center gap-1">
              <Lock size={11} /> Ningún proveedor invitado sabrá quiénes más fueron invitados.
            </p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="text-[13px] text-gray-500 disabled:opacity-30 px-3 py-1.5"
          >
            Atrás
          </button>
          <button
            onClick={() => (step === 3 ? setPublished(true) : setStep((s) => Math.min(3, s + 1)))}
            className="bg-[#C9A227] text-[#0F1B2E] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#B8911F] transition-colors duration-150 flex items-center gap-1"
          >
            {step === 3 ? "Publicar solicitud" : "Continuar"} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Compare() {
  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[13px] text-gray-400">Implementación SAP Business One</div>
          <div className="text-[12px] text-gray-400 flex items-center gap-1 mt-0.5">
            <Lock size={11} /> Cada proveedor ve únicamente su propia propuesta
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-[12.5px] border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
          <Download size={13} /> Exportar PDF
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11.5px] uppercase tracking-wide bg-gray-50/60">
              <th className="px-5 py-2.5 font-medium">Proveedor</th>
              <th className="px-5 py-2.5 font-medium">Precio</th>
              <th className="px-5 py-2.5 font-medium">Tiempo de entrega</th>
              <th className="px-5 py-2.5 font-medium">Garantía</th>
              <th className="px-5 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {PROPOSALS.map((p, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors duration-150">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${p.locked ? "text-gray-400 italic" : "text-gray-900"}`}>{p.supplier}</span>
                    {p.verified && !p.locked && <Check size={12} className="text-emerald-500" />}
                  </div>
                </td>
                <td className={`px-5 py-3 font-medium ${p.locked ? "text-gray-300 tracking-widest" : "text-gray-900"}`}>{p.price}</td>
                <td className={`px-5 py-3 ${p.locked ? "text-gray-300" : "text-gray-600"}`}>{p.time}</td>
                <td className={`px-5 py-3 ${p.locked ? "text-gray-300" : "text-gray-600"}`}>{p.warranty}</td>
                <td className="px-5 py-3">
                  {p.locked ? (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400"><Lock size={11} /> Otro proceso</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Star size={14} className={p.fav ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
                      <MessageSquare size={14} className="text-gray-400 hover:text-[#C9A227] cursor-pointer" />
                      <button className="text-[11.5px] font-medium text-[#C9A227] border border-[#C9A227]/30 rounded-md px-2.5 py-1 hover:bg-[#C9A227]/5">
                        Adjudicar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] text-gray-400 mt-3">
        La fila difuminada representa un proceso distinto de otro comprador — nunca podrás ver esa información; se incluye solo para ilustrar el principio de confidencialidad de BidMe.
      </p>
    </div>
  );
}

function Messages() {
  const threads = ["Nexus IT Solutions", "Vector Consulting", "Grupo Delta Servicios"];
  const [sel, setSel] = useState(0);
  return (
    <div className="flex h-[calc(100vh-70px)]">
      <div className="w-64 border-r border-gray-100 bg-white">
        {threads.map((t, i) => (
          <button
            key={t}
            onClick={() => setSel(i)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 text-[13px] transition-colors duration-150 ${sel === i ? "bg-[#C9A227]/5" : "hover:bg-gray-50"}`}
          >
            <div className="font-medium text-gray-800">{t}</div>
            <div className="text-[11.5px] text-gray-400 mt-0.5">RFQ: SAP Business One</div>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-100 text-[13px] font-medium text-gray-800">
          {threads[sel]}
        </div>
        <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
          <div className="max-w-sm bg-gray-100 rounded-xl rounded-tl-sm px-3.5 py-2 text-[13px] text-gray-700">
            Gracias por la propuesta. ¿El tiempo de entrega incluye capacitación al equipo?
          </div>
          <div className="max-w-sm bg-[#C9A227] text-[#0F1B2E] rounded-xl rounded-tr-sm px-3.5 py-2 text-[13px] ml-auto">
            Sí, incluye 2 semanas de acompañamiento post-implementación.
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
          <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px]" placeholder="Escribe un mensaje privado…" />
          <button className="bg-[#C9A227] text-[#0F1B2E] text-[12.5px] font-medium px-3.5 py-2 rounded-lg">Enviar</button>
        </div>
        <div className="px-5 pb-2 text-[10.5px] text-gray-400 flex items-center gap-1">
          <Lock size={10} /> Esta conversación es privada entre tu empresa y el proveedor
        </div>
      </div>
    </div>
  );
}

function Suppliers() {
  return (
    <div className="px-8 py-6">
      <p className="text-[12px] text-gray-400 mb-4 flex items-center gap-1">
        <Lock size={11} /> Historial de proveedores con los que ya trabajaste. Es solo lectura — BidMe decide automáticamente a quién invitar en cada solicitud.
      </p>
      <div className="grid grid-cols-3 gap-4">
      {["Nexus IT Solutions", "Vector Consulting", "Grupo Delta Servicios"].map((s) => (
        <div key={s} className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow duration-150">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[12px] text-gray-500 font-medium">{s[0]}</div>
            <div>
              <div className="text-[13.5px] font-medium text-gray-900">{s}</div>
              <div className="text-[11px] text-emerald-600 flex items-center gap-1"><Check size={10} /> Verificado</div>
            </div>
          </div>
          <div className="text-[12px] text-gray-500 space-y-1">
            <div>Categorías: Tecnología, SAP</div>
            <div>Cobertura: Guatemala, El Salvador</div>
            <div>8 años de experiencia</div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export default function BidMeMockup() {
  const [active, setActive] = useState("dashboard");

  const titles = {
    dashboard: "Dashboard",
    requests: "Nueva Solicitud",
    compare: "Comparador de Cotizaciones",
    messages: "Mensajería",
    suppliers: "Historial de Proveedores",
  };

  const action =
    active === "requests" ? null : (
      <button
        onClick={() => setActive("requests")}
        className="flex items-center gap-1.5 bg-[#C9A227] text-[#0F1B2E] text-[12.5px] font-medium px-3 py-1.5 rounded-lg hover:bg-[#B8911F] transition-colors duration-150"
      >
        <Plus size={14} /> Nueva Solicitud
      </button>
    );

  return (
    <div className="flex h-screen bg-[#FAFAF7] font-sans text-gray-900">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 overflow-y-auto">
        <TopBar title={titles[active]} action={action} />
        {active === "dashboard" && <Dashboard />}
        {active === "requests" && <NewRequestWizard />}
        {active === "compare" && <Compare />}
        {active === "messages" && <Messages />}
        {active === "suppliers" && <Suppliers />}
      </div>
    </div>
  );
}
