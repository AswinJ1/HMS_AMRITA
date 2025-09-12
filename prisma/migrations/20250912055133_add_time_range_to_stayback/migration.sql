/*
  Warnings:

  - You are about to drop the `StaybackRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."StaybackApproval" DROP CONSTRAINT "StaybackApproval_requestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StaybackRequest" DROP CONSTRAINT "StaybackRequest_studentId_fkey";

-- DropTable
DROP TABLE "public"."StaybackRequest";

-- CreateTable
CREATE TABLE "public"."stayback_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fromTime" TEXT NOT NULL,
    "toTime" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stayback_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."stayback_requests" ADD CONSTRAINT "stayback_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaybackApproval" ADD CONSTRAINT "StaybackApproval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."stayback_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
