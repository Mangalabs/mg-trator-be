class MessagingController {
  constructor(messaging) {
    this.messaging = messaging;
  }

  async getAll(request, response) {
    const { fcmToken, topics } = request.body;

    if ( !fcmToken || !topics || !Array.isArray(topics)) {
      return res.status(400).send("Dados inválidos fornecidos.");
    }

    try {
      await this.messaging.subscribeToTopic(fcmToken, topics)

      response.status(200).send("Inscrição em tópicos concluída com sucesso!");
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = MessagingController;
