-- Lista de espera dos produtos em desenvolvimento (site www.valtrea.com.br)
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "product" VARCHAR(20) NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistEntry_token_hash_key" ON "WaitlistEntry"("token_hash");
CREATE UNIQUE INDEX "WaitlistEntry_email_product_key" ON "WaitlistEntry"("email", "product");
