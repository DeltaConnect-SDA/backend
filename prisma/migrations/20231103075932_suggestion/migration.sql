-- CreateTable
CREATE TABLE "suggestions" (
    "id" SERIAL NOT NULL,
    "ref_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "priorityId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "total_feedback" INTEGER,
    "total_score" INTEGER,
    "statusId" INTEGER NOT NULL DEFAULT 1,
    "upVoteTotal" INTEGER NOT NULL DEFAULT 0,
    "downVoteTotal" INTEGER NOT NULL DEFAULT 0,
    "assignToId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionImages" (
    "id" SERIAL NOT NULL,
    "suggestionId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "placeholder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionActivity" (
    "id" SERIAL NOT NULL,
    "statusId" INTEGER NOT NULL,
    "suggestionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descripiton" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionActivityImages" (
    "id" SERIAL NOT NULL,
    "suggestionActivityId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "placeholder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionActivityImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionSaved" (
    "id" SERIAL NOT NULL,
    "suggestionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionSaved_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_feedbacks" (
    "id" SERIAL NOT NULL,
    "suggestionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackNote" TEXT NOT NULL,
    "feedackScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestion_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionVotes" (
    "id" SERIAL NOT NULL,
    "suggestionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "isUp" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionVotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionComments" (
    "id" SERIAL NOT NULL,
    "suggestionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionComments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suggestions_ref_id_key" ON "suggestions"("ref_id");

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_assignToId_fkey" FOREIGN KEY ("assignToId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionImages" ADD CONSTRAINT "SuggestionImages_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionActivity" ADD CONSTRAINT "SuggestionActivity_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionActivity" ADD CONSTRAINT "SuggestionActivity_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionActivity" ADD CONSTRAINT "SuggestionActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionActivityImages" ADD CONSTRAINT "SuggestionActivityImages_suggestionActivityId_fkey" FOREIGN KEY ("suggestionActivityId") REFERENCES "SuggestionActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSaved" ADD CONSTRAINT "SuggestionSaved_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSaved" ADD CONSTRAINT "SuggestionSaved_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_feedbacks" ADD CONSTRAINT "suggestion_feedbacks_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_feedbacks" ADD CONSTRAINT "suggestion_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionVotes" ADD CONSTRAINT "SuggestionVotes_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionVotes" ADD CONSTRAINT "SuggestionVotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionComments" ADD CONSTRAINT "SuggestionComments_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionComments" ADD CONSTRAINT "SuggestionComments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionComments" ADD CONSTRAINT "SuggestionComments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SuggestionComments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
