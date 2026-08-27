-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('P2P', 'P2M', 'QR_PAYMENT', 'BILL_PAYMENT', 'RECHARGE', 'MERCHANT_PAYMENT', 'REFUND', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'BLOCKED', 'UNDER_REVIEW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "upiId" TEXT NOT NULL,
    "preferredBank" TEXT,
    "preferredApp" TEXT,
    "currentRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "txnRef" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "upiApp" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "merchantName" TEXT,
    "merchantCategory" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT,
    "state" TEXT,
    "deviceId" TEXT NOT NULL,
    "os" TEXT,
    "ipAddress" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "isFraudPredicted" BOOLEAN NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "modelConfidence" DOUBLE PRECISION NOT NULL,
    "topFactors" JSONB NOT NULL,
    "shapValues" JSONB,
    "humanReadableSummary" TEXT,
    "triggeredRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avgTransactionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyTxnCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklySpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlySpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "normalTxnHourStart" INTEGER,
    "normalTxnHourEnd" INTEGER,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehaviorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_upiId_key" ON "User"("upiId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_upiId_idx" ON "User"("upiId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txnRef_key" ON "Transaction"("txnRef");

-- CreateIndex
CREATE INDEX "Transaction_senderId_idx" ON "Transaction"("senderId");

-- CreateIndex
CREATE INDEX "Transaction_timestamp_idx" ON "Transaction"("timestamp");

-- CreateIndex
CREATE INDEX "Transaction_deviceId_idx" ON "Transaction"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FraudFlag_transactionId_key" ON "FraudFlag"("transactionId");

-- CreateIndex
CREATE INDEX "FraudFlag_riskScore_idx" ON "FraudFlag"("riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "BehaviorProfile_userId_key" ON "BehaviorProfile"("userId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorProfile" ADD CONSTRAINT "BehaviorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
