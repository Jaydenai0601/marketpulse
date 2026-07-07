-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "sentimentLabel" TEXT NOT NULL,
    "newsCount" INTEGER NOT NULL,
    "bullCount" INTEGER NOT NULL,
    "bearCount" INTEGER NOT NULL,
    "neutralCount" INTEGER NOT NULL,
    "reportText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "label" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "intensity" TEXT NOT NULL,
    "sectors" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "TopEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_date_key" ON "DailyReport"("date");

-- CreateIndex
CREATE INDEX "Sector_reportId_idx" ON "Sector"("reportId");

-- CreateIndex
CREATE INDEX "TopEvent_reportId_idx" ON "TopEvent"("reportId");

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopEvent" ADD CONSTRAINT "TopEvent_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
