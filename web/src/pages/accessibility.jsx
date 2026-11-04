import { LegalLayout, List, Section } from '../components/legal-layout'
import { LEGAL } from '../lib/legal'

const Email = () => (
  <a href={`mailto:${LEGAL.email}?subject=Acessibilidade`} className="font-semibold text-primary hover:underline">
    {LEGAL.email}
  </a>
)

export function AccessibilityPage() {
  return (
    <LegalLayout title="Declaração de acessibilidade">
      <p>
        Queremos que o {LEGAL.appName} e o site da Valtrea possam ser usados por todas as pessoas, incluindo
        pessoas com deficiência, como prevê a Lei Brasileira de Inclusão (Lei nº 13.146/2015, art. 63).
      </p>

      <Section title="Padrão adotado">
        <p>
          Buscamos atender às Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2, nível AA, e à norma
          ABNT NBR 17225.
        </p>
      </Section>

      <Section title="O que já fizemos">
        <List
          items={[
            'As principais páginas são verificadas automaticamente (axe-core, regras WCAG A e AA) a cada mudança, no computador e no celular.',
            'Contraste de cores revisado em todo o site e nos e-mails.',
            'Navegação completa pelo teclado, com foco visível, link "Pular para o conteúdo" no início de cada página e janelas que mantêm o foco dentro delas até serem fechadas (Esc fecha).',
            'Formulários com rótulos e mensagens de erro em texto.',
            'Gráficos com descrição para leitores de tela; os valores também aparecem em texto ou em tabela.',
            'Zoom liberado e layout que se adapta a telas pequenas.',
            'Idioma da página declarado como português do Brasil, para a leitura correta por leitores de tela.',
          ]}
        />
      </Section>

      <Section title="Limitações conhecidas">
        <List
          items={[
            'Ainda não fizemos testes com pessoas que usam leitores de tela ou outras tecnologias assistivas. As verificações automáticas encontram boa parte dos problemas, mas não todos.',
            'Não há tradução para Libras.',
          ]}
        />
      </Section>

      <Section title="Recursos de apoio">
        <p>
          Para aumentar o texto, use <kbd>Ctrl</kbd> + <kbd>+</kbd> (Windows e Linux) ou <kbd>Cmd</kbd> +{' '}
          <kbd>+</kbd> (macOS). No celular, o zoom com dois dedos funciona em todas as páginas.
        </p>
      </Section>

      <Section title="Encontrou uma barreira?">
        <p>
          Queremos saber. Escreva para <Email /> contando a página e o problema (e, se quiser, o navegador e a
          tecnologia assistiva que você usa). Respondemos o quanto antes e, se precisar, enviamos o conteúdo
          em outro formato.
        </p>
      </Section>
    </LegalLayout>
  )
}
