-- Contexto da conversa do assistente (resumo do último assunto, vence em 30 minutos)
ALTER TABLE "AssistentePendencia" ADD COLUMN "contexto" JSONB;
