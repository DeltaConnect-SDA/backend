/*
  Warnings:

  - Added the required column `placeholder` to the `ComplaintActivityImages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `placeholder` to the `ComplaintImages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComplaintActivityImages" ADD COLUMN     "placeholder" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ComplaintImages" ADD COLUMN     "placeholder" TEXT NOT NULL;
