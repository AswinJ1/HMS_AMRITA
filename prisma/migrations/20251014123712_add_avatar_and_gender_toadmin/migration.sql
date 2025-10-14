-- AlterTable
ALTER TABLE "public"."Admin" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'male';
