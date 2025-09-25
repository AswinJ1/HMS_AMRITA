-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'SECURITY';

-- CreateTable
CREATE TABLE "public"."Security" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Security_userId_key" ON "public"."Security"("userId");

-- AddForeignKey
ALTER TABLE "public"."Security" ADD CONSTRAINT "Security_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
