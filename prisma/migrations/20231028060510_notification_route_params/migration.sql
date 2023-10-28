-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "param" TEXT,
ALTER COLUMN "route" DROP NOT NULL;
