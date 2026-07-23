import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "landing_pages_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false
  );
  
  CREATE TABLE "landing_pages_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"block_name" varchar
  );
  
  CREATE TABLE "_landing_pages_v_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_landing_pages_v_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false
  );
  
  CREATE TABLE "case_studies_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "products_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false
  );
  
  CREATE TABLE "products_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"block_name" varchar
  );
  
  CREATE TABLE "_products_v_blocks_home_services_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"accent_title" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_blocks_home_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Our Services',
  	"heading" varchar DEFAULT 'What We Do',
  	"description" varchar DEFAULT 'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  	"secondary_description" varchar DEFAULT 'Our services cover every major stage of metal production under one roof.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_home_services_cards" ADD CONSTRAINT "pages_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_services_cards" ADD CONSTRAINT "pages_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_services" ADD CONSTRAINT "pages_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_services_cards" ADD CONSTRAINT "_pages_v_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_services_cards" ADD CONSTRAINT "_pages_v_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_services" ADD CONSTRAINT "_pages_v_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_blocks_home_services_cards" ADD CONSTRAINT "landing_pages_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages_blocks_home_services_cards" ADD CONSTRAINT "landing_pages_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_blocks_home_services" ADD CONSTRAINT "landing_pages_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landing_pages_v_blocks_home_services_cards" ADD CONSTRAINT "_landing_pages_v_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landing_pages_v_blocks_home_services_cards" ADD CONSTRAINT "_landing_pages_v_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_landing_pages_v_blocks_home_services" ADD CONSTRAINT "_landing_pages_v_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_home_services_cards" ADD CONSTRAINT "case_studies_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_home_services_cards" ADD CONSTRAINT "case_studies_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_home_services" ADD CONSTRAINT "case_studies_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_home_services_cards" ADD CONSTRAINT "_case_studies_v_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_home_services_cards" ADD CONSTRAINT "_case_studies_v_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_home_services" ADD CONSTRAINT "_case_studies_v_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_home_services_cards" ADD CONSTRAINT "products_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_blocks_home_services_cards" ADD CONSTRAINT "products_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_home_services" ADD CONSTRAINT "products_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_blocks_home_services_cards" ADD CONSTRAINT "_products_v_blocks_home_services_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_blocks_home_services_cards" ADD CONSTRAINT "_products_v_blocks_home_services_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_blocks_home_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_blocks_home_services" ADD CONSTRAINT "_products_v_blocks_home_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_home_services_cards_order_idx" ON "pages_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_services_cards_parent_id_idx" ON "pages_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_services_cards_image_idx" ON "pages_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_home_services_order_idx" ON "pages_blocks_home_services" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_services_parent_id_idx" ON "pages_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_services_path_idx" ON "pages_blocks_home_services" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_home_services_cards_order_idx" ON "_pages_v_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_services_cards_parent_id_idx" ON "_pages_v_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_services_cards_image_idx" ON "_pages_v_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_home_services_order_idx" ON "_pages_v_blocks_home_services" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_services_parent_id_idx" ON "_pages_v_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_services_path_idx" ON "_pages_v_blocks_home_services" USING btree ("_path");
  CREATE INDEX "landing_pages_blocks_home_services_cards_order_idx" ON "landing_pages_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "landing_pages_blocks_home_services_cards_parent_id_idx" ON "landing_pages_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "landing_pages_blocks_home_services_cards_image_idx" ON "landing_pages_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "landing_pages_blocks_home_services_order_idx" ON "landing_pages_blocks_home_services" USING btree ("_order");
  CREATE INDEX "landing_pages_blocks_home_services_parent_id_idx" ON "landing_pages_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "landing_pages_blocks_home_services_path_idx" ON "landing_pages_blocks_home_services" USING btree ("_path");
  CREATE INDEX "_landing_pages_v_blocks_home_services_cards_order_idx" ON "_landing_pages_v_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "_landing_pages_v_blocks_home_services_cards_parent_id_idx" ON "_landing_pages_v_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "_landing_pages_v_blocks_home_services_cards_image_idx" ON "_landing_pages_v_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "_landing_pages_v_blocks_home_services_order_idx" ON "_landing_pages_v_blocks_home_services" USING btree ("_order");
  CREATE INDEX "_landing_pages_v_blocks_home_services_parent_id_idx" ON "_landing_pages_v_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "_landing_pages_v_blocks_home_services_path_idx" ON "_landing_pages_v_blocks_home_services" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_home_services_cards_order_idx" ON "case_studies_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_home_services_cards_parent_id_idx" ON "case_studies_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_home_services_cards_image_idx" ON "case_studies_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "case_studies_blocks_home_services_order_idx" ON "case_studies_blocks_home_services" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_home_services_parent_id_idx" ON "case_studies_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_home_services_path_idx" ON "case_studies_blocks_home_services" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_home_services_cards_order_idx" ON "_case_studies_v_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_home_services_cards_parent_id_idx" ON "_case_studies_v_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_home_services_cards_image_idx" ON "_case_studies_v_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "_case_studies_v_blocks_home_services_order_idx" ON "_case_studies_v_blocks_home_services" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_home_services_parent_id_idx" ON "_case_studies_v_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_home_services_path_idx" ON "_case_studies_v_blocks_home_services" USING btree ("_path");
  CREATE INDEX "products_blocks_home_services_cards_order_idx" ON "products_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "products_blocks_home_services_cards_parent_id_idx" ON "products_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_home_services_cards_image_idx" ON "products_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "products_blocks_home_services_order_idx" ON "products_blocks_home_services" USING btree ("_order");
  CREATE INDEX "products_blocks_home_services_parent_id_idx" ON "products_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_home_services_path_idx" ON "products_blocks_home_services" USING btree ("_path");
  CREATE INDEX "_products_v_blocks_home_services_cards_order_idx" ON "_products_v_blocks_home_services_cards" USING btree ("_order");
  CREATE INDEX "_products_v_blocks_home_services_cards_parent_id_idx" ON "_products_v_blocks_home_services_cards" USING btree ("_parent_id");
  CREATE INDEX "_products_v_blocks_home_services_cards_image_idx" ON "_products_v_blocks_home_services_cards" USING btree ("image_id");
  CREATE INDEX "_products_v_blocks_home_services_order_idx" ON "_products_v_blocks_home_services" USING btree ("_order");
  CREATE INDEX "_products_v_blocks_home_services_parent_id_idx" ON "_products_v_blocks_home_services" USING btree ("_parent_id");
  CREATE INDEX "_products_v_blocks_home_services_path_idx" ON "_products_v_blocks_home_services" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_home_services_cards" CASCADE;
  DROP TABLE "pages_blocks_home_services" CASCADE;
  DROP TABLE "_pages_v_blocks_home_services_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_home_services" CASCADE;
  DROP TABLE "landing_pages_blocks_home_services_cards" CASCADE;
  DROP TABLE "landing_pages_blocks_home_services" CASCADE;
  DROP TABLE "_landing_pages_v_blocks_home_services_cards" CASCADE;
  DROP TABLE "_landing_pages_v_blocks_home_services" CASCADE;
  DROP TABLE "case_studies_blocks_home_services_cards" CASCADE;
  DROP TABLE "case_studies_blocks_home_services" CASCADE;
  DROP TABLE "_case_studies_v_blocks_home_services_cards" CASCADE;
  DROP TABLE "_case_studies_v_blocks_home_services" CASCADE;
  DROP TABLE "products_blocks_home_services_cards" CASCADE;
  DROP TABLE "products_blocks_home_services" CASCADE;
  DROP TABLE "_products_v_blocks_home_services_cards" CASCADE;
  DROP TABLE "_products_v_blocks_home_services" CASCADE;`)
}
