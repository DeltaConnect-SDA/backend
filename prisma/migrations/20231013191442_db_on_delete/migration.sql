/*
  Warnings:

  - You are about to drop the column `category` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `Complaint` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priorityId` to the `Complaint` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_userId_fkey";

-- DropForeignKey
ALTER TABLE "ComplaintActivity" DROP CONSTRAINT "ComplaintActivity_complaintId_fkey";

-- DropForeignKey
ALTER TABLE "ComplaintActivityImages" DROP CONSTRAINT "ComplaintActivityImages_complaintActivityId_fkey";

-- AlterTable
ALTER TABLE "Complaint" DROP COLUMN "category",
DROP COLUMN "roleId",
ADD COLUMN     "assignToId" TEXT,
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "priorityId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignToId_fkey" FOREIGN KEY ("assignToId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintActivity" ADD CONSTRAINT "ComplaintActivity_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintActivityImages" ADD CONSTRAINT "ComplaintActivityImages_complaintActivityId_fkey" FOREIGN KEY ("complaintActivityId") REFERENCES "ComplaintActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
