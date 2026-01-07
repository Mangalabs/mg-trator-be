const admin = require('firebase-admin')
const serviceAccount = require('./mg-estoque-app-firebase-adminsdk-fbsvc-a7d1ee22d5.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const messaging = admin.messaging()

async function testNotification() {
  const topic = 'product_106'

  console.log(`📤 Enviando notificação de teste para tópico: ${topic}`)

  const message = {
    notification: {
      title: '🧪 Teste de Notificação',
      body: 'Esta é uma notificação de teste do sistema',
    },
    data: {
      timestamp: Date.now().toString(),
      type: 'test',
    },
    topic: topic,
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
    const response = await messaging.send(message)
    console.log('✅ Notificação enviada com sucesso!')
    console.log('📋 Response:', response)
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error)
    console.error('Código:', error.code)
    console.error('Mensagem:', error.message)
  }
}

testNotification()
