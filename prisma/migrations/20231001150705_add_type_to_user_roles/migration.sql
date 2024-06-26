/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Role_type_key" ON "Role"("type");
