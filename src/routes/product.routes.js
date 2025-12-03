const express = require("express");

class ProductRouter {
  constructor(productController) {
    this.product = express.Router();

    this.productController = productController;

    this.product.get("/", (request, response) => {
      this.productController.getAll(request, response);
    });

    this.product.get("/barcode", (request, response) => {
      this.productController.getByBarcode(request, response);
    });

    this.product.get("/id", (request, response) => {
      this.productController.getById(request, response);
    });

    this.product.post("/sync", (request, response) => {
      this.productController.syncProducts(request, response);
    });
  }

  getRoutes() {
    return this.product;
  }
}

module.exports = ProductRouter;
