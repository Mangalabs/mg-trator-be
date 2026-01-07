/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('product', (table) => {
    table.timestamp('created_at').nullable()
    table.timestamp('updated_at').nullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('product', (table) => {
    table.dropColumn('created_at')
    table.dropColumn('updated_at')
  })
}
