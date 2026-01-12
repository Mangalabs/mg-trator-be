const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config()

const { PORT, NODE_ENV, ALLOWED_ORIGINS } = process.env
const isDevelopment = NODE_ENV !== 'production'

const app = express()

const corsOrigins = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : isDevelopment
  ? '*'
  : 'http://localhost:8081'

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
app.use(express.json())

require('./firebase')

const connection = require('./database/connection')

const { ProductModel } = require('./models/index')
const {
  ProductController,
  MessagingController,
} = require('./controllers/index')
const { ProductRouter, MessagingRouter } = require('./routes/index')

const FirebaseMessaging = require('./firebase/messaging')
const StockMonitorService = require('./services/stock-monitor.service')
const StockMonitorController = require('./controllers/stock-monitor.controller')
const StockMonitorRouter = require('./routes/stock-monitor.routes')

const productModel = new ProductModel(connection)
const productController = new ProductController(productModel)
const productRouter = new ProductRouter(productController)

const firebaseMessaging = new FirebaseMessaging()
const messagingController = new MessagingController(firebaseMessaging)
const messagingRouter = new MessagingRouter(messagingController)

const stockMonitorService = new StockMonitorService(
  productModel,
  firebaseMessaging
)
const stockMonitorController = new StockMonitorController(stockMonitorService)
const stockMonitorRouter = new StockMonitorRouter(stockMonitorController)

app.use('/product', productRouter.getRoutes())
app.use('/messaging', messagingRouter.getRoutes())
app.use('/stock-monitor', stockMonitorRouter.getRouter())

// Iniciar cron de verificação automática de estoque
require('./cron/notificationCron')(stockMonitorService)

const port = PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
  console.log(`Environment: ${NODE_ENV || 'development'}`)
  console.log(
    `CORS origins: ${
      Array.isArray(corsOrigins) ? corsOrigins.join(', ') : corsOrigins
    }`
  )
})
