class ProductController {
  constructor(productModel) {
    this.productModel = productModel;
  }

  async getAll(request, response) {
    try {
      const products = await this.productModel.getAll();

      return response.status(200).json({ products });
    } catch (error) {
      return response.status(500).json({
        error: "Failed to retrieve products",
        message: error.message,
      });
    }
  }

  async getByBarcode(request, response) {
    try {
      const { barcode } = request.query;

      if (!barcode) {
        return response.status(400).json({ error: "Barcode missing" });
      }

      const product = await this.productModel.getByBarCode();

      if (!product) {
        return response.status(404).json({ message: "Product not found" });
      }

      return response.status(200).json({ product });
    } catch (error) {
      return response.status(500).json({
        error: "Failed to retrieve product",
        message: error.message,
      });
    }
  }

  async getById(request, response) {
    try {
      const { id } = request.query;

      if (!id) {
        return response.status(400).json({ error: "id missing" });
      }

      const product = await this.productModel.getByBarId();

      if (!product) {
        return response.status(404).json({ message: "Product not found" });
      }

      return response.status(200).json({ product });
    } catch (error) {
      return response.status(500).json({
        error: "Failed to retrieve product",
        message: error.message,
      });
    }
  }

  async syncProducts(request, response) {
    try {
      await this.productModel.syncProducts();

      return response.status(200);
    } catch (error) {
      return response.status(500).json({
        error: "Failed to sync products",
        message: error.message,
      });
    }
  }
}

module.exports = ProductController;
