-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE');

-- AlterTable
ALTER TABLE "BehaviorProfile" ADD COLUMN     "homeLat" DOUBLE PRECISION,
ADD COLUMN     "homeLon" DOUBLE PRECISION,
ADD COLUMN     "knownDeviceIds" JSONB,
ADD COLUMN     "medianTransactionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "txnCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FraudFlag" ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "receiverVpa" TEXT;

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "target" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanLog_userId_idx" ON "ScanLog"("userId");

-- CreateIndex
CREATE INDEX "FraudFlag_reviewStatus_idx" ON "FraudFlag"("reviewStatus");

-- CreateIndex
CREATE INDEX "Transaction_receiverVpa_idx" ON "Transaction"("receiverVpa");
