// Carrega o monitoramento antes da API, para ele conseguir acompanhar tudo
import './instrument.js'

const { app } = await import('./src/app.js')
const { startRetentionSchedule } = await import('./src/jobs/retention.js')

const port = process.env.PORT || 8080

app.listen(port, () => console.log(`API rodando na porta ${port}`))

// Apaga cadastros nunca confirmados (30 dias) e links vencidos
startRetentionSchedule()
