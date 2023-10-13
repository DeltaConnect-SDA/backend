/*
  Warnings:

  - A unique constraint covering the columns `[ref_id]` on the table `Complaint` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `GPSaddress` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detail_location` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `long` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ref_id` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `village` to the `Complaint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "GPSaddress" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "detail_location" TEXT NOT NULL,
ADD COLUMN     "lat" TEXT NOT NULL,
ADD COLUMN     "long" TEXT NOT NULL,
ADD COLUMN     "ref_id" TEXT NOT NULL,
ADD COLUMN     "roleId" TEXT,
ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "total_feedback" INTEGER,
ADD COLUMN     "total_score" INTEGER,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "village" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Status" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintActivity" (
    "id" SERIAL NOT NULL,
    "statusId" INTEGER NOT NULL,
    "complaintId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "descripiton" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintActivityImages" (
    "id" SERIAL NOT NULL,
    "complaintActivityId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintActivityImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Priority" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Priority_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_ref_id_key" ON "Complaint"("ref_id");

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintActivity" ADD CONSTRAINT "ComplaintActivity_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintActivity" ADD CONSTRAINT "ComplaintActivity_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintActivityImages" ADD CONSTRAINT "ComplaintActivityImages_complaintActivityId_fkey" FOREIGN KEY ("complaintActivityId") REFERENCES "ComplaintActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
