/*
  Warnings:

  - Changed the type of `deviceType` on the `devices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'READ';

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "deviceType",
ADD COLUMN     "deviceType" TEXT NOT NULL;

-- DropEnum
DROP TYPE "DeviceType";
