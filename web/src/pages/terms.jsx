import { Link } from 'react-router-dom'
import { LegalLayout, List, Section } from '../components/legal-layout'
import { LEGAL } from '../lib/legal'

const Email = () => (
  <a href={`mailto:${LEGAL.email}`} className="font-semibold text-primary hover:underline">
    {LEGAL.email}
  </a>
)

export function TermsPage() {
  return (
    <LegalLayout title="Termos de uso">
      <p>
        Estes Termos de uso regulam o acesso e o uso do {LEGAL.appName}, disponível em {LEGAL.site} e no
        aplicativo instalável a partir do site. O {LEGAL.appName} é mantido por {LEGAL.controller}
        {LEGAL.controllerDocument ? ` (${LEGAL.controllerDocument})` : ''}, {LEGAL.controllerType}, aqui
        chamado de "nós".
      </p>
      <p>
        Ao criar uma conta, você declara que leu e concorda com estes Termos e com a{' '}
        <Link to="/privacidade" className="font-semibold text-primary hover:underline">
          Política de privacidade
        </Link>
        . Se não concordar, não utilize o serviço.
      </p>

      <Section title="1. O que é o Valtrea">
        <p>
          O {LEGAL.appName} é uma ferramenta de organização financeira pessoal. Você registra seus ganhos,
          gastos e investimentos e acompanha saldos, gráficos e relatórios a partir das informações que
          você mesmo cadastra.
        </p>
        <p>O {LEGAL.appName} não é banco, corretora nem instituição financeira. Em especial, ele:</p>
        <List
          items={[
            'não movimenta dinheiro, não acessa suas contas bancárias e não realiza pagamentos;',
            'não oferece consultoria, recomendação de investimentos ou aconselhamento financeiro, contábil ou jurídico;',
            'apresenta cálculos baseados exclusivamente nos dados que você inseriu.',
          ]}
        />
      </Section>

      <Section title="2. Cadastro e conta">
        <List
          items={[
            'Para usar o serviço é preciso ter 18 anos ou mais, ou estar autorizado pelos pais ou responsáveis legais.',
            'Você deve informar dados verdadeiros e manter seu e-mail atualizado. O e-mail precisa ser confirmado para liberar o acesso ao painel.',
            'Você é responsável por manter sua senha em sigilo e por todas as atividades realizadas na sua conta.',
            'Se perceber qualquer uso não autorizado da sua conta, troque sua senha imediatamente e nos avise.',
          ]}
        />
      </Section>

      <Section title="3. Uso permitido">
        <p>Ao usar o {LEGAL.appName}, você concorda em não:</p>
        <List
          items={[
            'usar o serviço para fins ilegais ou para registrar informações de terceiros sem autorização;',
            'tentar acessar contas, dados ou áreas do sistema que não sejam seus;',
            'tentar sobrecarregar, interromper, copiar ou explorar falhas do serviço;',
            'criar contas de forma automatizada ou usar o serviço para enviar mensagens em massa.',
          ]}
        />
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos, comunicando o motivo sempre que
          possível.
        </p>
      </Section>

      <Section title="4. Preço e mudanças no serviço">
        <p>
          Atualmente o {LEGAL.appName} é gratuito. Podemos criar planos pagos ou recursos adicionais no
          futuro. Nenhuma cobrança será feita sem que você seja informado com antecedência e concorde
          expressamente.
        </p>
        <p>
          Podemos adicionar, alterar ou remover funcionalidades para melhorar o serviço. Mudanças relevantes
          serão comunicadas no site ou por e-mail.
        </p>
      </Section>

      <Section title="5. Disponibilidade">
        <p>
          Trabalhamos para manter o {LEGAL.appName} disponível e seguro, mas o serviço pode ficar
          temporariamente indisponível por manutenção, atualizações ou falhas de provedores de
          infraestrutura. Não garantimos funcionamento ininterrupto ou livre de erros.
        </p>
      </Section>

      <Section title="6. Responsabilidades">
        <List
          items={[
            'As informações financeiras cadastradas são de sua responsabilidade, assim como as decisões que você tomar com base nelas.',
            'Não nos responsabilizamos por prejuízos decorrentes de dados inseridos incorretamente, de decisões financeiras do usuário ou de indisponibilidades fora do nosso controle.',
            'Nada nestes Termos limita os direitos que você tem como consumidor pela legislação brasileira.',
          ]}
        />
      </Section>

      <Section title="7. Propriedade intelectual">
        <p>
          A marca {LEGAL.appName}, o logotipo, o layout e o software do serviço pertencem a nós. Você recebe
          uma permissão pessoal, gratuita e não exclusiva para usar o serviço conforme estes Termos. Os dados
          que você cadastra continuam sendo seus.
        </p>
      </Section>

      <Section title="8. Encerramento da conta">
        <p>
          Você pode excluir sua conta a qualquer momento em <strong>Minha conta &gt; Excluir minha conta</strong>
          , confirmando com sua senha. A exclusão apaga de forma permanente seu cadastro e todas as suas
          transações, como descrito na Política de privacidade.
        </p>
      </Section>

      <Section title="9. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos. A data da última atualização aparece no topo desta página. Mudanças
          relevantes serão comunicadas por e-mail ou por aviso no site antes de entrarem em vigor. Se você
          continuar usando o serviço depois disso, estará concordando com a nova versão.
        </p>
      </Section>

      <Section title="10. Lei aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca
          de {LEGAL.forum} para resolver eventuais controvérsias, ressalvado o direito do consumidor de
          propor ação no foro do seu domicílio, conforme o Código de Defesa do Consumidor.
        </p>
      </Section>

      <Section title="11. Contato">
        <p>
          Dúvidas, sugestões ou reclamações sobre estes Termos: <Email />.
        </p>
      </Section>
    </LegalLayout>
  )
}
