# Plano de Resposta a Incidentes de Segurança

Documento interno. Base: LGPD arts. 46 a 48; Resolução CD/ANPD nº 15/2024.

**Responsável:** João Adolfo Martins Araújo · **Atualizado em:** 04/11/2026

## 1. O que é incidente

Qualquer evento que comprometa a confidencialidade, a integridade ou a disponibilidade de dados pessoais: vazamento, acesso indevido, perda, chave ou senha exposta (inclusive em print ou mensagem), banco aberto, e-mail enviado para a pessoa errada, computador ou celular perdido com acesso aos painéis.

## 2. Responsáveis

| Papel | Pessoa | Contato |
|------|--------|---------|
| Coordenação e decisão | João Adolfo Martins Araújo | contato@valtrea.com.br |
| Técnico (contenção) | João Adolfo Martins Araújo | contato@valtrea.com.br |
| Comunicação com ANPD e titulares | João Adolfo Martins Araújo | contato@valtrea.com.br |
| Apoio jurídico | A definir | — |

## 3. Passo a passo

1. **Detectar e registrar:** data e hora, como foi descoberto, o que foi afetado. Guarde prints, logs do Render e eventos do Sentry.
2. **Conter (na hora):**
   - Segredo exposto: gerar novos `JWT_ACCESS_TOKEN_SECRET` e `JWT_REFRESH_TOKEN_SECRET` no Render (derruba todas as sessões), trocar a senha do banco no Neon e atualizar o `DATABASE_URL` no Render e no GitHub, gerar nova chave da Resend.
   - Conta de usuário invadida: forçar a troca de senha (a redefinição encerra as outras sessões).
   - Se preciso, suspender o serviço no Render (Suspend) até entender o problema.
3. **Avaliar:** quais dados, quantos titulares, se há adolescentes, dados financeiros ou de autenticação, e se há risco ou dano relevante aos titulares.
4. **Comunicar:** havendo risco ou dano relevante, comunicar a **ANPD e os titulares em até 3 dias úteis** (Resolução CD/ANPD nº 15/2024), pelo canal oficial em gov.br/anpd. Informar: natureza dos dados, titulares envolvidos, medidas de segurança, riscos, motivo de eventual demora e medidas adotadas.
5. **Corrigir a causa** e verificar se não há outro ponto com o mesmo problema. Abrir um pull request com a correção, para passar pelos testes automáticos.
6. **Registrar** o incidente, mesmo os não comunicados, e guardar o registro por pelo menos 5 anos (pasta privada, fora do repositório).
7. **Revisar** este plano e os controles.

## 4. Onde agir

- Render (API e variáveis de ambiente): dashboard.render.com
- Neon (banco e senha do banco): console.neon.tech
- Vercel (app e site): vercel.com
- GitHub (código, backups e segredos do Actions): github.com/adolfo-araujo/dashboard
- Resend (e-mails): resend.com
- Sentry (erros): sentry.io
- ANPD (comunicação de incidente): gov.br/anpd

## 5. Restaurar dados

Siga `docs/BACKUP.md`. Sempre restaure primeiro numa branch separada do Neon.

## 6. Modelo de aviso aos titulares

> **Assunto:** Aviso de incidente de segurança envolvendo seus dados no Valtrea
>
> Olá, (nome da pessoa).
>
> Em (data), identificamos (descrição simples do que aconteceu). Os dados envolvidos foram (quais dados).
> Já tomamos as seguintes medidas: (medidas). Recomendamos que você (ex.: troque sua senha do Valtrea e de outros serviços em que use a mesma senha, e desconfie de mensagens pedindo dados).
>
> Para dúvidas, escreva para contato@valtrea.com.br.
