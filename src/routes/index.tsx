import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, CircuitBoard, Cpu, Globe2, Handshake, Instagram, Radio, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/site-shell";
import { engineeringAreas, impactMetrics, robotSystems } from "@/content/site-content";
import robotHero from "@/assets/mecatiger-robot-hero.jpg";
import teamImage from "@/assets/mecatiger-team-placeholder.jpg";
import engineeringImage from "@/assets/mecatiger-engineering-placeholder.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MECATIGER FTC #32578 — Maracanaú, Ceará" },
      { name: "description", content: "Site oficial da MECATIGER FTC #32578. Engenharia, tecnologia e comunidade de Maracanaú, Ceará." },
      { property: "og:title", content: "MECATIGER FTC #32578" },
      { property: "og:description", content: "Sonhamos alto. Projetamos com precisão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const sectionLinks = [
  { label: "Comunidade", title: "Conhecimento não precisa de fronteiras.", copy: "Uma futura rede para aproximar equipes, estudantes, mentores e profissionais STEM.", to: "/comunidade", icon: Globe2 },
  { label: "Projetos", title: "Ideias que saem da oficina.", copy: "Iniciativas técnicas, educacionais e comunitárias documentadas com transparência.", to: "/projetos", icon: CircuitBoard },
] as const;

function ArrowLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-primary transition-[gap] hover:gap-3">{children}<ArrowRight className="size-4" /></Link>;
}

