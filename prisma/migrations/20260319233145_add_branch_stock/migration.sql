-- CreateTable
CREATE TABLE "branch_stocks" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "branch_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branch_stocks_branch_id_idx" ON "branch_stocks"("branch_id");

-- CreateIndex
CREATE INDEX "branch_stocks_product_id_idx" ON "branch_stocks"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_stocks_branch_id_product_id_key" ON "branch_stocks"("branch_id", "product_id");

-- AddForeignKey
ALTER TABLE "branch_stocks" ADD CONSTRAINT "branch_stocks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_stocks" ADD CONSTRAINT "branch_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
