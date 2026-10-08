-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "category" VARCHAR(30);

-- CreateIndex
CREATE INDEX "Transaction_user_id_date_idx" ON "Transaction"("user_id", "date");
