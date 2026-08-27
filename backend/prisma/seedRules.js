const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.fraudRule.createMany({
    data: [
      {
        name: "High Value Transaction",
        type: "AMOUNT_THRESHOLD",
        description: "Flags any transaction above ₹50,000",
        config: { maxAmount: 50000 },
        weight: 1.5,
        isEnabled: true,
      },
      {
        name: "Late Night Activity",
        type: "TIME_WINDOW",
        description: "Flags transactions between 12 AM and 5 AM",
        config: { startHour: 0, endHour: 5 },
        weight: 1.0,
        isEnabled: true,
      },
      {
        name: "Unknown Device",
        type: "NEW_DEVICE",
        description: "Flags transactions from a device not previously seen",
        config: {},
        weight: 1.2,
        isEnabled: true,
      },
      {
        name: "Rapid Transaction Velocity",
        type: "VELOCITY_CHECK",
        description: "Flags more than 3 transactions within the last hour",
        config: { maxTxnPerHour: 3 },
        weight: 1.3,
        isEnabled: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Rules seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());