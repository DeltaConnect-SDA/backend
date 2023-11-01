/*
  Warnings:

  - Added the required column `statusId` to the `verification_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "verifiaction_logs" DROP CONSTRAINT "verifiaction_logs_statusId_fkey";

-- DropForeignKey
ALTER TABLE "verifiaction_logs" DROP CONSTRAINT "verifiaction_logs_verificationRequestId_fkey";

-- AlterTable
ALTER TABLE "verifiaction_logs" ALTER COLUMN "statusId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "verification_requests" ADD COLUMN     "statusId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifiaction_logs" ADD CONSTRAINT "verifiaction_logs_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifiaction_logs" ADD CONSTRAINT "verifiaction_logs_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
