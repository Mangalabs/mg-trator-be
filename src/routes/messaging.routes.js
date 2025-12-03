const express = require("express");

class MessagingRouter {
  constructor(messagingController) {
    this.messaging = express.Router();

    this.messagingController = messagingController;

    this.messaging.get("/subscribe", (request, response) => {
      this.messagingController.getAll(request, response);
    });
  }

  getRoutes() {
    return this.messaging;
  }
}

module.exports = MessagingRouter;
