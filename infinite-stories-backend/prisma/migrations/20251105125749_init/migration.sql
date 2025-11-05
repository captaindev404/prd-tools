-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalStoriesGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalAudioGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalIllustrationsGenerated" INTEGER NOT NULL DEFAULT 0,
    "lastStoryGeneratedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hero" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "skinTone" TEXT,
    "height" TEXT,
    "traits" JSONB NOT NULL,
    "specialAbilities" JSONB,
    "avatarUrl" TEXT,
    "avatarPrompt" TEXT,
    "avatarGenerationId" TEXT,
    "visualProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroVisualProfile" (
    "id" TEXT NOT NULL,
    "heroId" TEXT NOT NULL,
    "hairStyle" TEXT,
    "hairColor" TEXT,
    "hairTexture" TEXT,
    "eyeColor" TEXT,
    "eyeShape" TEXT,
    "skinTone" TEXT,
    "facialFeatures" TEXT,
    "bodyType" TEXT,
    "height" TEXT,
    "age" INTEGER,
    "typicalClothing" TEXT,
    "colorPalette" JSONB,
    "accessories" TEXT,
    "artStyle" TEXT,
    "visualKeywords" JSONB,
    "canonicalPrompt" TEXT,
    "simplifiedPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroVisualProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "heroId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "eventType" TEXT,
    "customEventId" TEXT,
    "audioUrl" TEXT,
    "audioGenerationStatus" TEXT NOT NULL DEFAULT 'pending',
    "audioGenerationError" TEXT,
    "audioDuration" DOUBLE PRECISION,
    "illustrationStatus" TEXT NOT NULL DEFAULT 'none',
    "illustrationCount" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastPlayedAt" TIMESTAMP(3),
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "generationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryIllustration" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePrompt" TEXT NOT NULL,
    "sceneDescription" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "audioTimestamp" DOUBLE PRECISION NOT NULL,
    "audioDuration" DOUBLE PRECISION,
    "generationId" TEXT,
    "generationStatus" TEXT NOT NULL DEFAULT 'pending',
    "generationError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryIllustration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomStoryEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "promptSeed" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "ageRange" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'cheerful',
    "pictogramEmoji" TEXT,
    "pictogramSymbols" JSONB,
    "aiEnhanced" BOOLEAN NOT NULL DEFAULT false,
    "aiEnhancementMetadata" JSONB,
    "keywords" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomStoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "requestDuration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_visualProfileId_key" ON "Hero"("visualProfileId");

-- CreateIndex
CREATE INDEX "Hero_userId_idx" ON "Hero"("userId");

-- CreateIndex
CREATE INDEX "Hero_name_idx" ON "Hero"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HeroVisualProfile_heroId_key" ON "HeroVisualProfile"("heroId");

-- CreateIndex
CREATE INDEX "HeroVisualProfile_heroId_idx" ON "HeroVisualProfile"("heroId");

-- CreateIndex
CREATE INDEX "Story_heroId_idx" ON "Story"("heroId");

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Story_customEventId_idx" ON "Story"("customEventId");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- CreateIndex
CREATE INDEX "Story_isFavorite_idx" ON "Story"("isFavorite");

-- CreateIndex
CREATE INDEX "StoryIllustration_storyId_idx" ON "StoryIllustration"("storyId");

-- CreateIndex
CREATE INDEX "StoryIllustration_displayOrder_idx" ON "StoryIllustration"("displayOrder");

-- CreateIndex
CREATE INDEX "StoryIllustration_audioTimestamp_idx" ON "StoryIllustration"("audioTimestamp");

-- CreateIndex
CREATE INDEX "CustomStoryEvent_userId_idx" ON "CustomStoryEvent"("userId");

-- CreateIndex
CREATE INDEX "CustomStoryEvent_category_idx" ON "CustomStoryEvent"("category");

-- CreateIndex
CREATE INDEX "CustomStoryEvent_usageCount_idx" ON "CustomStoryEvent"("usageCount");

-- CreateIndex
CREATE INDEX "CustomStoryEvent_isFavorite_idx" ON "CustomStoryEvent"("isFavorite");

-- CreateIndex
CREATE INDEX "ApiUsage_userId_idx" ON "ApiUsage"("userId");

-- CreateIndex
CREATE INDEX "ApiUsage_operation_idx" ON "ApiUsage"("operation");

-- CreateIndex
CREATE INDEX "ApiUsage_createdAt_idx" ON "ApiUsage"("createdAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_type_idx" ON "BackgroundJob"("type");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_idx" ON "BackgroundJob"("status");

-- CreateIndex
CREATE INDEX "BackgroundJob_createdAt_idx" ON "BackgroundJob"("createdAt");

-- AddForeignKey
ALTER TABLE "Hero" ADD CONSTRAINT "Hero_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeroVisualProfile" ADD CONSTRAINT "HeroVisualProfile_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_customEventId_fkey" FOREIGN KEY ("customEventId") REFERENCES "CustomStoryEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryIllustration" ADD CONSTRAINT "StoryIllustration_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomStoryEvent" ADD CONSTRAINT "CustomStoryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
