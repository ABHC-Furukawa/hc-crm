-- User 氏名を姓・名に分割（表示は苗字を使用）
ALTER TABLE "users" ADD COLUMN "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN "first_name" TEXT;

UPDATE "users"
SET
  "last_name" = CASE
    WHEN position(' ' IN trim("name")) > 0 THEN split_part(trim("name"), ' ', 1)
    ELSE trim("name")
  END,
  "first_name" = CASE
    WHEN position(' ' IN trim("name")) > 0 THEN NULLIF(trim(substring(trim("name") FROM position(' ' IN trim("name")) + 1)), '')
    ELSE NULL
  END;

UPDATE "users" SET "last_name" = "name" WHERE "last_name" IS NULL OR "last_name" = '';

ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;
