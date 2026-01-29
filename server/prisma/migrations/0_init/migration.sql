-- CreateTable
CREATE TABLE "Paste" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "max_views" INTEGER,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paste_pkey" PRIMARY KEY ("id")
);
