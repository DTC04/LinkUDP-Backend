/*
  Warnings:

  - Added the required column `status` to the `TutoringSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `TutoringSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'AVAILABLE';

-- AlterTable
ALTER TABLE "TutoringSession" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "BookingStatus" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "location" DROP NOT NULL;
