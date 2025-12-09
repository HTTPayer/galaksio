-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'github',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserJob" (
    "id" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "brokerJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "txId" TEXT,
    "url" TEXT,
    "provider" TEXT,
    "size" INTEGER,
    "stdout" TEXT,
    "stderr" TEXT,
    "exitCode" INTEGER,
    "executionTimeMs" INTEGER,
    "rawResult" JSONB,
    "rawStatus" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_externalId_key" ON "UserAccount"("externalId");

-- CreateIndex
CREATE INDEX "UserJob_userAccountId_kind_createdAt_idx" ON "UserJob"("userAccountId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "UserJob_brokerJobId_idx" ON "UserJob"("brokerJobId");

-- AddForeignKey
ALTER TABLE "UserJob" ADD CONSTRAINT "UserJob_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
