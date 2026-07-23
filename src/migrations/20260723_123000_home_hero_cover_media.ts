import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-vercel-postgres'

const heroTables = [
  'pages_blocks_home_hero',
  '_pages_v_blocks_home_hero',
  'landing_pages_blocks_home_hero',
  '_landing_pages_v_blocks_home_hero',
  'case_studies_blocks_home_hero',
  '_case_studies_v_blocks_home_hero',
  'products_blocks_home_hero',
  '_products_v_blocks_home_hero',
]

const coverTypeColumns = [
  'desktop_cover_type',
  'laptop_cover_type',
  'mobile_cover_type',
]

const mediaColumns = [
  'desktop_cover_image_id',
  'desktop_cover_video_id',
  'laptop_cover_image_id',
  'laptop_cover_video_id',
  'mobile_cover_image_id',
  'mobile_cover_video_id',
]

const tableKeys: Record<string, string> = {
  pages_blocks_home_hero: 'p_hh',
  _pages_v_blocks_home_hero: 'pv_hh',
  landing_pages_blocks_home_hero: 'lp_hh',
  _landing_pages_v_blocks_home_hero: 'lpv_hh',
  case_studies_blocks_home_hero: 'cs_hh',
  _case_studies_v_blocks_home_hero: 'csv_hh',
  products_blocks_home_hero: 'pr_hh',
  _products_v_blocks_home_hero: 'prv_hh',
}

const columnKeys: Record<string, string> = {
  desktop_cover_image_id: 'dci',
  desktop_cover_video_id: 'dcv',
  laptop_cover_image_id: 'lci',
  laptop_cover_video_id: 'lcv',
  mobile_cover_image_id: 'mci',
  mobile_cover_video_id: 'mcv',
}

function relationName(table: string, column: string, suffix: string) {
  return `hh_${tableKeys[table]}_${columnKeys[column]}_${suffix}`
}

function addTextColumn(table: string, column: string) {
  return sql.raw(`
    DO $$
    BEGIN
      IF to_regclass('public.${table}') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" varchar DEFAULT ''image''';
      END IF;
    END $$;
  `)
}

function dropTextColumn(table: string, column: string) {
  return sql.raw(`
    DO $$
    BEGIN
      IF to_regclass('public.${table}') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"';
      END IF;
    END $$;
  `)
}

function addUploadColumn(table: string, column: string) {
  const indexName = relationName(table, column, 'idx')
  const constraintName = relationName(table, column, 'media_fk')

  return sql.raw(`
    DO $$
    BEGIN
      IF to_regclass('public.${table}') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" integer';

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'
        ) THEN
          EXECUTE 'ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${column}") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action';
        END IF;

        EXECUTE 'CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" USING btree ("${column}")';
      END IF;
    END $$;
  `)
}

function dropUploadColumn(table: string, column: string) {
  const indexName = relationName(table, column, 'idx')
  const constraintName = relationName(table, column, 'media_fk')

  return sql.raw(`
    DO $$
    BEGIN
      IF to_regclass('public.${table}') IS NOT NULL THEN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'
        ) THEN
          EXECUTE 'ALTER TABLE "${table}" DROP CONSTRAINT "${constraintName}"';
        END IF;

        EXECUTE 'DROP INDEX IF EXISTS "${indexName}"';
        EXECUTE 'ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"';
      END IF;
    END $$;
  `)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of heroTables) {
    for (const column of coverTypeColumns) {
      await db.execute(addTextColumn(table, column))
    }

    for (const column of mediaColumns) {
      await db.execute(addUploadColumn(table, column))
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of heroTables) {
    for (const column of [...mediaColumns].reverse()) {
      await db.execute(dropUploadColumn(table, column))
    }

    for (const column of [...coverTypeColumns].reverse()) {
      await db.execute(dropTextColumn(table, column))
    }
  }
}
