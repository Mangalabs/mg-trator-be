const axios = require('axios')

class StockMonitorService {
  constructor(productModel, firebaseMessaging) {
    this.productModel = productModel
    this.firebaseMessaging = firebaseMessaging
  }

  async checkAllProducts() {
    console.log('🔍 Iniciando verificação de estoque...')

    const CLICK_API_URL = process.env.CLICK_API_URL
    const CLICK_API_ACCESS_TOKEN = process.env.CLICK_API_ACCESS_TOKEN
    const CLICK_API_SECRET_TOKEN = process.env.CLICK_API_PRIVATE_TOKEN

    if (!CLICK_API_ACCESS_TOKEN || !CLICK_API_SECRET_TOKEN) {
      console.error('❌ API Click não configurada')
      return {
        success: false,
        error: 'API Click não configurada',
      }
    }

    try {
      // Buscar apenas produtos com notificações ativadas
      const products =
        await this.productModel.getProductsWithNotificationsEnabled()
      console.log(`📦 ${products.length} produtos com notificações ativadas`)

      const results = {
        checked: 0,
        notifications_sent: 0,
        errors: 0,
        skipped: 0,
      }

      for (const product of products) {
        try {
          // Verificar se já notificou 2 vezes hoje
          const notificationsToday = await this.getNotificationsCountToday(
            product.id
          )

          if (notificationsToday >= 2) {
            console.log(
              `⏭️  Produto ${product.barcode} já foi notificado 2x hoje, pulando...`
            )
            results.skipped++
            continue
          }

          // Buscar dados atualizados da API Click
          const clickResponse = await axios.get(`${CLICK_API_URL}/produtos`, {
            params: {
              codigo: product.barcode,
            },
            headers: {
              'access-token': CLICK_API_ACCESS_TOKEN,
              'secret-access-token': CLICK_API_SECRET_TOKEN,
            },
            timeout: 10000,
          })

          if (
            !clickResponse.data?.data ||
            clickResponse.data.data.length === 0
          ) {
            console.log(
              `⚠️  Produto ${product.barcode} não encontrado na API Click`
            )
            results.errors++
            continue
          }

          // Buscar a variação específica ou a primeira
          let clickProduct

          if (product.click_id) {
            clickProduct = clickResponse.data.data.find(
              (p) => p.id.toString() === product.click_id.toString()
            )
          }

          if (!clickProduct) {
            clickProduct = clickResponse.data.data[0]
          }

          const currentStock = parseInt(clickProduct.estoque, 10) || 0
          const minStock = parseInt(product.min, 10) || 0

          results.checked++

          // Verificar se precisa notificar
          const needsNotification = this.shouldNotify(currentStock, minStock)

          if (needsNotification) {
            const level = this.getStockLevel(currentStock, minStock)
            await this.sendNotification(product, currentStock, minStock, level)

            // Atualizar timestamp da última notificação
            await this.productModel.updateLastNotification(product.id)

            results.notifications_sent++
            console.log(
              `🔔 Notificação enviada para produto ${product.barcode} (${level})`
            )
          } else {
            console.log(
              `✅ Produto ${product.barcode}: Estoque OK (${currentStock}/${minStock})`
            )
          }
        } catch (error) {
          console.error(
            `❌ Erro ao processar produto ${product.barcode}:`,
            error.message
          )
          results.errors++
        }
      }

      console.log('✅ Verificação concluída:', results)
      return {
        success: true,
        results,
      }
    } catch (error) {
      console.error('❌ Erro na verificação de estoque:', error.message)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  shouldNotify(currentStock, minStock) {
    // Notificar se estoque <= 80% do mínimo
    return currentStock <= minStock * 0.8
  }

  getStockLevel(currentStock, minStock) {
    if (currentStock <= minStock * 0.3) {
      return 'CRÍTICO'
    } else if (currentStock <= minStock * 0.8) {
      return 'BAIXO'
    }
    return 'NORMAL'
  }

  async getNotificationsCountToday(productId) {
    const connection = this.productModel.connection

    // Obter início e fim do dia atual
    const today = new Date()
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    )
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    )

    // Buscar produto
    const product = await connection('product').where('id', productId).first()

    if (!product || !product.last_notification_at) {
      return 0
    }

    const lastNotification = new Date(product.last_notification_at)

    // Se a última notificação foi hoje, contar quantas vezes foi notificado
    // Simplificação: assumir 1 notificação se foi hoje, 0 se não foi
    // Para rastreamento preciso, seria necessário uma tabela de histórico
    if (lastNotification >= startOfDay && lastNotification <= endOfDay) {
      // Por enquanto, vamos usar uma lógica simples:
      // Se notificou há menos de 12 horas, consideramos que já notificou 1x
      // Se notificou há menos de 1 hora, consideramos que já notificou 2x (limite máximo)
      const hoursSinceLastNotification =
        (Date.now() - lastNotification.getTime()) / (1000 * 60 * 60)

      if (hoursSinceLastNotification < 1) {
        return 2 // Evitar spam se notificou recentemente
      } else if (hoursSinceLastNotification < 12) {
        return 1 // Primeira notificação do dia
      }
    }

    return 0
  }

  async sendNotification(product, currentStock, minStock, level) {
    const emoji = level === 'CRÍTICO' ? '🔴' : '🟡'
    const title = `${emoji} Estoque ${level}`
    const body = `${
      product.name || product.barcode
    }\nEstoque: ${currentStock} unidades (mínimo: ${minStock})`

    const topic = `product_${product.id}`

    try {
      // Usando o método correto da classe FirebaseMessaging
      await this.firebaseMessaging.sendNotification(title, body, topic)

      console.log(`✅ Notificação enviada para tópico: ${topic}`)
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error.message)
      throw error
    }
  }
}

module.exports = StockMonitorService
