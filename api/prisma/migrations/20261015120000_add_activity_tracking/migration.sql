-- Data de criação das transações.
-- Para as que já existiam, usamos a própria data da transação como estimativa.
ALTER TABLE "Transaction" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Transaction" SET "created_at" = LEAST("date"::timestamp, CURRENT_TIMESTAMP::timestamp);
CREATE INDEX "Transaction_created_at_idx" ON "Transaction"("created_at");

-- Data de criação da conta e último acesso.
-- Para as contas que já existiam: data do aceite dos termos, ou da primeira transação.
ALTER TABLE "User" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "last_seen_at" TIMESTAMP(3);
UPDATE "User" u SET "created_at" = COALESCE(
    u."terms_accepted_at",
    (SELECT MIN(t."created_at") FROM "Transaction" t WHERE t."user_id" = u."id"),
    CURRENT_TIMESTAMP
);
