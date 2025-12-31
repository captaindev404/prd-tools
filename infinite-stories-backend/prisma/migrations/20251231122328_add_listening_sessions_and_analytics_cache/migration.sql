-- CreateTable
CREATE TABLE "ListeningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnalyticsCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalStoriesListened" INTEGER NOT NULL DEFAULT 0,
    "totalListeningTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastListeningDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnalyticsCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListeningSession_userId_idx" ON "ListeningSession"("userId");

-- CreateIndex
CREATE INDEX "ListeningSession_storyId_idx" ON "ListeningSession"("storyId");

-- CreateIndex
CREATE INDEX "ListeningSession_startedAt_idx" ON "ListeningSession"("startedAt");

-- CreateIndex
CREATE INDEX "ListeningSession_completed_idx" ON "ListeningSession"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "UserAnalyticsCache_userId_key" ON "UserAnalyticsCache"("userId");

-- CreateIndex
CREATE INDEX "UserAnalyticsCache_userId_idx" ON "UserAnalyticsCache"("userId");

-- CreateIndex
CREATE INDEX "UserAnalyticsCache_lastListeningDate_idx" ON "UserAnalyticsCache"("lastListeningDate");

-- Function to update analytics cache when a listening session is completed
CREATE OR REPLACE FUNCTION update_user_analytics_on_session_insert()
RETURNS TRIGGER AS $$
DECLARE
  session_date DATE;
  prev_date DATE;
  days_diff INT;
BEGIN
  -- Only process completed sessions with duration
  IF NEW.completed = true AND NEW.duration IS NOT NULL THEN
    -- Extract date from startedAt (ignoring time)
    session_date := DATE(NEW."startedAt");

    -- Get or create analytics cache for this user
    INSERT INTO "UserAnalyticsCache" ("id", "userId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, NEW."userId", NOW(), NOW())
    ON CONFLICT ("userId") DO NOTHING;

    -- Get previous listening date
    SELECT "lastListeningDate" INTO prev_date
    FROM "UserAnalyticsCache"
    WHERE "userId" = NEW."userId";

    -- Update analytics cache
    UPDATE "UserAnalyticsCache"
    SET
      "totalStoriesListened" = "totalStoriesListened" + 1,
      "totalListeningTimeSeconds" = "totalListeningTimeSeconds" + NEW.duration,
      "lastListeningDate" = session_date,
      -- Update streak logic
      "currentStreak" = CASE
        -- First listening session ever
        WHEN prev_date IS NULL THEN 1
        -- Same day (don't increment)
        WHEN prev_date = session_date THEN "currentStreak"
        -- Consecutive day (increment)
        WHEN prev_date = session_date - INTERVAL '1 day' THEN "currentStreak" + 1
        -- Streak broken (reset to 1)
        ELSE 1
      END,
      "longestStreak" = GREATEST(
        "longestStreak",
        CASE
          WHEN prev_date IS NULL THEN 1
          WHEN prev_date = session_date THEN "currentStreak"
          WHEN prev_date = session_date - INTERVAL '1 day' THEN "currentStreak" + 1
          ELSE 1
        END
      ),
      "updatedAt" = NOW()
    WHERE "userId" = NEW."userId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics cache after insert
CREATE TRIGGER trigger_update_analytics_on_session_insert
AFTER INSERT ON "ListeningSession"
FOR EACH ROW
EXECUTE FUNCTION update_user_analytics_on_session_insert();
