-- Assistente do Finance: memória do que a pessoa ensinou e conversa em andamento
CREATE TABLE "AssistenteMemoria" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tipo" VARCHAR(12) NOT NULL,
    "termo" VARCHAR(60) NOT NULL,
    "categoria" VARCHAR(30) NOT NULL,
    "usos" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistenteMemoria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistenteMemoria_user_id_tipo_termo_key" ON "AssistenteMemoria"("user_id", "tipo", "termo");

ALTER TABLE "AssistenteMemoria" ADD CONSTRAINT "AssistenteMemoria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssistentePendencia" (
    "user_id" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "estilo" JSONB,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistentePendencia_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "AssistentePendencia" ADD CONSTRAINT "AssistentePendencia_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
