const express = require('express')

class StockMonitorRouter {
  constructor(stockMonitorController) {
    this.router = express.Router()
    this.stockMonitorController = stockMonitorController

    this.router.post('/check', (request, response) => {
      this.stockMonitorController.checkStock(request, response)
    })
  }

  getRouter() {
    return this.router
  }
}

module.exports = StockMonitorRouter
