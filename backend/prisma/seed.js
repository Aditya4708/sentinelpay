const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Aditya Nambiar",
        email: "aditya@example.com",
        phone: "9800000001",
        passwordHash,
        role: Role.ADMIN,
        upiId: "aditya@okhdfcbank",
        preferredBank: "HDFC",
        preferredApp: "GPay",
      },
      {
        name: "Test User",
        email: "user1@example.com",
        phone: "9800000002",
        passwordHash,
        role: Role.USER,
        upiId: "user1@okicici",
        preferredBank: "ICICI",
        preferredApp: "PhonePe",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());