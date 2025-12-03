const { getMessaging } = require("firebase-admin/messaging");

class FirebaseMessaging {
  constructor() {
    this.messaging = getMessaging();
  }

  async subscribeToTopic(fcmToken, topics) {
    const subscriptions = [];
    for (const topic of topics) {
      subscriptions.push(this.messaging.subscribeToTopic(fcmToken, topic));
    }

    await Promise.all(subscriptions);
  }

  async sendNotification(title, body) {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {},
      topic: "stock",
    };
    this.messaging
      .send(message)
      .then((response) => {
        console.log("Mensagem enviada com sucesso:", response);
      })
      .catch((error) => {
        console.error("Erro ao enviar mensagem:", error);
      });
  }
}

module.exports = FirebaseMessaging;
