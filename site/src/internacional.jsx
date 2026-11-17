import { useEffect } from 'react'
import { ArrowUpRight, CheckCircle2, Globe, LayoutDashboard, Mail, MapPin, ServerCog, ShieldCheck, Wrench } from 'lucide-react'
import { COMPANY } from './config'
import { BotaoTema } from './components/tema'
import { MenuCelular } from './App'

// Versão em inglês (/en) e espanhol (/es) do site da empresa. Os produtos continuam em português, para o Brasil.
const TEXTOS = {
  en: {
    lang: 'en',
    titulo: 'Valtrea | Websites, web systems and digital products',
    descricao: 'Valtrea builds websites, custom web systems and digital products for companies and professionals, from the domain to the dashboard, with support after delivery.',
    pular: 'Skip to content',
    nav: ['Services', 'Products', 'How we work', 'Security'],
    contato: 'Contact us',
    h1: 'Custom technology to help your business grow.',
    sub: 'Valtrea builds websites, web systems and digital products. From the domain to the management dashboard, with quality code and support after delivery.',
    cta: ['Request a quote', 'See our products'],
    local: `${COMPANY.city}, Brazil · we work remotely`,
    servicosTitulo: 'What we do for your company',
    servicos: [
      [Globe, 'Websites and landing pages', 'Company websites, launch pages and portfolios. Fast, great on mobile and ready to be found on Google.'],
      [LayoutDashboard, 'Custom web systems', 'Management dashboards, client areas, inventory or finance control. With secure login, database and reports.'],
      [ServerCog, 'Complete online presence', 'Your own domain, professional email with your company name and hosting, set up the right way.'],
      [Wrench, 'Monthly maintenance', 'Updates, backups, fixes and small improvements, so your system keeps working after delivery.'],
    ],
    produtosTitulo: 'Our products',
    produtosSub: 'Besides building for clients, we create our own products. They show in practice what we deliver. They are available in Portuguese, for Brazil.',
    produtos: [
      ['Valtrea Finance', 'Free personal finance: income, expenses, budgets and yearly reports.', 'https://finance.valtrea.com.br'],
      ['Valtrea Agora', 'Find open slots at salons and barbershops nearby and book in seconds.', 'https://agora.valtrea.com.br'],
      ['Valtrea Volta', 'QR code tags for your belongings: whoever finds them can reach you without seeing your phone.', 'https://volta.valtrea.com.br'],
      ['Valtrea Pulso', 'Neighbours propose and support improvements for their neighbourhood.', 'https://pulso.valtrea.com.br'],
    ],
    abrir: 'Open',
    passosTitulo: 'How we work',
    passos: [
      ['Conversation', 'We understand your business and the problem the website or system must solve.'],
      ['Proposal', 'You get a fixed scope, deadline and price, in writing, before any payment.'],
      ['Development', 'Partial deliveries so you can follow along and adjust the course during the project.'],
      ['Delivery and support', 'Publishing on your domain, a quick training session and support after launch.'],
    ],
    compromissos: [
      'Scope, deadline and price agreed in writing before we start.',
      'Domain, accounts and code registered in the client’s name.',
      'Security and data protection following Brazilian law (LGPD) from day one.',
      'Everything designed for mobile first.',
    ],
    segurancaTitulo: 'Security',
    seguranca: [
      'Always-encrypted connections (HTTPS) on every product.',
      'Passwords stored only as bcrypt hashes; we cannot read them.',
      'Attempt limits on sign-in and verification codes.',
      'No ads and no trackers: cookies only keep you signed in.',
    ],
    contatoTitulo: 'Let’s talk about your project?',
    contatoSub: 'Tell us what you need. We reply by email with the next steps, with no commitment. We write in English, Spanish or Portuguese.',
    assunto: 'Quote request from the website',
    rodape: ['Privacy policy (Portuguese)', 'Português', 'Español'],
    tema: ['Dark theme', 'Light theme'],
  },
  es: {
    lang: 'es',
    titulo: 'Valtrea | Sitios web, sistemas web y productos digitales',
    descricao: 'Valtrea crea sitios web, sistemas web a medida y productos digitales para empresas y profesionales, del dominio al panel de gestión, con soporte después de la entrega.',
    pular: 'Saltar al contenido',
    nav: ['Servicios', 'Productos', 'Cómo trabajamos', 'Seguridad'],
    contato: 'Contáctanos',
    h1: 'Tecnología a medida para que tu negocio crezca.',
    sub: 'Valtrea crea sitios web, sistemas web y productos digitales. Del dominio al panel de gestión, con código de calidad y soporte después de la entrega.',
    cta: ['Solicitar presupuesto', 'Ver nuestros productos'],
    local: `${COMPANY.city}, Brasil · trabajamos a distancia`,
    servicosTitulo: 'Lo que hacemos por tu empresa',
    servicos: [
      [Globe, 'Sitios web y páginas de venta', 'Sitio institucional, página de lanzamiento o portafolio. Rápido, bonito en el móvil y preparado para aparecer en Google.'],
      [LayoutDashboard, 'Sistemas web a medida', 'Paneles de gestión, área de clientes, control de inventario o finanzas. Con inicio de sesión seguro, base de datos e informes.'],
      [ServerCog, 'Presencia digital completa', 'Dominio propio, correo profesional con el nombre de tu empresa y hosting configurados correctamente.'],
      [Wrench, 'Mantenimiento mensual', 'Actualizaciones, copias de seguridad, correcciones y pequeñas mejoras, para que tu sistema siga funcionando después de la entrega.'],
    ],
    produtosTitulo: 'Nuestros productos',
    produtosSub: 'Además de desarrollar para clientes, creamos productos propios. Muestran en la práctica lo que entregamos. Están disponibles en portugués, para Brasil.',
    produtos: [
      ['Valtrea Finance', 'Finanzas personales gratis: ingresos, gastos, presupuestos e informe anual.', 'https://finance.valtrea.com.br'],
      ['Valtrea Agora', 'Encuentra horarios libres en peluquerías y barberías cercanas y reserva en segundos.', 'https://agora.valtrea.com.br'],
      ['Valtrea Volta', 'Etiquetas con código QR para tus objetos: quien los encuentre te avisa sin ver tu teléfono.', 'https://volta.valtrea.com.br'],
      ['Valtrea Pulso', 'Los vecinos proponen y apoyan mejoras para su barrio.', 'https://pulso.valtrea.com.br'],
    ],
    abrir: 'Abrir',
    passosTitulo: 'Cómo trabajamos',
    passos: [
      ['Conversación', 'Entendemos tu negocio y el problema que el sitio o sistema debe resolver.'],
      ['Propuesta', 'Recibes alcance, plazo y precio cerrados, por escrito, antes de cualquier pago.'],
      ['Desarrollo', 'Entregas parciales para que acompañes y ajustes el rumbo durante el proyecto.'],
      ['Entrega y soporte', 'Publicación en tu dominio, una capacitación rápida y soporte después del lanzamiento.'],
    ],
    compromissos: [
      'Alcance, plazo y precio acordados por escrito antes de empezar.',
      'Dominio, cuentas y código registrados a nombre del cliente.',
      'Seguridad y protección de datos según la ley brasileña (LGPD) desde el inicio.',
      'Todo pensado primero para el móvil.',
    ],
    segurancaTitulo: 'Seguridad',
    seguranca: [
      'Conexión siempre cifrada (HTTPS) en todos los productos.',
      'Contraseñas guardadas solo como hash bcrypt; no podemos leerlas.',
      'Límite de intentos al iniciar sesión y en los códigos de verificación.',
      'Sin anuncios ni rastreadores: las cookies solo mantienen tu sesión.',
    ],
    contatoTitulo: '¿Hablamos de tu proyecto?',
    contatoSub: 'Cuéntanos lo que necesitas. Respondemos por correo con los próximos pasos, sin compromiso. Escribimos en español, inglés o portugués.',
    assunto: 'Solicitud de presupuesto desde el sitio',
    rodape: ['Política de privacidad (en portugués)', 'Português', 'English'],
    tema: ['Tema oscuro', 'Tema claro'],
  },
}

