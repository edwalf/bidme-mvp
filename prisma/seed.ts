import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const buyerPasswordHash = await bcrypt.hash("password123", 10);

  const buyer = await prisma.organization.create({
    data: {
      name: "CIA Technology",
      type: "BUYER",
      city: "Guatemala City",
      categories: [],
      verified: true,
      users: {
        create: {
          email: "eoliveros@ciatechnology.net",
          name: "EO",
          passwordHash: buyerPasswordHash,
        },
      },
    },
  });

  const suppliers = [
    { name: "Nexus IT Solutions", city: "Guatemala City", categories: ["SAP", "Tecnología"], verified: true },
    { name: "Vector Consulting", city: "Guatemala City", categories: ["SAP"], verified: true },
    { name: "CyberShield GT", city: "San Salvador", categories: ["Ciberseguridad"], verified: true },
    { name: "Grupo Delta Servicios", city: "Guatemala City", categories: ["Transporte", "Mantenimiento"], verified: false },
    { name: "Andes Tech", city: "Ciudad de México", categories: ["SAP", "Tecnología"], verified: true },
  ];

  const supplierPasswordHash = await bcrypt.hash("password123", 10);

  for (const s of suppliers) {
    await prisma.organization.create({
      data: {
        ...s,
        type: "SUPPLIER",
        users: {
          create: {
            email: `contacto@${s.name.toLowerCase().replace(/\s+/g, "")}.com`,
            name: `Contacto ${s.name}`,
            passwordHash: supplierPasswordHash,
          },
        },
      },
    });
  }

  console.log("Seed listo. Buyer org:", buyer.id);
  console.log("Login de prueba comprador: eoliveros@ciatechnology.net / password123");
  console.log("Login de prueba proveedores: contacto@nexusitsolutions.com / password123 (y análogos)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
