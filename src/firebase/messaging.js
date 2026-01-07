const { getMessaging } = require('firebase-admin/messaging')

class FirebaseMessaging {
  constructor() {
    this.messaging = getMessaging()
  }

  async subscribeToTopic(fcmToken, topics) {
    const subscriptions = []
    for (const topic of topics) {
      subscriptions.push(this.messaging.subscribeToTopic(fcmToken, topic))
    }

    await Promise.all(subscriptions)
  }

  async unsubscribeFromTopic(fcmToken, topic) {
    await this.messaging.unsubscribeFromTopic(fcmToken, topic)
  }

  async sendNotification(title, body, topic = 'stock') {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        timestamp: Date.now().toString(),
        type: 'stock_alert',
      },
      topic: topic,
      android: {
        priority: 'high',
        notification: {
          channelId: 'stock_alerts',
          priority: 'high',
          sound: 'default',
        },
      },
    }

    try {
      const response = await this.messaging.send(message)
      return response
    } catch (error) {
      throw error
    }
  }

  async sendNotificationToToken(title, body, token) {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        timestamp: Date.now().toString(),
        type: 'stock_alert',
      },
      token: token,
      android: {
        priority: 'high',
        notification: {
          channelId: 'stock_alerts',
          priority: 'high',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
    }

    try {
      const response = await this.messaging.send(message)
      return response
    } catch (error) {
      throw error
    }
  }
}

module.exports = FirebaseMessaging
