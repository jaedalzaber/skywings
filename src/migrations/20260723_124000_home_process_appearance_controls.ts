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

const appearanceColumns = [
  ['model_appearance_line_opacity', '0.3'],
  ['model_appearance_line_thickness', '0.65'],
  ['model_appearance_fade_start', '5.5'],
  ['model_appearance_fade_end', '12'],
] as const

function addNumberColumn(table: string, column: string, defaultValue: string) {
  return sql.raw(`
    DO $$
    BEGIN
      IF to_regclass('public.${table}') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" numeric DEFAULT ${defaultValue}';
      END IF;
    END $$;
  `)
}

function dropNumberColumn(table: string, column: string) {
  return sql.raw(`
    DO $$
    BEGIN
      IF to_regclass('public.${table}') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"';
      END IF;
    END $$;
  `)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of processTables) {
    for (const [column, defaultValue] of appearanceColumns) {
      await db.execute(addNumberColumn(table, column, defaultValue))
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of processTables) {
    for (const [column] of [...appearanceColumns].reverse()) {
      await db.execute(dropNumberColumn(table, column))
    }
  }
}
