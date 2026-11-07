import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/logo'
import { LegalLinks } from '../components/legal-links'

// O que mudou em cada versão. Acrescente no topo a cada novidade.
const VERSOES = [
  [
    "7 de novembro de 2026",
    [
      "Previsão do saldo no fim do mês, contando as recorrentes que ainda vão cair.",
      "Relatório do ano para imprimir ou salvar em PDF, com os totais de cada mês e por categoria.",
      "Busca rápida: aperte Ctrl+K (ou / ) para ir a qualquer tela."
    ]
  ],
  [
    "6 de novembro de 2026",
    [
      "Importar extrato do banco (OFX ou CSV), com revisão antes de salvar e sem duplicar o que já existe.",
      "Sugestão de categoria ao digitar o nome do lançamento.",
      "Resumo do mês: gastos até hoje comparados com o mesmo período do mês passado.",
      "Central de ajuda com as dúvidas mais comuns.",
      "Quando o servidor estava parado, aparece \"Acordando o servidor\" em vez de parecer travado.",
      "Novo visual da marca: logo própria do Valtrea Finance e fonte Inter."
    ]
  ],
  [
    "4 de novembro de 2026",
    [
      "Saldo atual sempre visível e extrato do período (saldo no início, resultado e saldo no fim).",
      "Termos de uso, Política de privacidade e acessibilidade revisados."
    ]
  ],
  [
    "3 de novembro de 2026",
    [
      "Melhor contraste das cores e textos alternativos nos gráficos.",
      "Aviso de cookies: só o necessário para manter você conectado."
    ]
  ],
  [
    "18 de outubro de 2026",
    [
      "Integração com a carteira Valtrea Pay: pagamentos entram sozinhos no Finance."
    ]
  ],
  [
    "8 de outubro de 2026",
    [
      "Categorias, transações recorrentes, orçamento por categoria e evolução mês a mês.",
      "Exportar transações em planilha.",
      "Excluir a conta com confirmação por e-mail."
    ]
  ],
  [
    "7 de outubro de 2026",
    [
      "Confirmação de e-mail no cadastro e instalação como app no celular."
    ]
  ]
]

export function ChangelogPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Ir para o início"><Logo /></Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Novidades</h1>
        <p className="mt-2 text-muted">O que mudou no Valtrea Finance, do mais recente para o mais antigo.</p>
        <ol className="mt-8 space-y-8 border-l-2 border-border pl-6">
          {VERSOES.map(([data, itens]) => (
            <li key={data}>
              <h2 className="text-lg font-bold">{data}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                {itens.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </main>
      <footer className="border-t border-border py-6"><LegalLinks /></footer>
    </div>
  )
}
