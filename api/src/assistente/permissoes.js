// Gerenciador de permissões do assistente.
// Toda ação roda com o usuário autenticado (request.userId) e só enxerga os dados dele (o repositório filtra por user_id).
// Regras aprendidas só podem levar a consultas (leitura); nunca a lançar, apagar ou mudar algo.

export const ACOES = {
    consultar: { escrita: false, confirmar: false },
    lancar: { escrita: true, confirmar: false }, // a pessoa pediu explicitamente; dá para desfazer com "apaga o último"
    apagar: { escrita: true, confirmar: true },
    editar: { escrita: true, confirmar: true },
    orcamento: { escrita: true, confirmar: true },
    aprender: { escrita: true, confirmar: true },
}

// O que uma pergunta ensinada pode mostrar
export const ALVOS_DE_FRASE = ['saldo', 'sobra', 'gastos', 'ganhos', 'investimentos', 'maior', 'ultimos', 'resumo', 'orcamentos', 'analise']

export const podeAprenderFrase = (alvo) => ALVOS_DE_FRASE.includes(alvo)

// Limites de valores para criar orçamento pelo chat (os mesmos da rota /api/budgets)
export const LIMITE_ORCAMENTO = { minimo: 1, maximo: 99999999.99 }
