class ProductModel {
  constructor(connection) {
    this.connection = connection;
  }

  async getAll() {
    return await this.connection("product").select("*");
  }

  async getByBarCode(barcode) {
    return await this.connection("product")
      .select("*")
      .where("barcode", barcode)
      .first();
  }

  async getByBarId(id) {
    return await this.connection("product")
      .select("*")
      .where("id", id)
      .first();
  }

  async syncProducts(productList) {
    return await this.connection("product")
      .select("*")
      .where("id", id)
      .first();
  }
}

module.exports = ProductModel;