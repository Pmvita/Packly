-- AlterTable
ALTER TABLE "CaptureSession" ADD COLUMN IF NOT EXISTS "ownerApiKey" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CaptureSession_ownerApiKey_startedAt_idx" ON "CaptureSession"("ownerApiKey", "startedAt");
