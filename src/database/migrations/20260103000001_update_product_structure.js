/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('product', (table) => {
    table.string('click_id').nullable()
    table.string('name').nullable()
    table.index(['barcode', 'click_id'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('product', (table) => {
    table.dropIndex(['barcode', 'click_id'])
    table.dropColumn('name')
    table.dropColumn('click_id')
  })
}
