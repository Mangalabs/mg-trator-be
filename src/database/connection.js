const knex = require('knex')
const configuration = require('../../knexfile.js')

const environment = process.env.NODE_ENV || 'development'
const connection = knex(configuration[environment])

module.exports = connection
