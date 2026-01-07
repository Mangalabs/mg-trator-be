const { initializeApp, cert } = require('firebase-admin/app')
const serviceAccount = require('../../mg-estoque-app-firebase-adminsdk-fbsvc-a7d1ee22d5.json')

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'mg-estoque-app',
})