function HomePage() {
  return (
    <SiteShell>
      <section className="relative min-h-[min(900px,100svh)] overflow-hidden pt-18">
        <img src={robotHero} alt="Robô conceitual provisório em arena escura — substituir por fotografia oficial da Mequinha" width={1440} height={1920} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[60%_58%] md:object-[75%_60%]" />
        <div className="hero-scrim absolute inset-0" />
        <div className="technical-grid absolute inset-0 opacity-20" />
        <div className="kinetic-one absolute -left-24 top-48 h-36 w-[135%] bg-primary/10 backdrop-blur-md" />
        <div className="kinetic-two absolute -right-24 top-[55%] h-20 w-[130%] bg-foreground/5 backdrop-blur-sm" />
        <div className="relative mx-auto flex min-h-[calc(min(900px,100svh)-4.5rem)] max-w-7xl flex-col justify-end px-5 pb-12 sm:px-6 md:pb-16 lg:px-8">
          <div className="reveal-one inline-flex w-fit items-center gap-2 border border-primary/35 bg-background/65 px-3 py-2 backdrop-blur-md"><span className="size-1.5 bg-primary" /><span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">FTC Team #32578</span></div>
          <h1 className="reveal-two mt-5 font-display text-[clamp(4.8rem,16vw,11rem)] leading-[0.78] text-foreground">MECATIGER</h1>
          <div className="reveal-two mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span>Maracanaú — Ceará — Brasil</span><span>BIOBUZZ 2026–2027</span></div>
          <p className="reveal-three mt-5 max-w-xl font-display text-3xl leading-none text-foreground sm:text-4xl">Sonhamos alto. <span className="text-primary">Projetamos com precisão.</span></p>
          <div className="reveal-three mt-7 flex flex-col gap-3 sm:flex-row">
            <Button variant="industrial" size="lg" asChild><Link to="/equipe">Conheça a equipe <ArrowRight /></Link></Button>
            <Button variant="industrialOutline" size="lg" asChild><Link to="/robo">Conheça a Mequinha <ArrowRight /></Link></Button>
          </div>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Imagem conceitual provisória · aguardando fotografia oficial</p>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          {[['32578','FTC Team'],['2025','Rookie year'],['06','Sistemas'],['CE','Maracanaú']].map(([value,label]) => <div key={label} className="px-5 py-6 sm:px-8"><p className="font-display text-4xl text-primary sm:text-5xl">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p></div>)}
        </div>
      </section>

      <section className="section-band relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:px-8">
          <div>
            <span className="eyebrow">Quem somos</span>
            <h2 className="mt-5 max-w-xl font-display text-6xl leading-[0.9] sm:text-8xl">Somos a <span className="text-primary">MECATIGER</span></h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">Somos uma equipe de robótica de Maracanaú, Ceará, formada por estudantes apaixonados por tecnologia, engenharia e inovação.</p>
            <ArrowLink to="/equipe">Conheça nossa equipe</ArrowLink>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border border-border">
            <img src={teamImage} alt="Imagem conceitual provisória de estudantes trabalhando em um robô" loading="lazy" width={1600} height={1072} className="h-full w-full object-cover" />
            <div className="photo-scrim absolute inset-0" /><p className="absolute bottom-4 left-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fotografia provisória · substituir por registro oficial</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div><span className="eyebrow">Nosso robô</span><h2 className="mt-5 font-display text-7xl leading-none sm:text-9xl">MEQUINHA</h2><p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-primary">BIOBUZZ 2026–2027</p></div>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">A arquitetura já está preparada para receber documentação, fotos, vídeos, CAD e especificações oficiais de cada mecanismo.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3">
            {robotSystems.map((system,index) => <Link key={system} to="/robo" className="group min-h-44 bg-background p-5 transition-colors hover:bg-accent"><span className="font-display text-3xl text-primary">{String(index+1).padStart(2,'0')}</span><h3 className="mt-10 font-display text-3xl text-foreground">{system}</h3><p className="mt-2 text-xs text-muted-foreground">Especificações em preparação</p></Link>)}
          </div>
          <ArrowLink to="/robo">Explorar a Mequinha</ArrowLink>
        </div>
      </section>

      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <span className="eyebrow">MECATIGER em números</span><h2 className="mt-5 max-w-3xl font-display text-6xl leading-[0.9] sm:text-8xl">Nosso impacto <span className="text-primary">não para na arena.</span></h2>
          <div className="mt-10 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">{impactMetrics.map((label) => <div key={label} className="bg-card p-5 sm:p-7"><p className="font-display text-4xl text-foreground sm:text-5xl">0</p><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p></div>)}</div>
          <p className="mt-4 text-xs text-muted-foreground">Indicadores aguardando dados reais. Visitantes, membros, equipes, interações e mentorias serão métricas distintas.</p>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border bg-card section-band">
        <img src={engineeringImage} alt="Imagem conceitual provisória de mecanismo robótico" loading="lazy" width={1600} height={1072} className="absolute inset-0 h-full w-full object-cover opacity-25" /><div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/45" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><span className="eyebrow">Nossa engenharia</span><h2 className="mt-5 font-display text-6xl sm:text-8xl">Projetar. Testar. Evoluir.</h2>
          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-2">{engineeringAreas.map(([title,copy],index) => <Link key={title} to="/engenharia" className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 bg-background/90 p-5 backdrop-blur-sm hover:bg-accent"><span className="font-display text-2xl text-primary">{String(index+1).padStart(2,'0')}</span><span><strong className="block font-display text-2xl text-foreground">{title}</strong><small className="text-sm text-muted-foreground">{copy}</small></span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div>
        </div>
      </section>

      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-5"><div><span className="eyebrow">Diário da temporada</span><h2 className="mt-5 font-display text-6xl sm:text-8xl">MECATIGER LOG</h2></div><Link to="/diario" className="hidden text-sm font-bold uppercase text-primary sm:inline">Ver diário</Link></div>
          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">{["Montagem da garra","Navegação autônoma","Software da Mequinha"].map((title,index) => <Link key={title} to="/diario" className="group bg-card p-6"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Exemplo provisório · 0{index+1}</span><h3 className="mt-12 font-display text-4xl leading-none text-foreground">{title}</h3><p className="mt-4 text-sm text-muted-foreground">Este tema não representa um registro oficial e será substituído.</p><ArrowRight className="mt-6 size-5 text-primary transition-transform group-hover:translate-x-1" /></Link>)}</div>
        </div>
      </section>

      <section className="border-y border-border bg-card section-band">
        <div className="mx-auto grid max-w-7xl gap-px border border-border bg-border md:grid-cols-2">{sectionLinks.map(({label,title,copy,to,icon:Icon}) => <article key={label} className="bg-background p-7 sm:p-10"><Icon className="size-7 text-primary" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-primary">{label}</p><h2 className="mt-3 max-w-lg font-display text-5xl leading-none sm:text-6xl">{title}</h2><p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{copy}</p><ArrowLink to={to}>Explorar {label}</ArrowLink></article>)}</div>
      </section>

      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><div className="grid gap-px border border-border bg-border lg:grid-cols-2">
          <article className="bg-card p-7 sm:p-10"><Handshake className="size-7 text-primary" /><span className="mt-8 block text-xs font-bold uppercase tracking-[0.14em] text-primary">Parceiros</span><h2 className="mt-3 font-display text-6xl leading-none">Apoie a MECATIGER</h2><p className="mt-5 max-w-xl text-muted-foreground">Patrocinadores, apoiadores e instituições ajudam a transformar aprendizado em oportunidade.</p><ArrowLink to="/parceiros">Seja nosso parceiro</ArrowLink></article>
          <article className="relative overflow-hidden bg-background p-7 sm:p-10"><div className="technical-grid absolute inset-0 opacity-40" /><div className="relative"><Bot className="size-7 text-primary" /><span className="mt-8 block text-xs font-bold uppercase tracking-[0.14em] text-primary">Interface conceitual</span><h2 className="mt-3 font-display text-6xl leading-none">MECA AI</h2><p className="mt-2 font-display text-3xl text-muted-foreground">Conheça a Meca Tiger.</p><div className="mt-8 border border-border bg-card p-4"><div className="flex items-center gap-3"><Radio className="size-4 text-primary" /><span className="text-xs font-bold uppercase tracking-[0.1em]">Base em preparação</span></div><p className="mt-4 text-sm text-muted-foreground">“Como funciona a Mequinha?”</p></div><ArrowLink to="/meca-ai">Abrir interface</ArrowLink></div></article>
        </div></div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em]">Contato</p><h2 className="mt-3 max-w-3xl font-display text-6xl leading-[0.9] sm:text-8xl">Não precisamos estar juntos para construir juntos.</h2></div><div className="flex flex-col gap-3"><Button variant="industrialOutline" size="lg" asChild><Link to="/contato">Fale com a equipe <ArrowRight /></Link></Button><a href="https://www.instagram.com/mecatiger_ftc/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 text-sm font-bold uppercase"><Instagram className="size-4" /> @mecatiger_ftc</a></div></div>
      </section>
    </SiteShell>
  );
}
