/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notification_history', (table) => {
    table.increments('id').primary()
    table.integer('product_id').unsigned().notNullable()
    table.string('level').notNullable() // 'CRÍTICO' ou 'BAIXO'
    table.integer('stock_at_notification').notNullable()
    table.integer('min_stock').notNullable()
    table.timestamp('sent_at').defaultTo(knex.fn.now())

    table
      .foreign('product_id')
      .references('id')
      .inTable('product')
      .onDelete('CASCADE')
    table.index('product_id')
    table.index('sent_at')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notification_history')
}
