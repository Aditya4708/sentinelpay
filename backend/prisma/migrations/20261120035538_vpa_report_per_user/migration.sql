-- CreateTable
CREATE TABLE "VpaReport" (
    "id" TEXT NOT NULL,
    "vpa" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VpaReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VpaReport_vpa_userId_key" ON "VpaReport"("vpa", "userId");
