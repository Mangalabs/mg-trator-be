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
}

module.exports = StockMonitorController
