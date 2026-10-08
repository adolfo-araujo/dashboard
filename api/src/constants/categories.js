// Categorias válidas para cada tipo de transação.
// Mantenha igual à lista em web/src/lib/categories.js.
export const CATEGORIES = {
    EXPENSE: [
        'moradia',
        'alimentacao',
        'transporte',
        'saude',
        'educacao',
        'lazer',
        'compras',
        'contas',
        'assinaturas',
        'impostos',
        'outros',
    ],
    EARNING: [
        'salario',
        'freelance',
        'vendas',
        'rendimentos',
        'presentes',
        'reembolso',
        'outros',
    ],
    INVESTMENT: [
        'renda_fixa',
        'acoes',
        'fundos',
        'previdencia',
        'cripto',
        'reserva',
        'outros',
    ],
}

export const ALL_CATEGORIES = [...new Set(Object.values(CATEGORIES).flat())]
