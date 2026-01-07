require('dotenv').config()
const axios = require('axios')
const connection = require('./src/database/connection')

const CLICK_API_URL = process.env.CLICK_API_URL
const CLICK_API_ACCESS_TOKEN = process.env.CLICK_API_ACCESS_TOKEN
const CLICK_API_SECRET_TOKEN = process.env.CLICK_API_PRIVATE_TOKEN

console.log('🔄 SINCRONIZANDO PRODUTOS DA GESTÃO CLICK')
console.log('==========================================\n')

async function syncProducts() {
  if (!CLICK_API_ACCESS_TOKEN || !CLICK_API_SECRET_TOKEN) {
    console.error('❌ Tokens da API Click não configurados no .env')
    process.exit(1)
  }

  try {
    console.log('📦 Buscando produtos da Gestão Click...')

    const response = await axios.get(`${CLICK_API_URL}/produtos`, {
      headers: {
        'access-token': CLICK_API_ACCESS_TOKEN,
        'secret-access-token': CLICK_API_SECRET_TOKEN,
      },
      timeout: 10000,
    })

    if (!response.data?.data || !Array.isArray(response.data.data)) {
      console.log('⚠️ Resposta inesperada da API')
      return
    }

    const products = response.data.data
    console.log(`✅ ${products.length} produtos encontrados na API\n`)

    // Filtrar apenas produtos ativos com estoque definido
    const activeProducts = products.filter(
      (p) => p.ativo === '1' && p.estoque !== null
    )
    console.log(`📊 ${activeProducts.length} produtos ativos\n`)

    console.log('💾 Salvando no banco de dados local...\n')

    let added = 0
    let updated = 0
    let skipped = 0

    for (const product of activeProducts) {
      try {
        // Usar código interno como identificador
        const codigo =
          product.codigo_interno || product.codigo_barra || product.id

        // Verificar se já existe
        const exists = await connection('product')
          .where('barcode', codigo)
          .first()

        // Definir estoque mínimo padrão: 10% do estoque atual, mínimo 1
        const currentStock = parseInt(product.estoque, 10) || 0
        const minStock = Math.max(1, Math.floor(currentStock * 0.1))

        if (exists) {
          await connection('product').where('barcode', codigo).update({
            min: minStock,
          })
          updated++
          console.log(
            `✏️  Atualizado: ${product.nome} (${codigo}) - Min: ${minStock}`
          )
        } else {
          await connection('product').insert({
            barcode: codigo,
            min: minStock,
          })
          added++
          console.log(
            `✅ Adicionado: ${product.nome} (${codigo}) - Min: ${minStock}`
          )
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${product.nome}:`, error.message)
        skipped++
      }
    }

    console.log('\n==========================================')
    console.log('📊 RESUMO DA SINCRONIZAÇÃO:')
    console.log(`   ✅ Adicionados: ${added}`)
    console.log(`   ✏️  Atualizados: ${updated}`)
    console.log(`   ⏭️  Pulados: ${skipped}`)
    console.log('==========================================\n')

    console.log('🎉 Sincronização concluída!')
    console.log(
      '💡 O cron agora vai monitorar esses produtos e enviar notificações quando o estoque estiver baixo.'
    )
  } catch (error) {
    console.error('❌ Erro ao sincronizar produtos:', error.message)
  } finally {
    await connection.destroy()
  }
}

syncProducts()
