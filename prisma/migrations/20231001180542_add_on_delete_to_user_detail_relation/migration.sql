-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_userDetailId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userDetailId_fkey" FOREIGN KEY ("userDetailId") REFERENCES "UserDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
