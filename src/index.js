const express = require("express");
const dotenv = require("dotenv");

dotenv.config();
const { PORT } = process.env;

const app = express();

app.use(express.json());

require("./firebase");

const connection = require("./database/connection");

const { ProductModel } = require("./models/index");
const { ProductController, MessagingController } = require("./controllers/index");
const { ProductRouter, MessagingRouter } = require("./routes/index");

const FirebaseMessaging = require("./firebase/messaging")

const productModel = new ProductModel(connection);
const productController = new ProductController(productModel);
const productRouter = new ProductRouter(productController);

const firebaseMessaging = new FirebaseMessaging();
const messagingController = new MessagingController(firebaseMessaging);
const messagingRouter = new MessagingRouter(productController);

app.use("/product", productRouter.getRoutes());

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
