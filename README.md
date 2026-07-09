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
- Mensajería privada comprador↔proveedor (no incluida en este alcance).
- Rate limiting y protección CSRF adicional en los endpoints de auth.
- Adjuntos de archivos reales (requiere S3 — el campo existe pero no sube nada).
- Exportar PDF del comparador (el botón está pero no hace nada todavía).

## 6.1 Adjudicación de ganador (nuevo)

El comprador ahora puede elegir un ganador directamente desde el comparador
(`/buyer/requests/:id/compare`) — botón **Adjudicar** en la fila de cada
propuesta, con confirmación antes de ejecutar.

Al confirmar:
- El RFQ pasa a estado `CLOSED` (ya no se puede volver a adjudicar).
- La invitación ganadora queda marcada `WON`, todas las demás `LOST`.
- Se dispara un correo al ganador (felicitándolo) y uno a cada proveedor que
  no ganó ("el proceso finalizó, gracias por participar") — **sin revelar el
  precio ganador ni la identidad de los demás participantes**, consistente
  con la regla de confidencialidad del producto.
- El proveedor ve el resultado reflejado en `/supplier/invitations` con un
  badge "🏆 Ganaste" o "Proceso finalizado".

## 6.2 Notificaciones por correo (nuevo)

Implementado con [Resend](https://resend.com). Se envía correo automáticamente en tres momentos:

1. **Nueva invitación** — al proveedor, justo cuando el motor de matching lo selecciona (dentro de `runMatchingEngine`).
2. **Nueva propuesta recibida** — al comprador, cuando un proveedor envía su cotización.
3. **Resultado de adjudicación** — al ganador y a los no ganadores, cuando el comprador adjudica.

### Para activarlo

1. Crea cuenta gratis en [resend.com](https://resend.com)
2. Copia tu API key → variable de entorno `RESEND_API_KEY`
3. Para producción real necesitas verificar un dominio propio en Resend y
   usar `RESEND_FROM_EMAIL="BidMe <notificaciones@tudominio.com>"`. **Mientras
   no verifiques un dominio**, Resend en modo de prueba solo entrega correos
   a la dirección con la que creaste la cuenta — los demás destinatarios no
   recibirán nada aunque el log diga que se envió. Esto es una limitación de
   Resend, no un bug del código.
4. Si `RESEND_API_KEY` no está configurada, la app **no falla** — simplemente
   registra en consola qué correo habría enviado y a quién, útil para
   desarrollo local sin cuenta de Resend.

### Importante: nueva migración de base de datos

Estos cambios agregan un campo (`Invitation.result`) al schema. Antes de
desplegar, corre localmente (igual que la primera vez):

```bash
DATABASE_URL="tu_url_de_railway" npx prisma migrate dev --name add_award_and_notifications
```

Esto crea la migración **y** la aplica contra tu base de Railway en un solo
paso. Súbela a GitHub junto con el resto del código para que quede
documentada en el repo.

## 6.3 Smart Matching Engine (nuevo — corazón del producto)

El flujo de publicación ahora es: **crear RFQ → Smart Matching corre automáticamente → pantalla de resultados → "Invitar automáticamente"**.

### Qué hace
- Al publicar, calcula un **Match Score (0-100)** para cada proveedor activo, considerando: categoría (peso 35), subcategoría (15), cobertura geográfica ciudad > departamento > nacional (20), rating histórico (10), Premium (10), Verificado (10). Pesos configurables en `lib/matching.ts` (`WEIGHTS`).
- Clasifica en **coincidencia alta / media / baja** (umbrales en `TIERS`).
- Pantalla de resultados con tarjetas (no tablas), badges Premium/Verificado, filtros (Solo Premium, Solo Verificados, Ciudad, Departamento, Nacional, Score 80+), y preselección automática de coincidencias altas y medias.
- Botón **"Invitar automáticamente"**: crea las invitaciones (guardando `matchScore`, `matchReason` e `invitedAutomatically` en cada una), publica el RFQ y dispara los correos.
- Regla dura en base de datos: `@@unique([rfqId, supplierOrgId])` — imposible invitar dos veces al mismo proveedor para el mismo RFQ.
- El modelo ya tiene los campos de historial preparados (`responseRate`, `averageResponseHours`, `awardedContracts`, `rating`) — el cálculo automático llega en V2 sin cambiar el algoritmo.

### Arquitectura
Toda la lógica vive en `lib/matching.ts` con cuatro funciones limpias:
`calculateSupplierScore()` (puro, testeable) → `findBestSuppliers()` → `executeMatching()` → `createAutomaticInvitations()`. Los componentes React solo consumen resultados vía API.

### Pasos para aplicar estos cambios

1. **Nueva migración** (el schema cambió bastante):
   ```bash
   DATABASE_URL="tu_url_de_railway" npx prisma migrate dev --name smart_matching_engine
   ```
2. **Bootstrap de proveedores demo** — genera ~30 proveedores de demostración distribuidos por categoría, ciudad, con ratings y badges variados, para que el matching sea demostrable desde el primer día:
   ```bash
   DATABASE_URL="tu_url_de_railway" npm run bootstrap
   ```
   Es idempotente (si ya existen, los salta). Los proveedores demo son registros reales en la base — el algoritmo no distingue demo de real, así que al llegar proveedores reales no hay que tocar la lógica. Login de cualquier demo: `demo@<nombresinespacios>.gt` / `demo1234`.

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

