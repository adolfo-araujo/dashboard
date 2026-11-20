// Todos os tópicos da base de conhecimento. Para um módulo novo, crie o arquivo e acrescente aqui.
import { TOPICOS_IDENTIDADE } from './identidade.js'
import { TOPICOS_SOCIAIS } from './social.js'
import { TOPICOS_DO_APP } from './app.js'
import { TOPICOS_DE_EDUCACAO } from './educacao.js'
import { TOPICOS_GERAIS } from './geral.js'

export const TOPICOS = [...TOPICOS_IDENTIDADE, ...TOPICOS_SOCIAIS, ...TOPICOS_DO_APP, ...TOPICOS_DE_EDUCACAO, ...TOPICOS_GERAIS]
