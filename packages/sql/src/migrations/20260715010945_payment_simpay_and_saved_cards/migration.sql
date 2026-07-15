-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "domId" TEXT;

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'pix',
ADD COLUMN     "pixContent" TEXT,
ADD COLUMN     "pixQrcode" TEXT,
ADD COLUMN     "simpayPaymentId" TEXT;

-- CreateTable
CREATE TABLE "saved_card" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cardToken" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "expiryMonth" TEXT NOT NULL,
    "expiryYear" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_card_customerId_idx" ON "saved_card"("customerId");

-- AddForeignKey
ALTER TABLE "saved_card" ADD CONSTRAINT "saved_card_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
