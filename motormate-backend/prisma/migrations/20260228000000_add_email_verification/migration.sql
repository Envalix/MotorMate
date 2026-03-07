-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "email_verify_token" TEXT;
ALTER TABLE "users" ADD COLUMN "email_verify_expiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verify_token_key" ON "users"("email_verify_token");
