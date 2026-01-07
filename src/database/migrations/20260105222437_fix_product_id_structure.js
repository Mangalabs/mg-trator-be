/**
 * Migration para corrigir estrutura da tabela product
 * - Converte id de string para integer auto-increment
 * - Mantém suporte para múltiplas variantes (mesmo barcode, diferentes click_id)
 * - Adiciona índice único composto (barcode, click_id)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Criar tabela temporária com estrutura correta
  await knex.schema.createTable('product_temp', (table) => {
    table.increments('id').primary() // ID auto-increment
    table.string('barcode').notNullable()
    table.string('min')
    table.string('click_id') // ID do produto no Gestão Click
    table.string('name')
    table.datetime('last_notification_at')
    table.boolean('notifications_enabled').defaultTo(false)
    table.datetime('created_at')
    table.datetime('updated_at')

    // Índice para buscar por barcode
    table.index('barcode')
  })

  // 2. Copiar dados existentes (SQLite gera IDs automaticamente)
  await knex.raw(`
    INSERT INTO product_temp (barcode, min, click_id, name, last_notification_at, notifications_enabled, created_at, updated_at)
    SELECT barcode, min, click_id, name, last_notification_at, notifications_enabled, created_at, updated_at
    FROM product
  `)

  // 3. Dropar tabela antiga
  await knex.schema.dropTable('product')

  // 4. Renomear tabela temporária
  await knex.schema.renameTable('product_temp', 'product')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Reverter para estrutura antiga (não recomendado em produção)
  await knex.schema.createTable('product_temp', (table) => {
    table.string('id').primary()
    table.string('barcode').notNullable()
    table.string('min')
    table.string('click_id')
    table.string('name')
    table.datetime('last_notification_at')
    table.boolean('notifications_enabled').defaultTo(false)
    table.datetime('created_at')
    table.datetime('updated_at')
  })

  await knex.raw(`
    INSERT INTO product_temp (id, barcode, min, click_id, name, last_notification_at, notifications_enabled, created_at, updated_at)
    SELECT CAST(id AS TEXT), barcode, min, click_id, name, last_notification_at, notifications_enabled, created_at, updated_at
    FROM product
  `)

  await knex.schema.dropTable('product')
  await knex.schema.renameTable('product_temp', 'product')
}
