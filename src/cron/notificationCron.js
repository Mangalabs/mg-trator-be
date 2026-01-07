const cron = require('node-cron')
const axios = require('axios')

const CRON_SCHEDULE = '*/15 * * * *'
const NOTIFICATION_COOLDOWN_HOURS = 24
const CLICK_API_URL = process.env.CLICK_API_URL || 'https://api.exemplo.com'
const CLICK_API_ACCESS_TOKEN = process.env.CLICK_API_ACCESS_TOKEN
const CLICK_API_SECRET_TOKEN = process.env.CLICK_API_PRIVATE_TOKEN

module.exports = (productModel, firebaseMessaging) => {
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      const products = await productModel.getProductsWithLowStock()

      if (!products || products.length === 0) {
        return
      }

      for (const product of products) {
        try {
          if (!product.notifications_enabled) {
            continue
          }

          if (shouldSkipNotification(product)) {
            continue
          }

          const productData = product.click_id
            ? await fetchProductStockById(product.click_id, product.barcode)
            : await fetchProductStock(product.barcode)

          if (productData === null) {
            continue
          }

          const { stock: currentStock, name: productName } = productData
          const minStock = parseInt(product.min, 10)

          const displayName = product.name || productName

          if (currentStock <= minStock) {
            const isCritical = currentStock <= minStock * 0.3

            const title = isCritical
              ? '🚨 Estoque Crítico!'
              : '⚠️ Estoque Baixo'
            const body = `${displayName}: ${currentStock} unidades (mínimo: ${minStock})`

            const productTopic = `product_${product.id}`

            try {
              await firebaseMessaging.sendNotification(
                title,
                body,
                productTopic
              )
              await productModel.updateLastNotification(product.id)
            } catch (notifError) {
              console.error(
                `Erro ao enviar notificação para ${productTopic}:`,
                notifError.message
              )
            }
          }
        } catch (error) {
          console.error(
            `Erro ao processar produto ${product.barcode}:`,
            error.message
          )
        }
      }
    } catch (error) {
      console.error('Erro no cron de notificações:', error)
    }
  })

  console.log(`Cron de notificações iniciado (${CRON_SCHEDULE})`)
}

function shouldSkipNotification(product) {
  if (!product.last_notification_at) {
    return false
  }

  const lastNotification = new Date(product.last_notification_at + 'Z')
  const now = new Date()

  const hoursSinceLastNotification = (now - lastNotification) / (1000 * 60 * 60)

  if (hoursSinceLastNotification < NOTIFICATION_COOLDOWN_HOURS) {
    return true
  }

  return false
}

async function fetchProductStockById(clickId, barcode) {
  try {
    if (!CLICK_API_ACCESS_TOKEN || !CLICK_API_SECRET_TOKEN) {
      return {
        stock: Math.floor(Math.random() * 20),
        name: `Produto ${barcode}`,
      }
    }

    const response = await axios.get(`${CLICK_API_URL}/produtos`, {
      params: {
        codigo: barcode,
      },
      headers: {
        'access-token': CLICK_API_ACCESS_TOKEN,
        'secret-access-token': CLICK_API_SECRET_TOKEN,
      },
      timeout: 5000,
    })

    if (response.data?.data && Array.isArray(response.data.data)) {
      const products = response.data.data
      const product = products.find(
        (p) => p.id.toString() === clickId.toString()
      )

      if (!product) {
        return null
      }

      const stockValue = parseInt(product.estoque, 10) || 0
      const productName = product.nome || `Produto ${barcode}`

      return {
        stock: stockValue,
        name: productName,
      }
    }

    return null
  } catch (error) {
    console.error(`Erro ao buscar produto ${clickId}:`, error.message)
    return null
  }
}

async function fetchProductStock(barcode) {
  try {
    if (!CLICK_API_ACCESS_TOKEN || !CLICK_API_SECRET_TOKEN) {
      return {
        stock: Math.floor(Math.random() * 20),
        name: `Produto ${barcode}`,
      }
    }

    const response = await axios.get(`${CLICK_API_URL}/produtos`, {
      params: {
        codigo: barcode,
      },
      headers: {
        'access-token': CLICK_API_ACCESS_TOKEN,
        'secret-access-token': CLICK_API_SECRET_TOKEN,
      },
      timeout: 5000,
    })

    if (response.data?.data && Array.isArray(response.data.data)) {
      const products = response.data.data

      if (products.length === 0) {
        return null
      }

      const product = products[0]
      const stockValue = parseInt(product.estoque, 10) || 0
      const productName = product.nome || `Produto ${barcode}`

      return {
        stock: stockValue,
        name: productName,
      }
    }

    return null
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    console.error(`Erro na API Click: ${error.message}`)
    throw error
  }
}
