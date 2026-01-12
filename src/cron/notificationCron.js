const cron = require('node-cron')

// Executar a cada 30 minutos
const CRON_SCHEDULE = '*/30 * * * *'

module.exports = (stockMonitorService) => {
  // Executar verificação a cada 30 minutos
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log('⏰ Cron: Iniciando verificação automática de estoque...')
    try {
      await stockMonitorService.checkAllProducts()
    } catch (error) {
      console.error('❌ Erro no cron de verificação:', error.message)
    }
  })

  console.log(`✅ Cron de notificações iniciado: ${CRON_SCHEDULE} (a cada 30 minutos)`)
  console.log('📧 Limite: 2 notificações por produto por dia')

  // Executar uma verificação imediatamente ao iniciar (opcional)
  setTimeout(async () => {
    console.log('🚀 Executando primeira verificação ao iniciar servidor...')
    try {
      await stockMonitorService.checkAllProducts()
    } catch (error) {
      console.error('❌ Erro na verificação inicial:', error.message)
    }
  }, 5000) // Aguardar 5 segundos após o servidor iniciar
}