const btn = {
  primary: 'botao-verde inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-background hover:bg-primary-hover',
  secondary: 'botao-vidro inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 font-semibold text-foreground',
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="26 29 56 56" className="h-9 w-9" aria-hidden="true">
        <path d="M31 35h13l15 32-6 12z" fill="#4A9A28" stroke="#4A9A28" strokeWidth="2.4" strokeLinejoin="round" /><path d="M64 35h13L57 77c-1.5 3-5 3-6.5 0L48 71z" fill="#55B02E" stroke="#55B02E" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
      <span className="text-xl font-semibold tracking-tight">Valtrea</span>
    </span>
  )
}

export function Internacional({ idioma }) {
  const t = TEXTOS[idioma]
  const outro = idioma === 'en' ? 'es' : 'en'

  useEffect(() => {
    document.documentElement.lang = t.lang
    document.title = t.titulo
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.descricao)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://www.valtrea.com.br/${idioma}`)
  }, [idioma, t])

  const ids = ['services', 'products', 'how-we-work', 'security']
  return (
    <div className="min-h-screen">
      <a href="#start" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-background">
        {t.pular}
      </a>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href={`/${idioma}`} aria-label="Valtrea"><Logo /></a>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            {t.nav.map((rotulo, i) => (
              <a key={rotulo} href={`#${ids[i]}`} className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground md:inline">{rotulo}</a>
            ))}
            <MenuCelular itens={ids.map((id, i) => [`#${id}`, t.nav[i]])} rotulo={t.lang === 'en' ? 'Open menu' : 'Abrir menú'} />
            <a href="#contact" className="botao-verde ml-2 inline-flex h-9 items-center rounded-full bg-primary px-4 text-background hover:bg-primary-hover">{t.contato}</a>
          </nav>
        </div>
      </header>

      <main id="start" tabIndex={-1}>
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 lg:pt-28">
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">{t.h1}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{t.sub}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className={btn.primary}>{t.cta[0]}</a>
            <a href="#products" className={btn.secondary}>{t.cta[1]}</a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted"><MapPin className="h-4 w-4" aria-hidden="true" /> {t.local}</p>
        </section>

        <section id="services" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight">{t.servicosTitulo}</h2>
            <div className="mt-12 grid gap-x-12 sm:grid-cols-2">
              {t.servicos.map(([Icone, titulo, texto]) => (
                <div key={titulo} className="flex gap-4 border-t border-border py-7">
                  <Icone className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-bold">{titulo}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted">{texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="scroll-mt-16 border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">{t.produtosTitulo}</h2>
            <p className="mt-3 max-w-2xl text-muted">{t.produtosSub}</p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {t.produtos.map(([nome, texto, url]) => (
                <li key={nome} className="flex flex-col vidro rounded-2xl p-6">
                  <h3 className="font-bold text-primary">{nome}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-muted">{texto}</p>
                  <a href={url} lang="pt-BR" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    {t.abrir} {nome} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how-we-work" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">{t.passosTitulo}</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {t.passos.map(([titulo, texto], i) => (
                <li key={titulo}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary">{i + 1}</span>
                  <h3 className="mt-4 font-bold">{titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{texto}</p>
                </li>
              ))}
            </ol>
            <ul className="mt-16 grid gap-x-12 border-t border-border sm:grid-cols-2">
              {t.compromissos.map((c) => (
                <li key={c} className="flex items-start gap-3 border-b border-border py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="security" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">{t.segurancaTitulo}</h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {t.seguranca.map((s) => (
                <li key={s} className="flex items-start gap-3 vidro rounded-2xl p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact" className="scroll-mt-16 border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">{t.contatoTitulo}</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">{t.contatoSub}</p>
            <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(t.assunto)}`} className={`${btn.primary} mt-8`}>
              <Mail className="h-4 w-4" aria-hidden="true" /> {COMPANY.email}
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted sm:px-6 md:flex-row md:justify-between">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            <a href={`${COMPANY.financeUrl}/privacidade`} lang="pt-BR" className="hover:text-foreground hover:underline">{t.rodape[0]}</a>
            <a href="/" lang="pt-BR" hrefLang="pt-BR" className="hover:text-foreground hover:underline">{t.rodape[1]}</a>
            <a href={`/${outro}`} lang={outro} hrefLang={outro} className="hover:text-foreground hover:underline">{t.rodape[2]}</a>
            <BotaoTema rotulos={t.tema} />
          </nav>
        </div>
      </footer>
    </div>
  )
}
