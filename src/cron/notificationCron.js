const cron = require('node-cron')

// Executar às 8h e 16h todos os dias
// Formato: minuto hora dia mês dia-da-semana
// 0 8 * * * = 8:00 AM todos os dias
// 0 16 * * * = 4:00 PM todos os dias
const MORNING_SCHEDULE = '0 8 * * 1-5' // 8h, Segunda a Sexta
const AFTERNOON_SCHEDULE = '0 16 * * 1-5' // 16h, Segunda a Sexta

module.exports = (stockMonitorService) => {
  // Verificação da manhã (8h)
  cron.schedule(MORNING_SCHEDULE, async () => {
    console.log('⏰ Cron: Verificação da MANHÃ (8h)...')
    try {
      await stockMonitorService.checkAllProducts()
    } catch (error) {
      console.error('❌ Erro no cron da manhã:', error.message)
    }
  })

  // Verificação da tarde (16h)
  cron.schedule(AFTERNOON_SCHEDULE, async () => {
    console.log('⏰ Cron: Verificação da TARDE (16h)...')
    try {
      await stockMonitorService.checkAllProducts()
    } catch (error) {
      console.error('❌ Erro no cron da tarde:', error.message)
    }
  })

  console.log('✅ Cron de notificações configurado:')
  console.log('   📅 Segunda a Sexta')
  console.log('   🌅 08:00 - Verificação da manhã')
  console.log('   🌆 16:00 - Verificação da tarde')
  console.log('   📧 Máximo: 2 notificações por produto por dia')
}
