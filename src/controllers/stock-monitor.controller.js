class StockMonitorController {
  constructor(stockMonitorService) {
    this.stockMonitorService = stockMonitorService
  }

  async checkStock(request, response) {
    try {
      const result = await this.stockMonitorService.checkAllProducts()

      return response.status(200).json({
        message: 'Verificação de estoque concluída',
        ...result,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erro ao verificar estoque',
        message: error.message,
      })
    }
  }

  async testNotification(request, response) {
    try {
      const { productId } = request.body

      if (!productId) {
        return response.status(400).json({
          error: 'productId é obrigatório',
        })
      }

      // Buscar produto
      const FirebaseMessaging = require('../firebase/messaging')
      const firebaseMessaging = new FirebaseMessaging()

      const topic = `product_${productId}`

      // Usando o método correto do Firebase Messaging
      const result = await firebaseMessaging.sendNotification(
        '🧪 Teste de Notificação',
        'Esta é uma notificação de teste do sistema MGTrator',
        topic
      )

      return response.status(200).json({
        message: 'Notificação de teste enviada com sucesso',
        topic,
        result,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erro ao enviar notificação de teste',
        message: error.message,
      })
    }
  }
}

module.exports = StockMonitorController
