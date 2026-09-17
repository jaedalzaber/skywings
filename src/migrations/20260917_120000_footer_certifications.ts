import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-vercel-postgres'

/*
 * Footer certifications: an array of badge images, each with an optional
 * certificate PDF, both stored in Media.
 *
 * Written to Payload's own naming for an array holding uploads, and
 * idempotent so it is safe where a development push already created it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql.raw(`
CREATE TABLE IF NOT EXISTS "footer_certifications" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar NOT NULL,
	"badge_id" integer,
	"certificate_id" integer
);

DO $$ BEGIN
  ALTER TABLE "footer_certifications" ADD CONSTRAINT "footer_certifications_badge_id_media_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "footer_certifications" ADD CONSTRAINT "footer_certifications_certificate_id_media_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "footer_certifications" ADD CONSTRAINT "footer_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "footer_certifications_order_idx" ON "footer_certifications" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "footer_certifications_parent_id_idx" ON "footer_certifications" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "footer_certifications_badge_idx" ON "footer_certifications" USING btree ("badge_id");
CREATE INDEX IF NOT EXISTS "footer_certifications_certificate_idx" ON "footer_certifications" USING btree ("certificate_id");
`),
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`DROP TABLE IF EXISTS "footer_certifications" CASCADE;`))
}
