import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-vercel-postgres'
import { sql } from '@payloadcms/db-vercel-postgres/drizzle'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_lighting_presets_environment_source" AS ENUM('preset', 'hdri', 'none');
    CREATE TYPE "public"."enum_lighting_presets_environment_preset" AS ENUM('apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse');
    CREATE TYPE "public"."enum_lighting_presets_background_mode" AS ENUM('color', 'environment', 'transparent');
    CREATE TYPE "public"."enum_lighting_presets_renderer_tone_mapping" AS ENUM('none', 'linear', 'reinhard', 'cineon', 'aces-filmic', 'agx', 'neutral');
    CREATE TYPE "public"."enum_lighting_presets_renderer_shadow_map_type" AS ENUM('basic', 'percentage', 'soft', 'variance');

    CREATE TABLE "lighting_presets" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" varchar,
      "environment_source" "enum_lighting_presets_environment_source" DEFAULT 'preset' NOT NULL,
      "environment_preset" "enum_lighting_presets_environment_preset" DEFAULT 'studio',
      "environment_hdri_id" integer,
      "environment_intensity" numeric DEFAULT 1,
      "environment_rotation_x" numeric DEFAULT 0,
      "environment_rotation_y" numeric DEFAULT 0,
      "environment_rotation_z" numeric DEFAULT 0,
      "background_mode" "enum_lighting_presets_background_mode" DEFAULT 'color' NOT NULL,
      "background_color" varchar DEFAULT '#ffffff',
      "background_intensity" numeric DEFAULT 1,
      "background_blur" numeric DEFAULT 0,
      "lights_ambient_enabled" boolean DEFAULT true,
      "lights_ambient_intensity" numeric DEFAULT 1.4,
      "lights_ambient_color" varchar DEFAULT '#ffffff',
      "lights_hemisphere_enabled" boolean DEFAULT true,
      "lights_hemisphere_intensity" numeric DEFAULT 0.9,
      "lights_hemisphere_sky_color" varchar DEFAULT '#ffffff',
      "lights_hemisphere_ground_color" varchar DEFAULT '#d9dde4',
      "contact_shadows_enabled" boolean DEFAULT true,
      "contact_shadows_opacity" numeric DEFAULT 0.24,
      "contact_shadows_blur" numeric DEFAULT 2.4,
      "contact_shadows_color" varchar DEFAULT '#9da4af',
      "contact_shadows_far" numeric DEFAULT 4,
      "contact_shadows_scale" numeric DEFAULT 12,
      "contact_shadows_position_y" numeric DEFAULT -1.4,
      "renderer_tone_mapping" "enum_lighting_presets_renderer_tone_mapping" DEFAULT 'aces-filmic' NOT NULL,
      "renderer_exposure" numeric DEFAULT 1,
      "renderer_shadows" boolean DEFAULT true,
      "renderer_shadow_map_type" "enum_lighting_presets_renderer_shadow_map_type" DEFAULT 'soft',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "lighting_presets_lights_directional_lights" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "enabled" boolean DEFAULT true,
      "intensity" numeric DEFAULT 1,
      "color" varchar DEFAULT '#ffffff',
      "position_x" numeric DEFAULT 4,
      "position_y" numeric DEFAULT 6,
      "position_z" numeric DEFAULT 5,
      "cast_shadow" boolean DEFAULT false,
      "shadow_map_size" numeric DEFAULT 1024,
      "shadow_bias" numeric DEFAULT -0.0001
    );

    ALTER TABLE "three_d_assets" ADD COLUMN "lighting_preset_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lighting_presets_id" integer;

    ALTER TABLE "lighting_presets"
      ADD CONSTRAINT "lighting_presets_environment_hdri_id_media_id_fk"
      FOREIGN KEY ("environment_hdri_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "lighting_presets_lights_directional_lights"
      ADD CONSTRAINT "lighting_presets_lights_directional_lights_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."lighting_presets"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "three_d_assets"
      ADD CONSTRAINT "three_d_assets_lighting_preset_id_lighting_presets_id_fk"
      FOREIGN KEY ("lighting_preset_id") REFERENCES "public"."lighting_presets"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_lighting_presets_fk"
      FOREIGN KEY ("lighting_presets_id") REFERENCES "public"."lighting_presets"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "lighting_presets_slug_idx" ON "lighting_presets" USING btree ("slug");
    CREATE INDEX "lighting_presets_environment_environment_hdri_idx" ON "lighting_presets" USING btree ("environment_hdri_id");
    CREATE INDEX "lighting_presets_updated_at_idx" ON "lighting_presets" USING btree ("updated_at");
    CREATE INDEX "lighting_presets_created_at_idx" ON "lighting_presets" USING btree ("created_at");
    CREATE INDEX "lighting_presets_lights_directional_lights_order_idx" ON "lighting_presets_lights_directional_lights" USING btree ("_order");
    CREATE INDEX "lighting_presets_lights_directional_lights_parent_id_idx" ON "lighting_presets_lights_directional_lights" USING btree ("_parent_id");
    CREATE INDEX "three_d_assets_lighting_preset_idx" ON "three_d_assets" USING btree ("lighting_preset_id");
    CREATE INDEX "payload_locked_documents_rels_lighting_presets_id_idx" ON "payload_locked_documents_rels" USING btree ("lighting_presets_id");

    INSERT INTO "lighting_presets" (
      "title", "slug", "description", "lights_ambient_intensity", "renderer_tone_mapping"
    ) VALUES
      ('Studio', 'studio', 'Balanced studio lighting for product presentation.', 1.4, 'aces-filmic'),
      ('Workshop', 'workshop', 'Softer workshop lighting with broad fill.', 1.5, 'aces-filmic'),
      ('Outdoor', 'outdoor', 'Bright outdoor-style product lighting.', 1.6, 'aces-filmic'),
      ('Technical', 'technical', 'Neutral technical lighting for inspecting details.', 1.7, 'neutral');

    INSERT INTO "lighting_presets_lights_directional_lights" (
      "_order", "_parent_id", "id", "name", "enabled", "intensity", "color",
      "position_x", "position_y", "position_z", "cast_shadow", "shadow_map_size", "shadow_bias"
    )
    SELECT 1, id, slug || '-key', 'Key', true,
      CASE slug WHEN 'workshop' THEN 2.8 WHEN 'outdoor' THEN 3.4 WHEN 'technical' THEN 2.4 ELSE 3.2 END,
      '#ffffff', 4, 6, 5, true, 1024, -0.0001
    FROM "lighting_presets";

    INSERT INTO "lighting_presets_lights_directional_lights" (
      "_order", "_parent_id", "id", "name", "enabled", "intensity", "color",
      "position_x", "position_y", "position_z", "cast_shadow", "shadow_map_size", "shadow_bias"
    )
    SELECT 2, id, slug || '-fill', 'Fill', true,
      CASE slug WHEN 'workshop' THEN 1.5 WHEN 'outdoor' THEN 1.7 WHEN 'technical' THEN 1.6 ELSE 1.4 END,
      '#ffffff', -5, 3, -4, false, 1024, -0.0001
    FROM "lighting_presets";

    INSERT INTO "lighting_presets_lights_directional_lights" (
      "_order", "_parent_id", "id", "name", "enabled", "intensity", "color",
      "position_x", "position_y", "position_z", "cast_shadow", "shadow_map_size", "shadow_bias"
    )
    SELECT 3, id, slug || '-rim', 'Rim', true,
      CASE slug WHEN 'workshop' THEN 1 WHEN 'outdoor' THEN 0.9 WHEN 'technical' THEN 0.8 ELSE 1.2 END,
      '#e8f0ff', 0, 4, -6, false, 1024, -0.0001
    FROM "lighting_presets";

    UPDATE "three_d_assets" AS asset
    SET "lighting_preset_id" = preset.id
    FROM "lighting_presets" AS preset
    WHERE preset.slug = COALESCE(asset."lighting_preset"::text, 'studio');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "three_d_assets" AS asset
    SET "lighting_preset" = preset.slug::"enum_three_d_assets_lighting_preset"
    FROM "lighting_presets" AS preset
    WHERE asset."lighting_preset_id" = preset.id
      AND preset.slug IN ('studio', 'workshop', 'outdoor', 'technical');

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lighting_presets_fk";
    ALTER TABLE "three_d_assets" DROP CONSTRAINT IF EXISTS "three_d_assets_lighting_preset_id_lighting_presets_id_fk";
    ALTER TABLE "lighting_presets_lights_directional_lights" DROP CONSTRAINT IF EXISTS "lighting_presets_lights_directional_lights_parent_id_fk";
    ALTER TABLE "lighting_presets" DROP CONSTRAINT IF EXISTS "lighting_presets_environment_hdri_id_media_id_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_lighting_presets_id_idx";
    DROP INDEX IF EXISTS "three_d_assets_lighting_preset_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "lighting_presets_id";
    ALTER TABLE "three_d_assets" DROP COLUMN IF EXISTS "lighting_preset_id";

    DROP TABLE IF EXISTS "lighting_presets_lights_directional_lights" CASCADE;
    DROP TABLE IF EXISTS "lighting_presets" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_lighting_presets_environment_source";
    DROP TYPE IF EXISTS "public"."enum_lighting_presets_environment_preset";
    DROP TYPE IF EXISTS "public"."enum_lighting_presets_background_mode";
    DROP TYPE IF EXISTS "public"."enum_lighting_presets_renderer_tone_mapping";
    DROP TYPE IF EXISTS "public"."enum_lighting_presets_renderer_shadow_map_type";
  `)
}
