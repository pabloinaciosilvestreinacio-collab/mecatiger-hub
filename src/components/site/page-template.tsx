import { ArrowUpRight, Construction } from "lucide-react";
import { Link } from "@tanstack/react-router";
import teamImage from "@/assets/mecatiger-team-placeholder.jpg";
import engineeringImage from "@/assets/mecatiger-engineering-placeholder.jpg";
import type { PageContent } from "@/content/site-content";
import { SiteShell } from "./site-shell";

export function PageTemplate({ content, kind }: { content: PageContent; kind: string }) {
  const image = kind === "equipe" || kind === "comunidade" || kind === "galeria" ? teamImage : engineeringImage;
  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-border pt-18">
        <img src={image} alt="Imagem conceitual provisória — substituir por fotografia oficial da MECATIGER" width={1600} height={1072} className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/30" />
        <div className="technical-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto flex min-h-[500px] max-w-7xl flex-col justify-end px-5 pb-14 pt-32 sm:px-6 lg:px-8">
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="mt-4 max-w-5xl font-display text-6xl leading-[0.9] text-foreground sm:text-8xl lg:text-9xl">{content.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{content.intro}</p>
          <span className="mt-6 inline-flex w-fit items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary"><Construction className="size-4" /> Conteúdo em preparação</span>
        </div>
      </section>
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {content.sections.map((section, index) => (
              <article key={section.title} className="group min-h-56 bg-card p-6 transition-colors hover:bg-accent">
                <div className="flex items-start justify-between gap-4"><span className="font-display text-3xl text-primary">{String(index + 1).padStart(2, "0")}</span><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div>
                <h2 className="mt-8 font-display text-3xl text-foreground">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.copy}</p>
                {section.items && <ul className="mt-5 grid gap-2 border-t border-border pt-4">{section.items.map((item) => <li key={item} className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item}</li>)}</ul>}
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em]">Próxima etapa</p><h2 className="mt-2 font-display text-4xl sm:text-5xl">Envie o conteúdo oficial.</h2></div>
          <Link to="/contato" className="inline-flex h-12 items-center justify-center border border-primary-foreground/30 bg-background px-6 text-sm font-bold uppercase text-foreground">Falar com a equipe</Link>
        </div>
      </section>
    </SiteShell>
  );
}
