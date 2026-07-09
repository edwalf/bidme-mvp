import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Bootstrap de proveedores de demostración.
 *
 * Genera proveedores demo por categoría para que el Smart Matching sea
 * demostrable desde el primer día, sin haber cargado cientos de proveedores
 * reales. Los datos viven en la base de datos como cualquier proveedor real —
 * el algoritmo no distingue entre demo y real, así que reemplazarlos después
 * no requiere tocar la lógica del matching.
 *
 * Uso: npm run bootstrap
 * Es idempotente: si un proveedor demo ya existe (por email), lo salta.
 */

const prisma = new PrismaClient();

const DEPARTMENTS = ["Guatemala", "Sacatepéquez", "Quetzaltenango", "Escuintla"];
const CITIES = ["Guatemala City", "Antigua Guatemala", "Quetzaltenango", "Escuintla", "Mixco"];

const CATALOG: Record<string, { sub: string[]; names: string[] }> = {
  "Tecnología": {
    sub: ["Computadoras", "Redes", "Software", "Impresión"],
    names: ["TecnoSoluciones GT", "Grupo Innovatech", "Digital Partners", "CompuServicios Élite", "NetWorks Guatemala", "Sistemas Avanzados CA"],
  },
  "SAP": {
    sub: ["Implementación", "Soporte", "Licenciamiento"],
    names: ["SAP Consultores GT", "ERP Solutions", "Business One Partners", "Consultoría Empresarial B1"],
  },
  "Ciberseguridad": {
    sub: ["Perimetral", "Auditoría", "SOC"],
    names: ["SecureNet GT", "CyberDefense CA", "Escudo Digital", "InfoSec Guatemala"],
  },
  "Construcción": {
    sub: ["Obra civil", "Remodelación", "Eléctrica"],
    names: ["Constructora del Valle", "Grupo Edificar", "Obras y Proyectos GT", "Ingeniería Total"],
  },
  "Transporte": {
    sub: ["Carga", "Personal", "Última milla"],
    names: ["TransCarga Express", "Logística Maya", "Flotillas Unidas", "Rutas de Guatemala"],
  },
  "Mantenimiento": {
    sub: ["Industrial", "Edificios", "Aires acondicionados"],
    names: ["Mantenimientos Integrales", "ServiTotal GT", "Grupo Técnico CA"],
  },
  "Limpieza": {
    sub: ["Oficinas", "Industrial"],
    names: ["Limpieza Profesional GT", "CleanCorp", "Higiene Total"],
  },
  "Seguridad": {
    sub: ["Física", "Monitoreo", "Escoltas"],
    names: ["Seguridad Delta", "Protección Integral CA", "Guardianes GT"],
  },
};

// Generador determinista simple (mismos datos en cada corrida)
function pseudoRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  let created = 0;
  let skipped = 0;
  let seedCounter = 42;

  for (const [category, { sub, names }] of Object.entries(CATALOG)) {
    for (const name of names) {
      const rand = pseudoRandom(seedCounter++);
      const email = `demo@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.gt`;

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        skipped++;
        continue;
      }

      const city = CITIES[Math.floor(rand() * CITIES.length)];
      const national = rand() > 0.7;

      await prisma.organization.create({
        data: {
          name,
          type: "SUPPLIER",
          city,
          categories: [category],
          mainCategory: category,
          subCategory: sub[Math.floor(rand() * sub.length)],
          coverageCity: city,
          coverageDepartment: DEPARTMENTS[Math.floor(rand() * DEPARTMENTS.length)],
          coverageNational: national,
          isPremium: rand() > 0.75,
          verified: rand() > 0.3,
          active: true,
          rating: Math.round((3 + rand() * 2) * 10) / 10, // 3.0 - 5.0
          awardedContracts: Math.floor(rand() * 12),
          users: {
            create: { email, name: `Contacto ${name}`, passwordHash },
          },
        },
      });
      created++;
    }
  }

  console.log(`Bootstrap listo: ${created} proveedores demo creados, ${skipped} ya existían.`);
  console.log(`Login de cualquier proveedor demo: demo@<nombresinespacios>.gt / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
