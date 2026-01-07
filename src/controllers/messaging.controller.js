class MessagingController {
  constructor(messaging) {
    this.messaging = messaging
  }

  async subscribeToTopics(request, response) {
    const { fcmToken, topics } = request.body

    if (!fcmToken || !topics || !Array.isArray(topics)) {
      return response.status(400).json({ error: 'Dados inválidos fornecidos.' })
    }

    try {
      await this.messaging.subscribeToTopic(fcmToken, topics)

      return response
        .status(200)
        .json({ message: 'Inscrição em tópicos concluída com sucesso!' })
    } catch (error) {
      console.error('Erro ao inscrever em tópicos:', error)
      return response
        .status(500)
        .json({ error: 'Erro ao inscrever em tópicos' })
    }
  }

  async sendTestNotification(request, response) {
    const { title, body, topic } = request.body

    try {
      const notificationTitle = title || 'Teste de Notificação'
      const notificationBody =
        body || 'Esta é uma notificação de teste do backend'
      const notificationTopic = topic || 'stock'

      const result = await this.messaging.sendNotification(
        notificationTitle,
        notificationBody,
        notificationTopic
      )

      return response.status(200).json({
        success: true,
        message: 'Notificação enviada com sucesso!',
        messageId: result,
      })
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error)
      return response.status(500).json({
        success: false,
        error: 'Erro ao enviar notificação',
        details: error.message,
      })
    }
  }

  async sendTestToToken(request, response) {
    const { title, body, token } = request.body

    if (!token) {
      return response.status(400).json({
        success: false,
        error: 'Token FCM é obrigatório',
      })
    }

    try {
      const notificationTitle = title || 'Teste Direto'
      const notificationBody =
        body || 'Notificação enviada diretamente para seu dispositivo'

      const result = await this.messaging.sendNotificationToToken(
        notificationTitle,
        notificationBody,
        token
      )

      return response.status(200).json({
        success: true,
        message: 'Notificação enviada diretamente para o token!',
        messageId: result,
      })
    } catch (error) {
      console.error('Erro ao enviar notificação para token:', error)
      return response.status(500).json({
        success: false,
        error: 'Erro ao enviar notificação',
        details: error.message,
      })
    }
  }
}

module.exports = MessagingController
