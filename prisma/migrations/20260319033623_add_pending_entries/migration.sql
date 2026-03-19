-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PENDING_ENTRY';
ALTER TYPE "NotificationType" ADD VALUE 'ENTRY_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'ENTRY_REJECTED';

-- CreateTable
CREATE TABLE "pending_entries" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "status" "PendingStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_entries_status_idx" ON "pending_entries"("status");

-- CreateIndex
CREATE INDEX "pending_entries_user_id_idx" ON "pending_entries"("user_id");

-- CreateIndex
CREATE INDEX "pending_entries_created_at_idx" ON "pending_entries"("created_at");

-- AddForeignKey
ALTER TABLE "pending_entries" ADD CONSTRAINT "pending_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_entries" ADD CONSTRAINT "pending_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_entries" ADD CONSTRAINT "pending_entries_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
