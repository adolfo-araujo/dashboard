import { Link } from 'react-router-dom'
import { LegalLayout, List, Section } from '../components/legal-layout'
import { LEGAL } from '../lib/legal'

const Email = () => (
  <a href={`mailto:${LEGAL.email}`} className="font-semibold text-primary hover:underline">
    {LEGAL.email}
  </a>
)

const providers = [
  ['Vercel', 'hospedagem do Valtrea Finance e do site da Valtrea (inclusive o encaminhamento dos pedidos da lista de espera)', 'Estados Unidos e rede global'],
  ['Render', 'servidor da aplicação (API)', 'Estados Unidos'],
  ['Neon', 'banco de dados', 'São Paulo, Brasil'],
  ['GitHub', 'guarda da cópia de segurança diária do banco de dados, criptografada', 'Estados Unidos'],
  ['Resend', 'envio de e-mails do sistema', 'São Paulo, Brasil'],
  ['ImprovMX', 'recebimento e encaminhamento das mensagens enviadas ao nosso e-mail de contato', 'Estados Unidos'],
  ['Google (Gmail)', 'caixa de e-mail onde lemos e respondemos as mensagens enviadas ao nosso contato', 'Estados Unidos'],
  ['Sentry', 'registro de erros técnicos para correção de falhas, sem guardar o endereço IP', 'Estados Unidos'],
]

