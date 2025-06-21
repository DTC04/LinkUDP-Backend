-- CreateIndex
CREATE INDEX "AvailabilityBlock_tutorId_start_time_end_time_idx" ON "AvailabilityBlock"("tutorId", "start_time", "end_time");
