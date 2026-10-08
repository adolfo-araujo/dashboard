-- AlterTable
ALTER TABLE "User" ADD COLUMN "terms_accepted_at" TIMESTAMP(3),
ADD COLUMN "terms_version" VARCHAR(20);
