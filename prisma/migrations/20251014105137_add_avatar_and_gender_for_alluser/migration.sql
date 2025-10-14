-- AlterTable
ALTER TABLE "public"."Hostel" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'male';

-- AlterTable
ALTER TABLE "public"."Security" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'male';

-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'male';

-- AlterTable
ALTER TABLE "public"."TeamLead" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'male';
