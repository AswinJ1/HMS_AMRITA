-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'STAFF', 'STUDENT', 'TEAM_LEAD', 'HOSTEL');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "uid" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "hostelName" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "isTeamLead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Hostel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamLead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaybackRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaybackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaybackApproval" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "staffId" TEXT,
    "hostelId" TEXT,
    "teamLeadId" TEXT,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaybackApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "public"."User"("uid");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_uid_idx" ON "public"."User"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "public"."Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "public"."Student"("userId");

-- CreateIndex
CREATE INDEX "Student_clubName_idx" ON "public"."Student"("clubName");

-- CreateIndex
CREATE INDEX "Student_hostelName_idx" ON "public"."Student"("hostelName");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "public"."Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_userId_key" ON "public"."Hostel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamLead_userId_key" ON "public"."TeamLead"("userId");

-- CreateIndex
CREATE INDEX "TeamLead_clubName_idx" ON "public"."TeamLead"("clubName");

-- CreateIndex
CREATE INDEX "StaybackRequest_studentId_idx" ON "public"."StaybackRequest"("studentId");

-- CreateIndex
CREATE INDEX "StaybackRequest_status_idx" ON "public"."StaybackRequest"("status");

-- CreateIndex
CREATE INDEX "StaybackRequest_date_idx" ON "public"."StaybackRequest"("date");

-- CreateIndex
CREATE INDEX "StaybackRequest_createdAt_idx" ON "public"."StaybackRequest"("createdAt");

-- CreateIndex
CREATE INDEX "StaybackApproval_requestId_idx" ON "public"."StaybackApproval"("requestId");

-- CreateIndex
CREATE INDEX "StaybackApproval_status_idx" ON "public"."StaybackApproval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StaybackApproval_requestId_staffId_key" ON "public"."StaybackApproval"("requestId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaybackApproval_requestId_hostelId_key" ON "public"."StaybackApproval"("requestId", "hostelId");

-- CreateIndex
CREATE UNIQUE INDEX "StaybackApproval_requestId_teamLeadId_key" ON "public"."StaybackApproval"("requestId", "teamLeadId");

-- AddForeignKey
ALTER TABLE "public"."Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Hostel" ADD CONSTRAINT "Hostel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamLead" ADD CONSTRAINT "TeamLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaybackRequest" ADD CONSTRAINT "StaybackRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaybackApproval" ADD CONSTRAINT "StaybackApproval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."StaybackRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaybackApproval" ADD CONSTRAINT "StaybackApproval_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaybackApproval" ADD CONSTRAINT "StaybackApproval_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "public"."Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaybackApproval" ADD CONSTRAINT "StaybackApproval_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "public"."TeamLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
