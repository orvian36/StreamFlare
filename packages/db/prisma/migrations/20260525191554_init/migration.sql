-- CreateTable
CREATE TABLE "user_netflix" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "country" TEXT NOT NULL,
    "credit_card" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "joined" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "max_profiles" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profile_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    CONSTRAINT "profile_email_fkey" FOREIGN KEY ("email") REFERENCES "user_netflix" ("email") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription" (
    "sub_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sub_type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATETIME NOT NULL,
    "bill" REAL NOT NULL DEFAULT 0,
    "total_bill" REAL NOT NULL DEFAULT 0,
    "running" INTEGER,
    "termination_date" DATETIME,
    CONSTRAINT "subscription_email_fkey" FOREIGN KEY ("email") REFERENCES "user_netflix" ("email") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription_type" (
    "sub_type" TEXT NOT NULL PRIMARY KEY,
    "bill" REAL NOT NULL,
    "num_profiles" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "movie" (
    "movie_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "country" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "image_url" TEXT,
    "video_url" TEXT,
    "length" REAL NOT NULL DEFAULT 0,
    "language" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "maturity_rating" TEXT,
    "release_date" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "show" (
    "show_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "country" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "image_url" TEXT,
    "video_url" TEXT,
    "length" REAL NOT NULL DEFAULT 0,
    "language" TEXT,
    "seasons" INTEGER NOT NULL DEFAULT 0,
    "episodes" INTEGER NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0,
    "maturity_rating" TEXT
);

-- CreateTable
CREATE TABLE "episode" (
    "season_no" INTEGER NOT NULL,
    "episode_no" INTEGER NOT NULL,
    "show_id" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "length" REAL,
    "image_url" TEXT,
    "video_url" TEXT,

    PRIMARY KEY ("season_no", "episode_no", "show_id"),
    CONSTRAINT "episode_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "show" ("show_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "celeb" (
    "celeb_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "contents" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "genre" (
    "genre_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "contents" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "movie_watch" (
    "movie_id" INTEGER NOT NULL,
    "profile_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rating" INTEGER,
    "watched_upto" REAL NOT NULL DEFAULT 0,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("movie_id", "email", "profile_id"),
    CONSTRAINT "movie_watch_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movie" ("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movie_watch_email_profile_id_fkey" FOREIGN KEY ("email", "profile_id") REFERENCES "profile" ("email", "profile_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movie_watchlist" (
    "movie_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,

    PRIMARY KEY ("movie_id", "email", "profile_id"),
    CONSTRAINT "movie_watchlist_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movie" ("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movie_watchlist_email_profile_id_fkey" FOREIGN KEY ("email", "profile_id") REFERENCES "profile" ("email", "profile_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movie_genre" (
    "movie_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    PRIMARY KEY ("movie_id", "genre_id"),
    CONSTRAINT "movie_genre_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movie" ("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movie_genre_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genre" ("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movie_celeb" (
    "movie_id" INTEGER NOT NULL,
    "celeb_id" INTEGER NOT NULL,
    "role" TEXT,

    PRIMARY KEY ("movie_id", "celeb_id"),
    CONSTRAINT "movie_celeb_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movie" ("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movie_celeb_celeb_id_fkey" FOREIGN KEY ("celeb_id") REFERENCES "celeb" ("celeb_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movie_similarity" (
    "movie_id1" INTEGER NOT NULL,
    "movie_id2" INTEGER NOT NULL,
    "score" REAL NOT NULL,

    PRIMARY KEY ("movie_id1", "movie_id2"),
    CONSTRAINT "movie_similarity_movie_id1_fkey" FOREIGN KEY ("movie_id1") REFERENCES "movie" ("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movie_similarity_movie_id2_fkey" FOREIGN KEY ("movie_id2") REFERENCES "movie" ("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "show_watch" (
    "profile_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "show_id" INTEGER NOT NULL,
    "rating" INTEGER,
    "status" TEXT,
    "watched_upto" REAL NOT NULL DEFAULT 0,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("profile_id", "show_id", "email"),
    CONSTRAINT "show_watch_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "show" ("show_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "show_watch_email_profile_id_fkey" FOREIGN KEY ("email", "profile_id") REFERENCES "profile" ("email", "profile_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "show_watchlist" (
    "profile_id" TEXT NOT NULL,
    "show_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    PRIMARY KEY ("show_id", "profile_id", "email"),
    CONSTRAINT "show_watchlist_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "show" ("show_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "show_watchlist_email_profile_id_fkey" FOREIGN KEY ("email", "profile_id") REFERENCES "profile" ("email", "profile_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "show_genre" (
    "show_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    PRIMARY KEY ("show_id", "genre_id"),
    CONSTRAINT "show_genre_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "show" ("show_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "show_genre_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genre" ("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "show_celeb" (
    "show_id" INTEGER NOT NULL,
    "celeb_id" INTEGER NOT NULL,
    "role" TEXT,

    PRIMARY KEY ("show_id", "celeb_id"),
    CONSTRAINT "show_celeb_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "show" ("show_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "show_celeb_celeb_id_fkey" FOREIGN KEY ("celeb_id") REFERENCES "celeb" ("celeb_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "show_similarity" (
    "show_id1" INTEGER NOT NULL,
    "show_id2" INTEGER NOT NULL,
    "score" REAL NOT NULL,

    PRIMARY KEY ("show_id1", "show_id2"),
    CONSTRAINT "show_similarity_show_id1_fkey" FOREIGN KEY ("show_id1") REFERENCES "show" ("show_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "show_similarity_show_id2_fkey" FOREIGN KEY ("show_id2") REFERENCES "show" ("show_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episode_watch" (
    "profile_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "season_no" INTEGER NOT NULL,
    "episode_no" INTEGER NOT NULL,
    "show_id" INTEGER NOT NULL,
    "status" TEXT,
    "watched_upto" REAL NOT NULL DEFAULT 0,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("profile_id", "season_no", "show_id", "episode_no", "email"),
    CONSTRAINT "episode_watch_season_no_episode_no_show_id_fkey" FOREIGN KEY ("season_no", "episode_no", "show_id") REFERENCES "episode" ("season_no", "episode_no", "show_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "episode_watch_email_profile_id_fkey" FOREIGN KEY ("email", "profile_id") REFERENCES "profile" ("email", "profile_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_email_profile_id_key" ON "profile"("email", "profile_id");
