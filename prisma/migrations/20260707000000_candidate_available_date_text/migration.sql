-- Store availability as free text (e.g. "来週から可", "7/15〜")
ALTER TABLE "candidates" ALTER COLUMN "available_date" TYPE TEXT USING (
  CASE
    WHEN "available_date" IS NULL THEN NULL
    ELSE to_char("available_date", 'YYYY-MM-DD')
  END
);
