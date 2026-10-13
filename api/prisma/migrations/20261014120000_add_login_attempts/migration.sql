-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "ip" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_email_created_at_idx" ON "LoginAttempt"("email", "created_at");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_created_at_idx" ON "LoginAttempt"("ip", "created_at");
