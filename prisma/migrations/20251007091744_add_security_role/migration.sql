-- AlterTable
ALTER TABLE "public"."StaybackApproval" ADD COLUMN     "securityCheckedAt" TIMESTAMP(3),
ADD COLUMN     "securityCheckedBy" TEXT,
ADD COLUMN     "securityStatus" TEXT;
