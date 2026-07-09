import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL || "BidMe <notificaciones@bidme.app>";

/**
 * Envoltorio de envío de correo.
 *
 * Si RESEND_API_KEY no está configurada (ej. en desarrollo local sin cuenta
 * de Resend todavía), esto NO lanza error — solo lo registra en consola.
 * Así el resto de la app (matching, propuestas, adjudicación) sigue
 * funcionando aunque el correo no esté conectado todavía.
 */
async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email no enviado — falta RESEND_API_KEY] Para: ${to} | Asunto: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    // Un fallo de correo nunca debe tumbar la operación de negocio que lo disparó.
    console.error("Error enviando correo:", err);
  }
}

const wrapper = (title: string, bodyHtml: string) => `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <div style="color: #C9A227; font-weight: 700; font-size: 15px; margin-bottom: 20px;">BidMe</div>
    <h2 style="color: #0F1B2E; font-size: 18px; margin-bottom: 12px;">${title}</h2>
    <div style="color: #333; font-size: 14px; line-height: 1.6;">${bodyHtml}</div>
    <p style="color: #9AA0AC; font-size: 11px; margin-top: 32px;">
      Esta es una notificación automática de BidMe — plataforma de licitaciones privadas.
    </p>
  </div>
`;

export async function notifyNewInvitation(opts: {
  supplierEmail: string;
  supplierOrgName: string;
  rfqTitle: string;
  rfqCategory: string;
  rfqCity: string;
  appUrl: string;
}) {
  const html = wrapper(
    "Tienes una nueva invitación a cotizar",
    `<p>Hola,</p>
     <p>BidMe identificó que <strong>${opts.supplierOrgName}</strong> es un buen candidato para participar en una solicitud de compra:</p>
     <p style="background:#FAFAF7; border-radius:8px; padding:12px 16px; margin:16px 0;">
       <strong>${opts.rfqTitle}</strong><br/>
       Categoría: ${opts.rfqCategory} · Ciudad: ${opts.rfqCity}
     </p>
     <p>Entra a tu cuenta para ver el detalle y decidir si participas.</p>
     <p><a href="${opts.appUrl}/supplier/invitations" style="color:#C9A227; font-weight:600;">Ver invitación →</a></p>`
  );
  await sendEmail(opts.supplierEmail, `Nueva invitación: ${opts.rfqTitle}`, html);
}

export async function notifyProposalReceived(opts: {
  buyerEmail: string;
  rfqTitle: string;
  supplierOrgName: string;
  rfqId: string;
  appUrl: string;
}) {
  const html = wrapper(
    "Recibiste una nueva cotización",
    `<p>Hola,</p>
     <p>Un proveedor envió una propuesta privada para tu solicitud:</p>
     <p style="background:#FAFAF7; border-radius:8px; padding:12px 16px; margin:16px 0;">
       <strong>${opts.rfqTitle}</strong>
     </p>
     <p>Entra al comparador para revisarla.</p>
     <p><a href="${opts.appUrl}/buyer/requests/${opts.rfqId}/compare" style="color:#C9A227; font-weight:600;">Ver comparador →</a></p>`
  );
  await sendEmail(opts.buyerEmail, `Nueva cotización recibida: ${opts.rfqTitle}`, html);
}

export async function notifyAwardWinner(opts: {
  supplierEmail: string;
  rfqTitle: string;
  appUrl: string;
}) {
  const html = wrapper(
    "¡Fuiste seleccionado!",
    `<p>Felicidades — tu propuesta fue seleccionada como ganadora para:</p>
     <p style="background:#FAFAF7; border-radius:8px; padding:12px 16px; margin:16px 0;">
       <strong>${opts.rfqTitle}</strong>
     </p>
     <p>El comprador se pondrá en contacto contigo para los siguientes pasos.</p>
     <p><a href="${opts.appUrl}/supplier/invitations" style="color:#C9A227; font-weight:600;">Ver detalle →</a></p>`
  );
  await sendEmail(opts.supplierEmail, `Fuiste seleccionado: ${opts.rfqTitle}`, html);
}

export async function notifyAwardNotWinner(opts: {
  supplierEmail: string;
  rfqTitle: string;
}) {
  const html = wrapper(
    "Este proceso ha finalizado",
    `<p>Hola,</p>
     <p>El proceso de cotización para <strong>${opts.rfqTitle}</strong> ha finalizado. En esta ocasión no fuiste seleccionado.</p>
     <p>Gracias por tu participación — seguirás recibiendo invitaciones automáticas cuando BidMe identifique una solicitud compatible con tu perfil.</p>`
  );
  await sendEmail(opts.supplierEmail, `Proceso finalizado: ${opts.rfqTitle}`, html);
}
