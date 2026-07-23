import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "brochure_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_brochure_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_brochure_id_brochures_id_fk" FOREIGN KEY ("brochure_id") REFERENCES "public"."brochures"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brochure_id_brochures_id_fk" FOREIGN KEY ("version_brochure_id") REFERENCES "public"."brochures"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_brochure_idx" ON "products" USING btree ("brochure_id");
  CREATE INDEX "_products_v_version_version_brochure_idx" ON "_products_v" USING btree ("version_brochure_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_brochure_id_brochures_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_brochure_id_brochures_id_fk";
  
  DROP INDEX "products_brochure_idx";
  DROP INDEX "_products_v_version_version_brochure_idx";
  ALTER TABLE "products" DROP COLUMN "brochure_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_brochure_id";`)
}
