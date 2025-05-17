/*
  Warnings:

  - A unique constraint covering the columns `[tutorId,courseId]` on the table `TutorCourse` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TutorCourse_tutorId_courseId_key" ON "TutorCourse"("tutorId", "courseId");
