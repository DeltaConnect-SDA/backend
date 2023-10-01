/*
  Warnings:

  - You are about to drop the column `userId` on the `UserDetail` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userDetailId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userDetailId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserDetail" DROP CONSTRAINT "UserDetail_userId_fkey";

-- DropIndex
DROP INDEX "UserDetail_userId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userDetailId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserDetail" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "User_userDetailId_key" ON "User"("userDetailId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userDetailId_fkey" FOREIGN KEY ("userDetailId") REFERENCES "UserDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
