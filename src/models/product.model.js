class ProductModel {
  constructor(connection) {
    this.connection = connection
  }

  async getAll() {
    return await this.connection('product').select('*')
  }

  async getByBarCode(barcode) {
    return await this.connection('product')
      .select('*')
      .where('barcode', barcode)
      .first()
  }

  async getByBarId(id) {
    return await this.connection('product').select('*').where('id', id).first()
  }

  async syncProducts(productList) {
    const operations = productList.map(async (product) => {
      const exists = await this.connection('product')
        .where('id', product.id)
        .first()

      if (exists) {
        return await this.connection('product').where('id', product.id).update({
          barcode: product.barcode,
          min: product.min,
        })
      } else {
        return await this.connection('product').insert({
          id: product.id,
          barcode: product.barcode,
          min: product.min,
        })
      }
    })

    return await Promise.all(operations)
  }

  async getProductsWithLowStock() {
    return await this.connection('product')
      .select('*')
      .whereNotNull('min')
      .andWhereRaw('CAST(min AS INTEGER) > 0')
  }

  async updateLastNotification(productId) {
    return await this.connection('product').where('id', productId).update({
      last_notification_at: this.connection.fn.now(),
    })
  }

  async create(barcode, min, clickId = null, name = null) {
    const [id] = await this.connection('product').insert({
      barcode,
      min,
      click_id: clickId,
      name,
      created_at: this.connection.fn.now(),
      updated_at: this.connection.fn.now(),
    })
    return id
  }

  async updateMinStock(barcode, min, clickId = null, name = null) {
    const updateData = {
      min,
      updated_at: this.connection.fn.now(),
    }

    if (clickId) {
      updateData.click_id = clickId
    }

    if (name) {
      updateData.name = name
    }

    const query = this.connection('product').where('barcode', barcode)

    if (clickId) {
      query.where('click_id', clickId)
    }

    return await query.update(updateData)
  }

  async delete(barcode, clickId = null) {
    const query = this.connection('product').where('barcode', barcode)

    if (clickId) {
      query.where('click_id', clickId)
    }

    return await query.delete()
  }

  async upsert(barcode, min, clickId = null, name = null) {
    let exists

    if (clickId) {
      exists = await this.connection('product')
        .where('barcode', barcode)
        .where('click_id', clickId)
        .first()
    } else {
      exists = await this.getByBarCode(barcode)
    }

    if (exists) {
      await this.updateMinStock(barcode, min, clickId, name)
      return {
        action: 'updated',
        product: clickId
          ? await this.connection('product')
              .where('barcode', barcode)
              .where('click_id', clickId)
              .first()
          : await this.getByBarCode(barcode),
      }
    } else {
      const id = await this.create(barcode, min, clickId, name)
      return { action: 'created', product: await this.getByBarId(id) }
    }
  }

  async toggleNotifications(productId, enabled) {
    return await this.connection('product').where('id', productId).update({
      notifications_enabled: enabled,
      updated_at: this.connection.fn.now(),
    })
  }
}

module.exports = ProductModel
