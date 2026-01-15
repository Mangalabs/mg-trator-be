const cron = require('node-cron')

// CRON 1: Notificações programadas (8h e 16h)
const MORNING_SCHEDULE = '0 8 * * 1-5' // 8h, Segunda a Sexta
const AFTERNOON_SCHEDULE = '0 16 * * 1-5' // 16h, Segunda a Sexta

// CRON 2: Verificação contínua para detectar mudanças em tempo real
const CONTINUOUS_CHECK = '*/30 * * * *' // A cada 30 minutos

module.exports = (stockMonitorService) => {
  // Notificação programada da manhã (8h)
  cron.schedule(MORNING_SCHEDULE, async () => {
    console.log('⏰ [PROGRAMADA] Verificação da MANHÃ (8h)...')
    try {
      await stockMonitorService.checkAllProducts(true) // true = notificação programada
    } catch (error) {
      console.error('❌ Erro no cron da manhã:', error.message)
    }
  })

  // Notificação programada da tarde (16h)
  cron.schedule(AFTERNOON_SCHEDULE, async () => {
    console.log('⏰ [PROGRAMADA] Verificação da TARDE (16h)...')
    try {
      await stockMonitorService.checkAllProducts(true) // true = notificação programada
    } catch (error) {
      console.error('❌ Erro no cron da tarde:', error.message)
    }
  })

  // Verificação contínua (a cada 30 minutos) - detecta mudanças em tempo real
  cron.schedule(CONTINUOUS_CHECK, async () => {
    console.log('🔄 [CONTÍNUA] Verificação de mudanças...')
    try {
      await stockMonitorService.checkAllProducts(false) // false = apenas detectar mudanças
    } catch (error) {
      console.error('❌ Erro na verificação contínua:', error.message)
    }
  })

  console.log('✅ Sistema de notificações configurado:')
  console.log('   📅 Segunda a Sexta')
  console.log('   🌅 08:00 - Notificação programada (manhã)')
  console.log('   🌆 16:00 - Notificação programada (tarde)')
  console.log('   🔄 A cada 30min - Verificação contínua (detecta mudanças)')
  console.log(
    '   📧 Total: máximo 2 notificações programadas + alertas em tempo real'
  )
}
