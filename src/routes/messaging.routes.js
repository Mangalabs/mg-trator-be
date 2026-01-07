const express = require('express')

class MessagingRouter {
  constructor(messagingController) {
    this.messaging = express.Router()

    this.messagingController = messagingController

    this.messaging.post('/subscribe', (request, response) => {
      this.messagingController.subscribeToTopics(request, response)
    })

    this.messaging.post('/test', (request, response) => {
      this.messagingController.sendTestNotification(request, response)
    })

    this.messaging.post('/test-token', (request, response) => {
      this.messagingController.sendTestToToken(request, response)
    })
  }

  getRoutes() {
    return this.messaging
  }
}

module.exports = MessagingRouter
