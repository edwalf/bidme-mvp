# BidMe MVP — App funcional (auth real + UI conectada a la API)

App completa, navegable en el navegador — ya no es solo un mockup estático.
Incluye login/registro reales, y el flujo comprador/proveedor conectado a
PostgreSQL a través de Prisma. El archivo `bidme-mockup.jsx` de la entrega
anterior queda como referencia visual para pitch, pero esta app es la que
se prueba con datos reales.

---

## 1. Correrlo local (10 minutos)

### Requisitos
- Node.js 20+
- PostgreSQL (ver sección 3 para una gratis en Railway)

### Pasos

```bash
npm install
cp .env.example .env
# Edita .env: pega tu DATABASE_URL y genera un SESSION_SECRET
# (cualquier string largo y aleatorio sirve, ej: openssl rand -base64 32)

npx prisma migrate dev --name init
npm run seed
npm run dev
```

Abre http://localhost:3000 — te redirige a `/login`.

---

## 2. Probar el flujo completo en el navegador

**Cuenta de comprador de prueba** (creada por el seed):
- Correo: `eoliveros@ciatechnology.net`
- Contraseña: `password123`

**Cuentas de proveedor de prueba** (creadas por el seed, mismo password):
- `contacto@nexusitsolutions.com`
- `contacto@vectorconsulting.com`
- `contacto@cybershieldgt.com`
- `contacto@grupodeltaservicios.com`
- `contacto@andestech.com`

### Como comprador
1. Login con la cuenta de comprador.
2. "Nueva Solicitud" → llena los 3 pasos (categoría **SAP**, ciudad **Guatemala City**
   coincide con proveedores del seed) → "Publicar solicitud".
3. Verás la animación de matching y luego "Enviado a N proveedores calificados".
4. Vuelve al dashboard: la solicitud aparece con estado "Buscando proveedores"
   o "Activa".

### Como proveedor
1. Abre una ventana de incógnito (para no perder la sesión del comprador).
2. Login con `contacto@nexusitsolutions.com` / `password123`.
3. Ve a "Invitaciones" — si el matching lo seleccionó, verá la solicitud ahí.
4. Entra al detalle → "Participar" → llena precio/tiempo/garantía → "Enviar propuesta".

### De vuelta como comprador
1. Dashboard → click en "Ver comparador" en la solicitud.
2. Verás la propuesta del proveedor en la tabla comparativa.

Con esto validaste el ciclo completo con sesiones reales y aislamiento de datos:
un proveedor solo ve sus propias invitaciones; el comprador solo ve sus propios
RFQs y las propuestas que le corresponden.

---

## 3. Base de datos gratis en 2 minutos (Railway)

1. Crea cuenta en https://railway.app
2. "New Project" → "Provision PostgreSQL"
3. Click en la base de datos → tab "Connect" → copia la `DATABASE_URL`
4. Pégala en tu `.env` local

---

## 4. Desplegarlo para que otros lo prueben

### Vercel (app) + Railway (base de datos)

1. Sube este proyecto a un repo de GitHub
2. En https://vercel.com → "Import Project" → selecciona el repo
3. Variables de entorno en Vercel: `DATABASE_URL` (de Railway) y `SESSION_SECRET`
   (genera uno distinto al de desarrollo)
4. Deploy — Vercel te da una URL pública
5. Corre las migraciones y el seed contra producción una sola vez:
   ```bash
   DATABASE_URL="tu_url_de_railway" npx prisma migrate deploy
   DATABASE_URL="tu_url_de_railway" npm run seed
   ```

Con eso ya tienes una URL real (`https://tu-proyecto.vercel.app`) para compartir
con un proveedor o comprador piloto.

---

## 5. Qué cambió respecto a la versión anterior

- **Auth real**: cookies HTTP-only firmadas con JWT (`jose`), contraseñas
  hasheadas con `bcryptjs`. `middleware.ts` protege `/buyer/*` y `/supplier/*`
  y redirige según el tipo de organización.
- **Cada endpoint valida sesión y ownership**: un proveedor no puede responder
  la invitación de otro, ni un comprador ver el comparador de otra empresa
  (antes esto dependía de que el cliente enviara el `orgId` correcto).
- **UI real conectada**: el wizard de nueva solicitud, el dashboard, el
  comparador y las invitaciones ya no usan arrays hardcodeados — leen y
  escriben en PostgreSQL.

## 6. Qué falta antes de un piloto con clientes externos

- Verificación real de proveedores por un admin (hoy el registro marca
  `verified: false` para proveedores automáticamente, pero no hay panel de
  admin para aprobarlos — se puede cambiar manualmente en Prisma Studio
  mientras tanto).
- Notificaciones por correo al generarse una invitación (Resend, ~30 min de trabajo).
- Mensajería privada comprador↔proveedor (no incluida en este alcance).
- Adjudicación de ganador y cierre del RFQ.
- Rate limiting y protección CSRF adicional en los endpoints de auth.

## 7. Siguiente escalón (cuando ya validaste el flujo)

Migrar a la arquitectura completa del documento de especificación: backend
NestJS separado, Redis + BullMQ, S3, RLS en PostgreSQL. No es necesario para
probar el concepto — sí para producción con volumen real.

## 8. Branding y configuración SaaS

- El logo (`public/logo-full.png`, `public/icon-mark-square.png`) ya está integrado
  en el sidebar, login y registro, con fondo transparente para verse bien sobre
  el navy del sidebar.
- Favicons generados en todos los tamaños estándar (`favicon.ico`, `icon-32/48/192/512.png`,
  `apple-touch-icon.png`) y conectados en `app/layout.tsx` vía la API de `metadata` de Next.js.
- `public/site.webmanifest` habilita que la app sea instalable como PWA
  (ícono en el home screen, modo standalone) — típico de un SaaS moderno.
- Antes de producción, define `NEXT_PUBLIC_APP_URL` en tus variables de entorno
  con el dominio real (ej. `https://app.bidme.com`) para que el Open Graph y las
  metadatas resuelvan URLs absolutas correctamente.
- Si más adelante quieres el logo en SVG vectorial (mejor que PNG para escalar
  sin perder nitidez en pantallas grandes o impresión), pídemelo y lo vectorizo.

