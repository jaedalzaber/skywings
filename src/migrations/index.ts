import * as migration_20260722_121453 from './20260722_121453'
import * as migration_20260723_064021_product_single_brochure from './20260723_064021_product_single_brochure'
import * as migration_20260723_064515_brochure_page_count from './20260723_064515_brochure_page_count'
import * as migration_20260723_080531_home_services_block from './20260723_080531_home_services_block'
import * as migration_20260723_120000_product_card_thumbnail from './20260723_120000_product_card_thumbnail'
import * as migration_20260723_122000_home_process_media_uploads from './20260723_122000_home_process_media_uploads'
import * as migration_20260723_123000_home_hero_cover_media from './20260723_123000_home_hero_cover_media'
import * as migration_20260723_124000_home_process_appearance_controls from './20260723_124000_home_process_appearance_controls'

export const migrations = [
  {
    up: migration_20260722_121453.up,
    down: migration_20260722_121453.down,
    name: '20260722_121453',
  },
  {
    up: migration_20260723_064021_product_single_brochure.up,
    down: migration_20260723_064021_product_single_brochure.down,
    name: '20260723_064021_product_single_brochure',
  },
  {
    up: migration_20260723_064515_brochure_page_count.up,
    down: migration_20260723_064515_brochure_page_count.down,
    name: '20260723_064515_brochure_page_count',
  },
  {
    up: migration_20260723_080531_home_services_block.up,
    down: migration_20260723_080531_home_services_block.down,
    name: '20260723_080531_home_services_block',
  },
  {
    up: migration_20260723_120000_product_card_thumbnail.up,
    down: migration_20260723_120000_product_card_thumbnail.down,
    name: '20260723_120000_product_card_thumbnail',
  },
  {
    up: migration_20260723_122000_home_process_media_uploads.up,
    down: migration_20260723_122000_home_process_media_uploads.down,
    name: '20260723_122000_home_process_media_uploads',
  },
  {
    up: migration_20260723_123000_home_hero_cover_media.up,
    down: migration_20260723_123000_home_hero_cover_media.down,
    name: '20260723_123000_home_hero_cover_media',
  },
  {
    up: migration_20260723_124000_home_process_appearance_controls.up,
    down: migration_20260723_124000_home_process_appearance_controls.down,
    name: '20260723_124000_home_process_appearance_controls',
  },
]
