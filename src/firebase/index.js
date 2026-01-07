const { initializeApp, cert } = require('firebase-admin/app')
const path = require('path')
const fs = require('fs')

// Método 1: Usar arquivo JSON (desenvolvimento local)
// Método 2: Usar variáveis de ambiente (produção/Docker)
let serviceAccount

if (process.env.FIREBASE_CREDENTIALS_PATH) {
  // Carregar de arquivo especificado por ENV
  const credentialsPath = path.resolve(process.env.FIREBASE_CREDENTIALS_PATH)
  serviceAccount = require(credentialsPath)
} else if (process.env.FIREBASE_PRIVATE_KEY) {
  // Carregar de variáveis de ambiente individuais
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  }
} else {
  // Fallback: tentar carregar arquivo padrão (desenvolvimento)
  const defaultPath = path.resolve(
    __dirname,
    '../../mg-estoque-app-firebase-adminsdk-fbsvc-a7d1ee22d5.json'
  )
  if (fs.existsSync(defaultPath)) {
    serviceAccount = require(defaultPath)
  } else {
    throw new Error(
      'Firebase credentials not found. Set FIREBASE_CREDENTIALS_PATH or individual FIREBASE_* env variables.'
    )
  }
}

initializeApp({
  credential: cert(serviceAccount),
  projectId:
    process.env.FIREBASE_PROJECT_ID ||
    serviceAccount.project_id ||
    'mg-estoque-app',
})
