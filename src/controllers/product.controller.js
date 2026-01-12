class ProductController {
  constructor(productModel) {
    this.productModel = productModel
  }

  async getAll(request, response) {
    try {
      const products = await this.productModel.getAll()

      return response.status(200).json({ products })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to retrieve products',
        message: error.message,
      })
    }
  }

  async getByBarcode(request, response) {
    try {
      const { barcode } = request.query

      if (!barcode) {
        return response.status(400).json({ error: 'Barcode missing' })
      }

      const product = await this.productModel.getByBarCode(barcode)

      if (!product) {
        return response.status(404).json({ message: 'Product not found' })
      }

      return response.status(200).json({ product })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to retrieve product',
        message: error.message,
      })
    }
  }

  async getById(request, response) {
    try {
      const { id } = request.query

      if (!id) {
        return response.status(400).json({ error: 'id missing' })
      }

      const product = await this.productModel.getByBarId(id)

      if (!product) {
        return response.status(404).json({ message: 'Product not found' })
      }

      return response.status(200).json({ product })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to retrieve product',
        message: error.message,
      })
    }
  }

  async syncProducts(request, response) {
    try {
      const { products } = request.body

      if (!products || !Array.isArray(products)) {
        return response.status(400).json({ error: 'Products array missing' })
      }

      await this.productModel.syncProducts(products)

      return response
        .status(200)
        .json({ message: 'Products synced successfully' })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to sync products',
        message: error.message,
      })
    }
  }

  async getWithClickData(request, response) {
    try {
      const axios = require('axios')

      const page = parseInt(request.query.page) || 1
      const limit = parseInt(request.query.limit) || 20
      const offset = (page - 1) * limit

      const allProducts = await this.productModel.getAll()
      const totalProducts = allProducts.length
      const totalPages = Math.ceil(totalProducts / limit)

      const products = allProducts.slice(offset, offset + limit)

      const CLICK_API_URL = process.env.CLICK_API_URL
      const CLICK_API_ACCESS_TOKEN = process.env.CLICK_API_ACCESS_TOKEN
      const CLICK_API_SECRET_TOKEN = process.env.CLICK_API_PRIVATE_TOKEN

      if (!CLICK_API_ACCESS_TOKEN || !CLICK_API_SECRET_TOKEN) {
        return response.status(500).json({
          error: 'API Click não configurada',
        })
      }

      const productsWithData = await Promise.all(
        products.map(async (product) => {
          try {
            const clickResponse = await axios.get(`${CLICK_API_URL}/produtos`, {
              params: {
                codigo: product.barcode,
              },
              headers: {
                'access-token': CLICK_API_ACCESS_TOKEN,
                'secret-access-token': CLICK_API_SECRET_TOKEN,
              },
              timeout: 5000,
            })

            if (
              clickResponse.data?.data &&
              clickResponse.data.data.length > 0
            ) {
              let clickProduct

              if (product.click_id) {
                clickProduct = clickResponse.data.data.find(
                  (p) => p.id.toString() === product.click_id.toString()
                )
              }

              if (!clickProduct) {
                clickProduct = clickResponse.data.data[0]
              }

              return {
                id: product.id,
                barcode: product.barcode,
                clickId: clickProduct.id,
                min: product.min,
                name: product.name || clickProduct.nome,
                currentStock: parseInt(clickProduct.estoque, 10) || 0,
                lastNotification: product.last_notification_at,
                notifications_enabled: Boolean(product.notifications_enabled),
              }
            }

            return {
              id: product.id,
              barcode: product.barcode,
              clickId: null,
              min: product.min,
              name: product.name || `Produto ${product.barcode}`,
              currentStock: 0,
              lastNotification: product.last_notification_at,
              notifications_enabled: Boolean(product.notifications_enabled),
            }
          } catch (error) {
            return {
              id: product.id,
              barcode: product.barcode,
              clickId: null,
              min: product.min,
              name: product.name || `Produto ${product.barcode}`,
              currentStock: 0,
              lastNotification: product.last_notification_at,
              notifications_enabled: Boolean(product.notifications_enabled),
            }
          }
        })
      )

      return response.status(200).json({
        products: productsWithData,
        pagination: {
          page,
          limit,
          total: totalProducts,
          totalPages,
          hasMore: page < totalPages,
        },
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to retrieve products',
        message: error.message,
      })
    }
  }

  async getStatistics(request, response) {
    try {
      const axios = require('axios')

      const allProducts = await this.productModel.getAll()
      const totalProducts = allProducts.length

      const CLICK_API_URL = process.env.CLICK_API_URL
      const CLICK_API_ACCESS_TOKEN = process.env.CLICK_API_ACCESS_TOKEN
      const CLICK_API_SECRET_TOKEN = process.env.CLICK_API_PRIVATE_TOKEN

      if (!CLICK_API_ACCESS_TOKEN || !CLICK_API_SECRET_TOKEN) {
        return response.status(500).json({
          error: 'API Click não configurada',
        })
      }

      let lowStockCount = 0
      let criticalStockCount = 0

      // Buscar estoque real de todos os produtos
      await Promise.all(
        allProducts.map(async (product) => {
          try {
            const clickResponse = await axios.get(`${CLICK_API_URL}/produtos`, {
              params: {
                codigo: product.barcode,
              },
              headers: {
                'access-token': CLICK_API_ACCESS_TOKEN,
                'secret-access-token': CLICK_API_SECRET_TOKEN,
              },
              timeout: 5000,
            })

            if (
              clickResponse.data?.data &&
              clickResponse.data.data.length > 0
            ) {
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

              if (currentStock <= minStock * 0.3) {
                criticalStockCount++
              } else if (currentStock <= minStock * 0.8) {
                lowStockCount++
              }
            }
          } catch (error) {
            console.error(
              `Erro ao buscar estatística do produto ${product.barcode}:`,
              error.message
            )
          }
        })
      )

      return response.status(200).json({
        statistics: {
          total: totalProducts,
          lowStock: lowStockCount,
          criticalStock: criticalStockCount,
        },
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to retrieve statistics',
        message: error.message,
      })
    }
  }

  async searchProductVariants(request, response) {
    try {
      const axios = require('axios')
      const { codigo } = request.query

      if (!codigo) {
        return response.status(400).json({
          error: 'Código do produto é obrigatório',
        })
      }

      const CLICK_API_URL = process.env.CLICK_API_URL
      const CLICK_API_ACCESS_TOKEN = process.env.CLICK_API_ACCESS_TOKEN
      const CLICK_API_SECRET_TOKEN = process.env.CLICK_API_PRIVATE_TOKEN

      if (!CLICK_API_ACCESS_TOKEN || !CLICK_API_SECRET_TOKEN) {
        return response.status(500).json({
          error: 'API Click não configurada',
        })
      }

      const clickResponse = await axios.get(`${CLICK_API_URL}/produtos`, {
        params: {
          codigo: codigo,
        },
        headers: {
          'access-token': CLICK_API_ACCESS_TOKEN,
          'secret-access-token': CLICK_API_SECRET_TOKEN,
        },
        timeout: 5000,
      })

      if (!clickResponse.data?.data || clickResponse.data.data.length === 0) {
        return response.status(404).json({
          error: 'Nenhum produto encontrado com este código',
        })
      }

      const localProducts = await this.productModel.getAll()
      const localProductsMap = new Map()
      localProducts.forEach((p) => {
        if (p.click_id) {
          localProductsMap.set(p.click_id.toString(), p)
        }
      })

      const variants = clickResponse.data.data.map((product) => {
        const localProduct = localProductsMap.get(product.id.toString())

        return {
          id: product.id.toString(),
          barcode: product.codigo_interno || product.codigo_barra,
          name: product.nome,
          currentStock: parseInt(product.estoque, 10) || 0,
          preco: parseFloat(product.preco) || 0,
          min: localProduct?.min || 0,
          isLowStock: localProduct
            ? parseInt(product.estoque, 10) <= localProduct.min
            : false,
          notifications_enabled:
            localProduct?.notifications_enabled === 1 ? true : false,
        }
      })

      return response.status(200).json({
        variants,
        total: variants.length,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erro ao buscar variantes do produto',
        message: error.message,
      })
    }
  }

  async upsertProduct(request, response) {
    try {
      const { barcode, min, clickId, name } = request.body

      if (!barcode || !min) {
        return response.status(400).json({
          error: 'barcode e min são obrigatórios',
        })
      }

      const minValue = parseInt(min, 10)
      if (isNaN(minValue) || minValue < 0) {
        return response.status(400).json({
          error: 'min deve ser um número válido maior ou igual a 0',
        })
      }

      const result = await this.productModel.upsert(barcode, min, clickId, name)

      return response.status(200).json({
        message:
          result.action === 'created'
            ? 'Produto cadastrado com sucesso'
            : 'Estoque mínimo atualizado com sucesso',
        action: result.action,
        product: result.product,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erro ao salvar produto',
        message: error.message,
      })
    }
  }

  async deleteProduct(request, response) {
    try {
      const { barcode } = request.params

      if (!barcode) {
        return response.status(400).json({ error: 'barcode é obrigatório' })
      }

      const product = await this.productModel.getByBarCode(barcode)
      if (!product) {
        return response.status(404).json({ error: 'Produto não encontrado' })
      }

      await this.productModel.delete(barcode)

      return response.status(200).json({
        message: 'Produto removido com sucesso',
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erro ao remover produto',
        message: error.message,
      })
    }
  }

  async updateMinStock(request, response) {
    try {
      const { barcode } = request.params
      const { min } = request.body

      if (!barcode) {
        return response.status(400).json({ error: 'barcode é obrigatório' })
      }

      if (!min && min !== 0) {
        return response.status(400).json({ error: 'min é obrigatório' })
      }

      const minValue = parseInt(min, 10)
      if (isNaN(minValue) || minValue < 0) {
        return response.status(400).json({
          error: 'min deve ser um número válido maior ou igual a 0',
        })
      }

      const product = await this.productModel.getByBarCode(barcode)
      if (!product) {
        return response.status(404).json({ error: 'Produto não encontrado' })
      }

      await this.productModel.updateMinStock(barcode, min)

      return response.status(200).json({
        message: 'Estoque mínimo atualizado com sucesso',
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erro ao atualizar estoque mínimo',
        message: error.message,
      })
    }
  }

  async toggleNotifications(request, response) {
    try {
      const { id } = request.params
      const { enabled, fcmToken } = request.body

      if (!id) {
        return response.status(400).json({ error: 'id é obrigatório' })
      }

      if (typeof enabled !== 'boolean') {
        return response
          .status(400)
          .json({ error: 'enabled deve ser true ou false' })
      }

      const product = await this.productModel.getByBarId(id)
      if (!product) {
        return response.status(404).json({ error: 'Produto não encontrado' })
      }

      await this.productModel.toggleNotifications(id, enabled)

      if (fcmToken) {
        const productTopic = `product_${id}`
        const FirebaseMessaging = require('../firebase/messaging')
        const messaging = new FirebaseMessaging()

        try {
          if (enabled) {
            await messaging.subscribeToTopic(fcmToken, [productTopic])
          } else {
            await messaging.unsubscribeFromTopic(fcmToken, productTopic)
          }
        } catch (error) {
          console.error(`Erro ao gerenciar inscrição no tópico:`, error)
        }
      }

      return response.status(200).json({
        message: `Notificações ${
          enabled ? 'ativadas' : 'desativadas'
        } com sucesso`,
        topic: `product_${id}`,
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Erro ao atualizar status de notificações',
        message: error.message,
      })
    }
  }
}

module.exports = ProductController
