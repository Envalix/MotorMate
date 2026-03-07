-- CreateIndex
CREATE INDEX "buy_records_user_id_idx" ON "buy_records"("user_id");

-- CreateIndex
CREATE INDEX "expenses_vehicle_id_idx" ON "expenses"("vehicle_id");

-- CreateIndex
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");

-- CreateIndex
CREATE INDEX "expenses_vehicle_id_date_idx" ON "expenses"("vehicle_id", "date");

-- CreateIndex
CREATE INDEX "sell_records_user_id_idx" ON "sell_records"("user_id");

-- CreateIndex
CREATE INDEX "vehicle_documents_vehicle_id_idx" ON "vehicle_documents"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_images_vehicle_id_idx" ON "vehicle_images"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");

-- CreateIndex
CREATE INDEX "vehicles_user_id_status_idx" ON "vehicles"("user_id", "status");
