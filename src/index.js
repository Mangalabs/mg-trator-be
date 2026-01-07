const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config()
const { PORT } = process.env

const app = express()

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

const productModel = new ProductModel(connection)
const productController = new ProductController(productModel)
const productRouter = new ProductRouter(productController)

const firebaseMessaging = new FirebaseMessaging()
const messagingController = new MessagingController(firebaseMessaging)
const messagingRouter = new MessagingRouter(messagingController)

app.use('/product', productRouter.getRoutes())
app.use('/messaging', messagingRouter.getRoutes())

require('./cron/notificationCron')(productModel, firebaseMessaging)

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
