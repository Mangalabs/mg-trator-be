const express = require('express')

class ProductRouter {
  constructor(productController) {
    this.product = express.Router()

    this.productController = productController

    this.product.get('/', (request, response) => {
      this.productController.getAll(request, response)
    })

    this.product.get('/with-click-data', (request, response) => {
      this.productController.getWithClickData(request, response)
    })

    this.product.get('/statistics', (request, response) => {
      this.productController.getStatistics(request, response)
    })

    this.product.get('/variants', (request, response) => {
      this.productController.searchProductVariants(request, response)
    })

    this.product.get('/barcode', (request, response) => {
      this.productController.getByBarcode(request, response)
    })

    this.product.get('/id', (request, response) => {
      this.productController.getById(request, response)
    })

    this.product.post('/sync', (request, response) => {
      this.productController.syncProducts(request, response)
    })

    this.product.post('/', (request, response) => {
      this.productController.upsertProduct(request, response)
    })

    this.product.put('/:barcode/min', (request, response) => {
      this.productController.updateMinStock(request, response)
    })

    this.product.put('/:id/notifications', (request, response) => {
      this.productController.toggleNotifications(request, response)
    })

    this.product.patch('/:id/notifications', (request, response) => {
      this.productController.toggleNotifications(request, response)
    })

    this.product.delete('/:barcode', (request, response) => {
      this.productController.deleteProduct(request, response)
    })
  }

  getRoutes() {
    return this.product
  }
}

module.exports = ProductRouter
