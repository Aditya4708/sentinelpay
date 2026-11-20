-- CreateTable
CREATE TABLE "VpaReputation" (
    "id" TEXT NOT NULL,
    "vpa" TEXT NOT NULL,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "lastLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VpaReputation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VpaReputation_vpa_key" ON "VpaReputation"("vpa");
