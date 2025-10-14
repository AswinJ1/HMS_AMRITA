-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'male';
