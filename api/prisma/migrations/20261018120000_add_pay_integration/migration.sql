-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "external_id" VARCHAR(80);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_user_id_external_id_key" ON "Transaction"("user_id", "external_id");

-- CreateTable
CREATE TABLE "PayIntegration" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "balance" DECIMAL(19,2),
    "balance_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayIntegration_user_id_key" ON "PayIntegration"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PayIntegration_token_hash_key" ON "PayIntegration"("token_hash");

-- AddForeignKey
ALTER TABLE "PayIntegration" ADD CONSTRAINT "PayIntegration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
