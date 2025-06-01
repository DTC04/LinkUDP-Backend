/*
  Warnings:

  - A unique constraint covering the columns `[studentProfileId,courseId]` on the table `StudentInterest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TUTOR';

-- DropForeignKey
ALTER TABLE "StudentInterest" DROP CONSTRAINT "StudentInterest_courseId_fkey";

-- DropForeignKey
ALTER TABLE "StudentInterest" DROP CONSTRAINT "StudentInterest_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "TutorProfile" DROP CONSTRAINT "TutorProfile_userId_fkey";

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "cv_url" TEXT,
ADD COLUMN     "experience_details" TEXT,
ADD COLUMN     "tutoring_contact_email" TEXT,
ADD COLUMN     "tutoring_phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StudentInterest_studentProfileId_courseId_key" ON "StudentInterest"("studentProfileId", "courseId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInterest" ADD CONSTRAINT "StudentInterest_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInterest" ADD CONSTRAINT "StudentInterest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
