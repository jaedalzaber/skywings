import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-vercel-postgres'

/*
 * Newsletter: the Subscribers and Newsletter Emails collections and the
 * Newsletter Settings global.
 *
 * Taken from Drizzle's own diff, filtered to these tables only, then made
 * idempotent (IF NOT EXISTS, duplicate_object guards) so it is safe on a
 * database where a development push already created them.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql.raw(`
DO $$ BEGIN
  CREATE TYPE "public"."enum_subscribers_topics" AS ENUM('articles', 'products', 'news');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_subscribers_status" AS ENUM('pending', 'active', 'unsubscribed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_newsletter_campaigns_topic" AS ENUM('articles', 'products', 'news');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_newsletter_campaigns_status" AS ENUM('draft', 'queued', 'sending', 'paused', 'sent', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "subscribers_topics" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "enum_subscribers_topics",
	"id" serial PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"status" "enum_subscribers_status" DEFAULT 'pending' NOT NULL,
	"source" varchar,
	"confirmed_at" timestamp(3) with time zone,
	"unsubscribed_at" timestamp(3) with time zone,
	"confirmation_sent_at" timestamp(3) with time zone,
	"token" varchar NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "newsletter_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar NOT NULL,
	"preheader" varchar,
	"topic" "enum_newsletter_campaigns_topic" DEFAULT 'news' NOT NULL,
	"heading" varchar,
	"image_id" integer,
	"body" varchar NOT NULL,
	"cta_label" varchar,
	"cta_url" varchar,
	"test_recipient" varchar,
	"status" "enum_newsletter_campaigns_status" DEFAULT 'draft' NOT NULL,
	"source_key" varchar,
	"sent_count" numeric DEFAULT 0,
	"failed_count" numeric DEFAULT 0,
	"queued_at" timestamp(3) with time zone,
	"finished_at" timestamp(3) with time zone,
	"last_error" varchar,
	"cursor" numeric DEFAULT 0,
	"locked_until" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "newsletter_campaigns_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"blog_posts_id" integer,
	"products_id" integer
);

CREATE TABLE IF NOT EXISTS "newsletter_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"auto_notify_articles" boolean DEFAULT true,
	"auto_notify_products" boolean DEFAULT true,
	"daily_limit" numeric DEFAULT 400 NOT NULL,
	"sent_today" numeric DEFAULT 0,
	"sent_today_date" varchar,
	"updated_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone
);

ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subscribers_id" integer;

ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "newsletter_campaigns_id" integer;

DO $$ BEGIN
  ALTER TABLE "subscribers_topics" ADD CONSTRAINT "subscribers_topics_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "newsletter_campaigns_rels" ADD CONSTRAINT "newsletter_campaigns_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "newsletter_campaigns_rels" ADD CONSTRAINT "newsletter_campaigns_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "newsletter_campaigns_rels" ADD CONSTRAINT "newsletter_campaigns_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "subscribers_topics_order_idx" ON "subscribers_topics" USING btree ("order");

CREATE INDEX IF NOT EXISTS "subscribers_topics_parent_idx" ON "subscribers_topics" USING btree ("parent_id");

CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_email_idx" ON "subscribers" USING btree ("email");

CREATE INDEX IF NOT EXISTS "subscribers_status_idx" ON "subscribers" USING btree ("status");

CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_token_idx" ON "subscribers" USING btree ("token");

CREATE INDEX IF NOT EXISTS "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");

CREATE INDEX IF NOT EXISTS "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_image_idx" ON "newsletter_campaigns" USING btree ("image_id");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_status_idx" ON "newsletter_campaigns" USING btree ("status");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_source_key_idx" ON "newsletter_campaigns" USING btree ("source_key");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_updated_at_idx" ON "newsletter_campaigns" USING btree ("updated_at");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_created_at_idx" ON "newsletter_campaigns" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_rels_order_idx" ON "newsletter_campaigns_rels" USING btree ("order");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_rels_parent_idx" ON "newsletter_campaigns_rels" USING btree ("parent_id");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_rels_path_idx" ON "newsletter_campaigns_rels" USING btree ("path");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_rels_blog_posts_id_idx" ON "newsletter_campaigns_rels" USING btree ("blog_posts_id");

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_rels_products_id_idx" ON "newsletter_campaigns_rels" USING btree ("products_id");

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_campaigns_fk" FOREIGN KEY ("newsletter_campaigns_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_newsletter_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_campaigns_id");
`),
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(
    sql.raw(`
ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_newsletter_campaigns_fk";
ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscribers_fk";
DROP INDEX IF EXISTS "payload_locked_documents_rels_newsletter_campaigns_id_idx";
DROP INDEX IF EXISTS "payload_locked_documents_rels_subscribers_id_idx";
ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "newsletter_campaigns_id";
ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subscribers_id";
DROP TABLE IF EXISTS "newsletter_campaigns_rels" CASCADE;
DROP TABLE IF EXISTS "newsletter_campaigns" CASCADE;
DROP TABLE IF EXISTS "subscribers_topics" CASCADE;
DROP TABLE IF EXISTS "subscribers" CASCADE;
DROP TABLE IF EXISTS "newsletter_settings" CASCADE;
DROP TYPE IF EXISTS "public"."enum_newsletter_campaigns_status";
DROP TYPE IF EXISTS "public"."enum_newsletter_campaigns_topic";
DROP TYPE IF EXISTS "public"."enum_subscribers_status";
DROP TYPE IF EXISTS "public"."enum_subscribers_topics";
`),
  )
}
