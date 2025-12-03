const { initializeApp, cert } = require("firebase-admin/app");
const serviceAccount = require("../../mg-estoque-cf281-firebase-adminsdk-fbsvc-1956314217.json");

initializeApp({
  credential: cert(serviceAccount),
  projectId: "mg-estoque-cf281",
});

console.log("Firebase inicializado")