const retention = [
  ['Cadastro e tudo o que você lança (transações, recorrentes, orçamentos)', 'Enquanto a conta existir. Ao excluir a conta, são apagados na hora.'],
  ['Cadastros que nunca confirmaram o e-mail e não têm lançamentos', 'Apagados automaticamente 30 dias depois da criação.'],
  ['Cópias de segurança (backup) do banco, criptografadas', '30 dias. Dados que você excluiu podem continuar nessas cópias até elas serem apagadas, sem nenhum uso.'],
  ['Data e versão em que você aceitou os Termos e esta Política', 'Enquanto a conta existir.'],
  ['Tentativas de login com senha errada (e-mail e endereço IP)', '24 horas.'],
  ['Links de confirmação de e-mail e de nova senha', 'Valem por 24 horas e 30 minutos, respectivamente, e são apagados um dia depois de vencer.'],
  ['Registros de erros técnicos e registros de acesso dos provedores de hospedagem', 'Pelo prazo de retenção de cada provedor; são apagados automaticamente.'],
  ['Mensagens e pedidos de orçamento que não viram contrato', 'Até 24 meses depois do último contato.'],
  ['Lista de espera do site (e-mail e produto)', 'Até você sair da lista, até o aviso de lançamento ser enviado ou por no máximo 24 meses. Pedidos não confirmados são apagados em 7 dias.'],
]

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidade">
      <p>
        Esta Política explica como o {LEGAL.appName} coleta, usa, armazena e protege seus dados pessoais,
        em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018, "LGPD"). Ela vale
        para o {LEGAL.appName} ({LEGAL.site} e o app instalável) e para o site da Valtrea (www.valtrea.com.br).
      </p>

      <Section title="1. Quem é o responsável pelos seus dados">
        <p>
          O controlador dos dados pessoais tratados no {LEGAL.appName} é {LEGAL.controller}
          {LEGAL.controllerDocument ? ` (${LEGAL.controllerDocument})` : ''}, {LEGAL.controllerType}, com
          foro em {LEGAL.forum}. Para qualquer assunto relacionado aos seus dados, use o canal: <Email />.
        </p>
        <p>
          <strong>Encarregado pelo tratamento de dados:</strong> como agente de tratamento de pequeno porte, não
          indicamos um encarregado, conforme a Resolução CD/ANPD nº 2/2022. O canal de comunicação sobre seus
          dados é o e-mail <Email />, respondido diretamente pelo responsável.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p>
          <strong>Dados de cadastro:</strong> nome, sobrenome, e-mail e senha. A senha é armazenada apenas
          em forma criptografada (hash), e nem nós conseguimos lê-la.
        </p>
        <p>
          <strong>Dados que você cadastra no uso do serviço:</strong> as transações que você registra, com
          nome, valor, data, tipo (ganho, gasto ou investimento) e categoria, além das contas recorrentes e
          dos limites de orçamento que você definir.
        </p>
        <p>
          <strong>Assistente (lançar conversando):</strong> as mensagens que você escreve no assistente são
          interpretadas pelo próprio {LEGAL.appName}, sem enviar nada a serviços de inteligência artificial de
          terceiros. O texto da conversa não é guardado no servidor: ficam só os lançamentos que ele criar e as
          palavras que você ensinar a ele (por exemplo, que "zezinho" é Lazer), as perguntas e preferências que
          você ensinar e confirmar (como o que mostrar quando você pergunta "quanto sobrou" ou um apelido), uma
          indicação do seu jeito de escrever (mais formal ou informal, com ou sem emoji) para responder no mesmo
          tom e, por 30 minutos, um resumo do assunto da conversa (por exemplo, "gastos com Alimentação neste
          mês"), para entender perguntas como "e ontem?". Você pode ver e apagar o que ele aprendeu a qualquer
          momento, e isso também sai na exportação dos seus dados.
        </p>
        <p>
          <strong>Dados recebidos da carteira Valtrea Pay (só se você conectar):</strong> se você gerar um
          código de conexão no painel e informá-lo no Valtrea Pay, passamos a receber de lá os pagamentos
          enviados e recebidos na carteira (nome, valor, data e tipo, que viram transações no{' '}
          {LEGAL.appName}) e o saldo atual da carteira. Do código de conexão guardamos apenas uma versão
          criptografada (hash).
        </p>
        <p>
          <strong>Mensagens e pedidos de orçamento:</strong> se você nos escrever pelo e-mail de contato ou pelo
          site da Valtrea, recebemos seu nome, seu e-mail, o conteúdo da mensagem e o que mais você decidir
          enviar.
        </p>
        <p id="lista-de-espera" className="scroll-mt-6">
          <strong>Lista de espera dos produtos em desenvolvimento:</strong> se você pedir um aviso de lançamento
          (“Quero ser avisado”) no site da Valtrea, guardamos apenas o seu e-mail, o produto escolhido e as datas
          do pedido e da confirmação. A inscrição só vale depois que você confirma pelo link enviado ao seu
          e-mail. Usamos o endereço só para avisar quando aquele produto estiver disponível, sem publicidade de
          outros produtos. O mesmo link do e-mail permite sair da lista a qualquer momento, e o e-mail é apagado
          na hora.
        </p>
        <p>
          <strong>Dados de controle da conta:</strong> data de confirmação do e-mail, data e versão em que
          você aceitou estes documentos, e registros temporários usados para recuperação de senha e
          confirmação de e-mail.
        </p>
        <p>
          <strong>Dados técnicos:</strong> endereço IP, data e hora de acesso e informações do navegador,
          registrados automaticamente pelos nossos provedores de infraestrutura para fins de segurança e
          funcionamento.
        </p>
        <p id="cookies" className="scroll-mt-6">
          <strong>Cookies e armazenamento no seu dispositivo:</strong> guardamos no navegador apenas o que é necessário
          para manter você conectado (identificadores de sessão; o de renovação fica num cookie protegido, que só a
          API do Valtrea lê, válido por até 30 dias) e permitir que o app funcione instalado. Não
          usamos cookies de publicidade nem ferramentas de rastreamento de terceiros, e as fontes do site são
          servidas pelo próprio Valtrea, sem acessar servidores de terceiros. Também guardamos se você
          já viu o aviso de cookies, para não mostrá-lo de novo, e, se você escolher o tema claro no rodapé, essa
          preferência. Como tudo isso é essencial para o serviço
          funcionar, não pedimos consentimento; se você limpar os dados do navegador, será desconectado.
        </p>
      </Section>

      <Section title="3. Para que usamos seus dados e com qual base legal">
        <List
          items={[
            'Criar e manter sua conta, autenticar seu acesso e exibir suas informações financeiras (execução de contrato, art. 7º, V, da LGPD).',
            'Enviar e-mails essenciais, como confirmação de cadastro, recuperação de senha e confirmação de exclusão de conta (execução de contrato, art. 7º, V).',
            'Entender as mensagens do assistente, lançar o que você pedir e lembrar das categorias que você ensinou (execução de contrato, a seu pedido, art. 7º, V).',
            'Lançar automaticamente os pagamentos da carteira Valtrea Pay e mostrar o saldo dela, quando você conecta as duas contas (execução de contrato, a seu pedido, art. 7º, V).',
            'Proteger o serviço contra fraudes, abusos e acessos indevidos, registrar erros técnicos para corrigir falhas e manter cópias de segurança (legítimo interesse, art. 7º, IX).',
            'Guardar a data e a versão em que você aceitou os Termos e esta Política, para comprovar o aceite (exercício regular de direitos, art. 7º, VI).',
            'Responder às mensagens e aos pedidos de orçamento que você nos enviar (procedimentos preliminares a contrato, art. 7º, V).',
            'Avisar sobre o lançamento de um produto em desenvolvimento, só se você se inscrever e confirmar pelo e-mail (consentimento, art. 7º, I). Você pode retirar o consentimento a qualquer momento pelo link do e-mail.',
            'Cumprir obrigações legais e atender a ordens de autoridades competentes (obrigação legal, art. 7º, II).',
          ]}
        />
        <p>
          <strong>Não vendemos seus dados</strong>, não os compartilhamos para fins de publicidade e não os
          usamos para traçar perfil de consumo.
        </p>
      </Section>

      <Section title="4. Com quem compartilhamos">
        <p>
          Para funcionar, o {LEGAL.appName} usa provedores de tecnologia que tratam dados em nosso nome
          (operadores), apenas para as finalidades descritas aqui:
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Provedor</th>
                <th className="px-4 py-2 font-medium">Finalidade</th>
                <th className="px-4 py-2 font-medium">Localização</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(([name, purpose, place]) => (
                <tr key={name} className="border-t border-border">
                  <td className="px-4 py-2 font-semibold">{name}</td>
                  <td className="px-4 py-2">{purpose}</td>
                  <td className="px-4 py-2">{place}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Valtrea Pay:</strong> a integração funciona em um só sentido. O Valtrea Pay envia pagamentos
          e saldo para o {LEGAL.appName}, mas o código de conexão não permite ler nenhum dado seu daqui: suas
          transações, orçamentos e dados de cadastro não são enviados ao Valtrea Pay.
        </p>
        <p>
          Também podemos compartilhar dados quando exigido por lei, ordem judicial ou requisição de
          autoridade competente.
        </p>
      </Section>

      <Section title="5. Transferência internacional">
        <p>
          Parte dos provedores listados processa dados fora do Brasil, principalmente nos Estados Unidos.
          Essas transferências ocorrem apenas para viabilizar o serviço e com provedores que adotam medidas
          de segurança e proteção de dados compatíveis com a LGPD, nos termos do art. 33 da lei.
        </p>
      </Section>

      <Section title="6. Como protegemos seus dados">
        <List
          items={[
            'Toda a comunicação com o site e a API é criptografada (HTTPS).',
            'Senhas são armazenadas com criptografia de mão única (bcrypt).',
            'As sessões expiram automaticamente e são renovadas de forma segura.',
            'Links de recuperação de senha e de confirmação de e-mail expiram e só podem ser usados uma vez.',
            'Cada usuário só tem acesso às próprias transações.',
            'Tentativas seguidas de senha errada bloqueiam o login temporariamente, e o número de acessos por endereço IP é limitado para impedir abusos.',
            'Uma cópia de segurança do banco de dados é feita todo dia, criptografada.',
          ]}
        />
        <p>
          Nenhum sistema é totalmente imune a incidentes. Se ocorrer um incidente de segurança que possa
          causar risco ou dano relevante, comunicaremos os titulares afetados e a Autoridade Nacional de
          Proteção de Dados (ANPD), conforme a LGPD.
        </p>
      </Section>

      <Section title="7. Por quanto tempo guardamos">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Dado</th>
                <th className="px-4 py-2 font-medium">Por quanto tempo</th>
              </tr>
            </thead>
            <tbody>
              {retention.map(([data, period]) => (
                <tr key={data} className="border-t border-border align-top">
                  <td className="px-4 py-2 font-semibold">{data}</td>
                  <td className="px-4 py-2">{period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Ao desconectar o Valtrea Pay, o código de conexão é apagado e o saldo da carteira deixa de ser
          exibido; as transações que já tinham sido lançadas continuam na sua conta até você excluí-las.
        </p>
        <p>
          Podemos guardar por mais tempo apenas o que a lei exigir ou o que for necessário para defender
          direitos em processo judicial ou administrativo.
        </p>
      </Section>

      <Section id="direitos" title="8. Seus direitos">
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <List
          items={[
            'confirmar se tratamos seus dados e acessá-los;',
            'corrigir dados incompletos, inexatos ou desatualizados;',
            'pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desconformidade com a lei;',
            'pedir a portabilidade dos seus dados;',
            'pedir a eliminação dos seus dados e a exclusão da conta;',
            'saber com quais entidades compartilhamos seus dados;',
            'revogar consentimentos e se opor a tratamentos, nos casos previstos em lei.',
          ]}
        />
        <p>
          Em <strong>Minha conta</strong> você corrige seus dados, baixa uma cópia completa deles (botão{' '}
          <strong>Baixar meus dados</strong>, em formato JSON, que outros serviços conseguem ler) e exclui sua
          conta. Para os demais pedidos, escreva para <Email />. Responderemos em até 15 dias. Você também pode
          apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </Section>

      <Section title="9. Crianças e adolescentes">
        <p>
          O {LEGAL.appName} não é destinado a crianças (menores de 12 anos), que não podem criar conta.
          Adolescentes de 12 a 17 anos só podem usar o serviço com autorização dos pais ou responsáveis legais.
        </p>
        <p>
          Tratamos os dados de adolescentes no seu melhor interesse (art. 14 da LGPD): não exibimos publicidade,
          não traçamos perfil de consumo e coletamos apenas o necessário para o serviço funcionar. Pais e
          responsáveis podem pedir acesso, correção ou exclusão desses dados pelo canal <Email />. Se
          identificarmos conta de criança, ou de adolescente sem autorização, ela será excluída.
        </p>
      </Section>

      <Section title="10. Alterações desta Política">
        <p>
          Podemos atualizar esta Política. A data da última atualização aparece no topo da página. Mudanças
          relevantes serão comunicadas por aviso no painel ou por e-mail, e pediremos sua confirmação.
        </p>
      </Section>

      <Section title="11. Contato">
        <p>
          Dúvidas sobre esta Política ou sobre seus dados: <Email />. Veja também os{' '}
          <Link to="/termos" className="font-semibold text-primary hover:underline">
            Termos de uso
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}
