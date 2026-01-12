/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('product', (table) => {
    // Remover constraint antiga de barcode único
    table.dropUnique('barcode', 'product_barcode_unique')

    // Criar constraint composta de barcode + click_id
    table.unique(['barcode', 'click_id'], {
      indexName: 'product_barcode_click_id_unique',
    })
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('product', (table) => {
    // Reverter: remover constraint composta
    table.dropUnique(['barcode', 'click_id'], 'product_barcode_click_id_unique')

    // Re-criar constraint antiga
    table.unique('barcode', {
      indexName: 'product_barcode_unique',
    })
  })
}
