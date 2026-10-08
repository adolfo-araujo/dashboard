import { Link } from 'react-router-dom'
import { LegalLayout, List, Section } from '../components/legal-layout'
import { LEGAL } from '../lib/legal'

const Email = () => (
  <a href={`mailto:${LEGAL.email}`} className="font-semibold text-primary hover:underline">
    {LEGAL.email}
  </a>
)

const providers = [
  ['Vercel', 'hospedagem do site', 'Estados Unidos e rede global'],
  ['Render', 'servidor da aplicação (API)', 'Estados Unidos'],
  ['Neon', 'banco de dados', 'São Paulo, Brasil'],
  ['Resend', 'envio de e-mails do sistema', 'São Paulo, Brasil'],
  ['ImprovMX', 'recebimento das mensagens enviadas ao nosso e-mail de contato', 'Estados Unidos'],
  ['Google Fonts', 'fontes tipográficas carregadas pelo site', 'Estados Unidos'],
]

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidade">
      <p>
        Esta Política explica como o {LEGAL.appName} coleta, usa, armazena e protege seus dados pessoais,
        em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018, "LGPD").
      </p>

      <Section title="1. Quem é o responsável pelos seus dados">
        <p>
          O controlador dos dados pessoais tratados no {LEGAL.appName} é {LEGAL.controller}
          {LEGAL.controllerDocument ? ` (${LEGAL.controllerDocument})` : ''}, {LEGAL.controllerType}, com
          foro em {LEGAL.forum}. Para qualquer assunto relacionado aos seus dados, use o canal: <Email />.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p>
          <strong>Dados de cadastro:</strong> nome, sobrenome, e-mail e senha. A senha é armazenada apenas
          em forma criptografada (hash), e nem nós conseguimos lê-la.
        </p>
        <p>
          <strong>Dados que você cadastra no uso do serviço:</strong> as transações que você registra, com
          nome, valor, data e tipo (ganho, gasto ou investimento).
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
        <p>
          <strong>Armazenamento no seu dispositivo:</strong> guardamos no navegador apenas o que é necessário
          para manter você conectado (identificadores de sessão) e permitir que o app funcione instalado. Não
          usamos cookies de publicidade nem ferramentas de rastreamento de terceiros.
        </p>
      </Section>

      <Section title="3. Para que usamos seus dados">
        <List
          items={[
            'Criar e manter sua conta, autenticar seu acesso e exibir suas informações financeiras (execução de contrato, art. 7º, V, da LGPD).',
            'Enviar e-mails essenciais, como confirmação de cadastro, recuperação de senha e confirmação de exclusão de conta (execução de contrato).',
            'Proteger o serviço contra fraudes, abusos e acessos indevidos (legítimo interesse, art. 7º, IX).',
            'Cumprir obrigações legais e atender a ordens de autoridades competentes (art. 7º, II).',
            'Responder às mensagens que você nos enviar.',
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
          ]}
        />
        <p>
          Nenhum sistema é totalmente imune a incidentes. Se ocorrer um incidente de segurança que possa
          causar risco ou dano relevante, comunicaremos os titulares afetados e a Autoridade Nacional de
          Proteção de Dados (ANPD), conforme a LGPD.
        </p>
      </Section>

      <Section title="7. Por quanto tempo guardamos">
        <p>
          Seus dados ficam armazenados enquanto sua conta existir. Quando você exclui a conta, o cadastro e
          todas as transações são <strong>apagados de forma permanente do nosso banco de dados</strong>{' '}
          imediatamente. Cópias de segurança mantidas pelos provedores de infraestrutura são eliminadas
          automaticamente após um período limitado.
        </p>
        <p>
          Links de recuperação de senha e de confirmação de e-mail expiram em 30 minutos e 24 horas,
          respectivamente. Registros técnicos de acesso podem ser mantidos pelo tempo exigido por lei.
        </p>
      </Section>

      <Section title="8. Seus direitos">
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
          Você pode corrigir seus dados e excluir sua conta diretamente em <strong>Minha conta</strong>. Para
          os demais pedidos, escreva para <Email />. Responderemos em até 15 dias. Você também pode
          apresentar reclamação à ANPD.
        </p>
      </Section>

      <Section title="9. Crianças e adolescentes">
        <p>
          O {LEGAL.appName} não é direcionado a menores de 18 anos. Se identificarmos dados de menores
          cadastrados sem autorização dos responsáveis, eles serão excluídos.
        </p>
      </Section>

      <Section title="10. Alterações desta Política">
        <p>
          Podemos atualizar esta Política. A data da última atualização aparece no topo da página. Mudanças
          relevantes serão comunicadas por e-mail ou por aviso no site.
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
