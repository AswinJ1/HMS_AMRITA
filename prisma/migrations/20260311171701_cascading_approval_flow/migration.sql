/*
  Warnings:

  - You are about to drop the column `securityCheckedAt` on the `StaybackApproval` table. All the data in the column will be lost.
  - You are about to drop the column `securityCheckedBy` on the `StaybackApproval` table. All the data in the column will be lost.
  - You are about to drop the column `securityStatus` on the `StaybackApproval` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ApprovalStage" AS ENUM ('TEAM_LEAD_PENDING', 'STAFF_PENDING', 'WARDEN_PENDING', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."StaybackApproval" DROP COLUMN "securityCheckedAt",
DROP COLUMN "securityCheckedBy",
DROP COLUMN "securityStatus";

-- AlterTable
ALTER TABLE "public"."stayback_requests" ADD COLUMN     "securityCheckedAt" TIMESTAMP(3),
ADD COLUMN     "securityCheckedBy" TEXT,
ADD COLUMN     "securityStatus" TEXT,
ADD COLUMN     "stage" "public"."ApprovalStage" NOT NULL DEFAULT 'TEAM_LEAD_PENDING',
ADD COLUMN     "teamLeadApplicantId" TEXT,
ALTER COLUMN "studentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."stayback_requests" ADD CONSTRAINT "stayback_requests_teamLeadApplicantId_fkey" FOREIGN KEY ("teamLeadApplicantId") REFERENCES "public"."TeamLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
