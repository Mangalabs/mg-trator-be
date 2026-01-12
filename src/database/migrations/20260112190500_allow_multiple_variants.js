/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Remover constraint antiga de barcode único
  await knex.schema.raw(
    'ALTER TABLE product DROP CONSTRAINT IF EXISTS product_barcode_unique'
  )

  // Criar constraint composta de barcode + click_id
  await knex.schema.raw(
    'ALTER TABLE product ADD CONSTRAINT product_barcode_click_id_unique UNIQUE (barcode, click_id)'
  )
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Reverter: remover constraint composta
  await knex.schema.raw(
    'ALTER TABLE product DROP CONSTRAINT IF EXISTS product_barcode_click_id_unique'
  )

  // Re-criar constraint antiga
  await knex.schema.raw(
    'ALTER TABLE product ADD CONSTRAINT product_barcode_unique UNIQUE (barcode)'
  )
}
