/*
  Warnings:

  - Added the required column `userId` to the `ComplaintActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComplaintActivity" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ComplaintActivity" ADD CONSTRAINT "ComplaintActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
