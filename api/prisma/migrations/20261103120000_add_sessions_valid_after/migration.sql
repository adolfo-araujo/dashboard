-- Encerrar sessões em outros aparelhos ao trocar ou redefinir a senha
ALTER TABLE "User" ADD COLUMN "sessions_valid_after" TIMESTAMP(3);
