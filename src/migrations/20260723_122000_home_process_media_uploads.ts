import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-vercel-postgres'

const processTables = [
  'pages_blocks_home_process',
  '_pages_v_blocks_home_process',
  'landing_pages_blocks_home_process',
  '_landing_pages_v_blocks_home_process',
  'case_studies_blocks_home_process',
  '_case_studies_v_blocks_home_process',
  'products_blocks_home_process',
  '_products_v_blocks_home_process',
]

const processStepTables = processTables.map((table) => `${table}_steps`)

function addUploadColumn(table: string, column: string, relationTable: string) {
  const indexName = `${table}_${column.replace(/_id$/, '')}_idx`
  const constraintName = `${table}_${column}_${relationTable.replaceAll('-', '_')}_id_fk`

  return sql.raw(`
    DO $$
    BEGIN
      IF to_regclass('public.${table}') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" integer';

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'
        ) THEN
          EXECUTE 'ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${column}") REFERENCES "public"."${relationTable}"("id") ON DELETE set null ON UPDATE no action';
        END IF;

        EXECUTE 'CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" USING btree ("${column}")';
      END IF;
    END $$;
  `)
}

function dropUploadColumn(table: string, column: string, relationTable: string) {
  const indexName = `${table}_${column.replace(/_id$/, '')}_idx`
  const constraintName = `${table}_${column}_${relationTable.replaceAll('-', '_')}_id_fk`

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
  for (const table of processTables) {
    await db.execute(addUploadColumn(table, 'model3d_id', 'three_d_assets'))
  }

  for (const table of processStepTables) {
    await db.execute(addUploadColumn(table, 'infographic_image_id', 'media'))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of processStepTables) {
    await db.execute(dropUploadColumn(table, 'infographic_image_id', 'media'))
  }

  for (const table of processTables) {
    await db.execute(dropUploadColumn(table, 'model3d_id', 'three_d_assets'))
  }
}
