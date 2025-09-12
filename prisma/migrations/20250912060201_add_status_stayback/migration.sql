-- AlterTable
ALTER TABLE "public"."stayback_requests" ADD COLUMN     "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING';
