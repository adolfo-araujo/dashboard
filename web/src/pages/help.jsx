import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/logo'
import { LegalLinks } from '../components/legal-links'
import { LEGAL } from '../lib/legal'

// Central de ajuda do Valtrea Finance: perguntas frequentes. Edite os textos aqui.
const SECOES = [
  ['Lançamentos', [
    ['Como registro um ganho, gasto ou investimento?', 'No painel, toque em Adicionar, escolha o tipo, o valor, a data e a categoria. Ao digitar o nome, aparece uma sugestão de categoria; um toque aplica.'],
    ['Como funciona a sugestão de categoria?', 'Se você já registrou um lançamento com o mesmo nome, sugerimos a categoria que você costuma usar. Se não, reconhecemos nomes comuns (iFood, Uber, Netflix, farmácia...). É calculado no seu navegador: nada é enviado para serviços de IA.'],
    ['Tenho contas que se repetem todo mês.', 'Use Recorrentes no painel: cadastre uma vez (aluguel, salário, assinaturas) e o lançamento é criado sozinho em cada mês. Dá para pausar ou excluir quando quiser; os lançamentos já criados continuam.'],
    ['Como vejo outro período?', 'No topo do painel, escolha o período (este mês, mês passado, este ano...) ou as datas exatas. Os cartões, gráficos e a lista seguem o período escolhido.'],
  ]],
  ['Extrato e planilha', [
    ['Como importo o extrato do banco?', 'Na lista de Transações, toque em Importar e escolha o arquivo OFX ou CSV baixado do app ou site do seu banco. Você revisa cada lançamento (tipo e categoria) antes de salvar. Os que já existem vêm desmarcados, para não duplicar.'],
    ['Importei uma fatura de cartão e os gastos vieram como ganhos.', 'Na importação, marque "É fatura de cartão de crédito": nesse arquivo os valores positivos são gastos.'],
    ['Como levo meus dados para uma planilha?', 'Na lista de Transações, toque em Exportar: baixa as transações exibidas em CSV, que abre direto no Excel ou no Google Planilhas. Em Minha conta há também "Baixar todas as transações".'],
  ]],
  ['Planejamento', [
    ['Como defino um limite de gastos?', 'No cartão de orçamento do mês, toque em Definir orçamentos e escolha o limite de cada categoria. A barra fica amarela perto do limite e vermelha quando passa.'],
    ['O que é o Resumo do mês?', 'Compara quanto você gastou até hoje com o mesmo período do mês passado e mostra as categorias que mais mudaram. Aparece quando há gastos registrados neste mês ou no anterior.'],
    ['Como conecto o Valtrea Pay?', 'No cartão Carteira Valtrea Pay, toque em Conectar e copie o código. No app Valtrea Pay, abra Perfil → Valtrea Finance e cole o código. Seus pagamentos da carteira passam a entrar aqui sozinhos.'],
  ]],
  ['Conta e dados', [
    ['O site demorou para abrir. É normal?', 'Quando o serviço fica um tempo sem uso, a primeira ação pode levar até 1 minuto, porque o servidor estava em repouso. Aparece o aviso "Acordando o servidor" e, depois disso, fica rápido.'],
    ['Esqueci a senha.', 'Na tela de entrar, toque em "Esqueci a senha" e informe seu e-mail. Você recebe um link para criar uma senha nova.'],
    ['Como baixo meus dados ou excluo a conta?', 'Em Minha conta: "Baixar meus dados" gera uma cópia de tudo o que guardamos sobre você e "Excluir minha conta" apaga o cadastro e todas as transações de forma permanente.'],
    ['Dá para usar como app no celular?', 'Sim. No Android, abra no Chrome e toque em "Instalar app". No iPhone, abra no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".'],
  ]],
]

export function HelpPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Central de ajuda</h1>
        <p className="mt-2 text-muted">Respostas rápidas para as dúvidas mais comuns sobre o Valtrea Finance.</p>
        {SECOES.map(([titulo, perguntas]) => (
          <section key={titulo} aria-labelledby={`sec-${titulo}`} className="mt-8">
            <h2 id={`sec-${titulo}`} className="text-xl font-bold">{titulo}</h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
              {perguntas.map(([p, r]) => (
                <details key={p} className="group p-5">
                  <summary className="cursor-pointer list-none font-semibold marker:hidden">
                    <span className="flex items-center justify-between gap-4">{p}<span className="text-primary group-open:rotate-45" aria-hidden="true">+</span></span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-muted">{r}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <section className="mt-10 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-bold">Não achou a resposta?</h2>
          <p className="mt-1 text-sm text-muted">
            Escreva para <a href={`mailto:${LEGAL.email}`} className="font-semibold text-primary hover:underline">{LEGAL.email}</a>. Respondemos por e-mail.
          </p>
        </section>
      </main>
      <footer className="border-t border-border py-6"><LegalLinks /></footer>
    </div>
  )
}
