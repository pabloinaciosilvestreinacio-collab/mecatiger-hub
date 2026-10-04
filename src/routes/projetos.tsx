import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Handshake,
  Lightbulb,
  Network,
  Users,
  Wrench,
} from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";

export const Route = createFileRoute("/projetos")({
  head: () => ({
    meta: [
      {
        title: "Projetos — MECATIGER FTC #32578",
      },
      {
        name: "description",
        content:
          "Conheça os projetos, iniciativas educacionais, ações comunitárias e projetos STEM da MECATIGER FTC #32578.",
      },
      {
        property: "og:title",
        content: "Projetos — MECATIGER FTC #32578",
      },
      {
        property: "og:description",
        content:
          "Projetos e iniciativas da MECATIGER dentro e fora da competição.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: ProjetosPage,
});

const projectTabs = [
  {
    id: "projetos-equipe",
    number: "01",
    label: "Projetos da equipe",
    eyebrow: "Projetos da equipe",
    title: "O QUE A MECATIGER ESTÁ CONSTRUINDO.",
    description:
      "Projetos diretamente ligados à equipe, à temporada BIOBUZZ 2026–2027 e às soluções que estamos desenvolvendo durante nossa evolução na FTC.",
    icon: Wrench,
    cards: [
      {
        number: "01",
        eyebrow: "BIOBUZZ 2026–2027",
        title: "MEQUINHA",
        description:
          "Ainda estamos trabalhando no robô da temporada. A Mequinha está em desenvolvimento e recebe novos mecanismos, testes, ajustes e programação conforme a equipe avança.",
        to: "/robo" as const,
        action: "Acompanhar o robô",
      },
      {
        number: "02",
        eyebrow: "PLATAFORMA DIGITAL",
        title: "MECATIGER HUB",
        description:
          "O próprio Hub é um projeto da equipe: uma plataforma para organizar conhecimento, projetos, documentação e conexões.",
        to: "/" as const,
        action: "Voltar para o Hub",
      },
      {
        number: "03",
        eyebrow: "ENGENHARIA",
        title: "PROCESSO TÉCNICO",
        description:
          "Decisões, testes, erros, ajustes e aprendizados fazem parte do desenvolvimento e serão documentados ao longo da temporada.",
        to: "/engenharia" as const,
        action: "Ver engenharia",
      },
    ],
  },
  {
    id: "iniciativas-educacionais",
    number: "02",
    label: "Iniciativas educacionais",
    eyebrow: "Iniciativas educacionais",
    title: "O QUE APRENDEMOS PODE CONTINUAR.",
    description:
      "A experiência da equipe não precisa ficar restrita aos integrantes. Documentação, estudos e conhecimento podem continuar sendo úteis para outras pessoas.",
    icon: BookOpen,
    cards: [
      {
        number: "01",
        eyebrow: "DOCUMENTAÇÃO",
        title: "CONHECIMENTO ABERTO",
        description:
          "Registros de engenharia, programação, testes e decisões da equipe organizados para facilitar a compreensão do processo.",
        to: "/engenharia" as const,
        action: "Explorar engenharia",
      },
      {
        number: "02",
        eyebrow: "DIÁRIO",
        title: "DIÁRIO DA TEMPORADA",
        description:
          "O registro da evolução da equipe ao longo da temporada, incluindo aprendizados, dificuldades e mudanças de decisão.",
        to: "/diario" as const,
        action: "Ver diário",
      },
      {
        number: "03",
        eyebrow: "CONHECIMENTO",
        title: "MECA AI",
        description:
          "Uma futura ferramenta para tornar o conhecimento produzido pela equipe mais acessível e fácil de consultar.",
        to: "/meca-ai" as const,
        action: "Conhecer MECA AI",
      },
    ],
  },
  {
    id: "acoes-comunitarias",
    number: "03",
    label: "Ações comunitárias",
    eyebrow: "Ações comunitárias",
    title: "A ROBÓTICA TAMBÉM PODE GERAR IMPACTO.",
    description:
      "Ações que aproximam a equipe de outras pessoas, equipes e espaços, usando aquilo que aprendemos para criar novas conexões e oportunidades.",
    icon: Users,
    cards: [
      {
        number: "01",
        eyebrow: "COMUNIDADE FTC",
        title: "CONEXÕES",
        description:
          "Encontrar e aproximar estudantes, equipes, professores, mentores e pessoas que também fazem parte do ecossistema FTC.",
        to: "/comunidade" as const,
        action: "Ir para comunidades",
      },
      {
        number: "02",
        eyebrow: "COMPARTILHAMENTO",
        title: "EXPERIÊNCIAS",
        description:
          "Compartilhar aquilo que aprendemos durante a competição, desde processos técnicos até organização e estratégia.",
        to: "/comunidade" as const,
        action: "Ver comunidades",
      },
      {
        number: "03",
        eyebrow: "COLABORAÇÃO",
        title: "NOVAS CONEXÕES",
        description:
          "Abrir espaço para pessoas, equipes e organizações que queiram conversar, colaborar ou contribuir com a equipe.",
        to: "/contato" as const,
        action: "Falar com a equipe",
      },
    ],
  },
  {
    id: "projetos-stem",
    number: "04",
    label: "Projetos STEM",
    eyebrow: "Projetos STEM",
    title: "APRENDER FAZENDO.",
    description:
      "Projetos que conectam ciência, tecnologia, engenharia e matemática a experiências práticas, problemas reais e desenvolvimento de soluções.",
    icon: Lightbulb,
    cards: [
      {
        number: "01",
        eyebrow: "TECNOLOGIA",
        title: "EXPERIMENTAÇÃO",
        description:
          "Transformar conceitos técnicos em experiências práticas por meio de testes, protótipos e desenvolvimento.",
        to: "/engenharia" as const,
        action: "Ver engenharia",
      },
      {
        number: "02",
        eyebrow: "ENGENHARIA",
        title: "SOLUÇÕES",
        description:
          "Usar conhecimentos de engenharia para investigar problemas, testar hipóteses e desenvolver soluções.",
        to: "/engenharia" as const,
        action: "Explorar processos",
      },
      {
        number: "03",
        eyebrow: "APRENDIZADO",
        title: "FAZER PARA APRENDER",
        description:
          "Projetos práticos como ferramenta para desenvolver raciocínio, criatividade, colaboração e resolução de problemas.",
        to: "/diario" as const,
        action: "Acompanhar evolução",
      },
    ],
  },
] as const;

function ProjectCard({
  number,
  eyebrow,
  title,
  description,
  to,
  action,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  to:
    | "/"
    | "/robo"
    | "/engenharia"
    | "/diario"
    | "/meca-ai"
    | "/comunidade"
    | "/contato";
  action: string;
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-[390px] flex-col bg-card p-7 transition-colors duration-300 hover:bg-accent sm:p-8"
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </span>

        <span className="font-display text-3xl text-primary/35">
          {number}
        </span>
      </div>

      <h3 className="mt-16 max-w-xl font-display text-4xl leading-[0.9] sm:text-5xl">
        {title}
      </h3>

      <p className="mt-5 flex-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-primary transition-[gap] duration-300 group-hover:gap-3">
        {action}
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}

function ProjectSection({
  id,
  number,
  eyebrow,
  title,
  description,
  icon: Icon,
  cards,
}: {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Wrench;
  cards: readonly {
    number: string;
    eyebrow: string;
    title: string;
    description: string;
    to:
      | "/"
      | "/robo"
      | "/engenharia"
      | "/diario"
      | "/meca-ai"
      | "/comunidade"
      | "/contato";
    action: string;
  }[];
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-border bg-background section-band"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <div className="flex size-14 items-center justify-center border border-primary/25 bg-card">
              <Icon className="size-6 text-primary" />
            </div>

            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {number} / {eyebrow}
            </p>

            <h2 className="mt-5 max-w-4xl font-display text-6xl leading-[0.85] sm:text-8xl">
              {title}
            </h2>
          </div>

          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {description}
          </p>
        </div>

        <div className="mt-14 grid gap-px border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <ProjectCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjetosPage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative min-h-[650px] overflow-hidden border-b border-border bg-background pt-18">
        <div className="technical-grid absolute inset-0 opacity-30" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,hsl(var(--primary)/0.14),transparent_34%)]" />

        <div className="absolute -right-40 top-24 size-[34rem] rotate-45 border border-primary/15" />

        <div className="absolute -right-10 top-48 size-[22rem] rotate-45 border border-primary/10" />

        <div className="absolute left-[-15%] top-[78%] h-px w-[130%] rotate-[-7deg] bg-primary/20" />

        <div className="relative mx-auto flex min-h-[650px] max-w-7xl flex-col justify-end px-5 pb-14 sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            01 / Projetos
          </span>

          <h1 className="mt-5 max-w-6xl font-display text-7xl leading-[0.8] sm:text-9xl">
            PROJETOS
            <br />
            QUE VIRAM
            <br />
            <span className="text-primary">
              EXPERIÊNCIA.
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            O que construímos, o que aprendemos e o impacto que queremos
            gerar dentro e fora da equipe.
          </p>
        </div>
      </section>

      {/* NAVEGAÇÃO DAS CATEGORIAS */}
      <section className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <nav className="grid overflow-x-auto border-x border-border md:grid-cols-2 xl:grid-cols-4">
            {projectTabs.map(
              ({ id, number, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="group min-h-36 border-r border-border bg-background p-6 text-left transition-colors duration-300 last:border-r-0 hover:bg-accent sm:p-7"
                >
                  <div className="flex items-start justify-between">
                    <Icon className="size-5 text-primary" />

                    <span className="font-display text-3xl text-primary/35">
                      {number}
                    </span>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-4">
                    <span className="font-display text-2xl leading-none sm:text-3xl">
                      {label}
                    </span>

                    <ArrowDownRight className="size-4 text-primary transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
                  </div>
                </a>
              ),
            )}
          </nav>
        </div>
      </section>

      {/* 01 — PROJETOS DA EQUIPE */}
      <ProjectSection
        id="projetos-equipe"
        number="01"
        eyebrow="Projetos da equipe"
        title="O QUE A MECATIGER ESTÁ CONSTRUINDO."
        description="Projetos diretamente ligados à equipe, à temporada BIOBUZZ 2026–2027 e às soluções que estamos desenvolvendo durante nossa evolução na FTC."
        icon={Wrench}
        cards={projectTabs[0].cards}
      />

      {/* 02 — INICIATIVAS EDUCACIONAIS */}
      <ProjectSection
        id="iniciativas-educacionais"
        number="02"
        eyebrow="Iniciativas educacionais"
        title="O QUE APRENDEMOS PODE CONTINUAR."
        description="A experiência da equipe não precisa ficar restrita aos integrantes. Documentação, estudos e conhecimento podem continuar sendo úteis para outras pessoas."
        icon={BookOpen}
        cards={projectTabs[1].cards}
      />

      {/* 03 — AÇÕES COMUNITÁRIAS */}
      <ProjectSection
        id="acoes-comunitarias"
        number="03"
        eyebrow="Ações comunitárias"
        title="A ROBÓTICA TAMBÉM PODE GERAR IMPACTO."
        description="Ações que aproximam a equipe de outras pessoas, equipes e espaços, usando aquilo que aprendemos para criar novas conexões e oportunidades."
        icon={Users}
        cards={projectTabs[2].cards}
      />

      {/* 04 — PROJETOS STEM */}
      <ProjectSection
        id="projetos-stem"
        number="04"
        eyebrow="Projetos STEM"
        title="APRENDER FAZENDO."
        description="Projetos que conectam ciência, tecnologia, engenharia e matemática a experiências práticas, problemas reais e desenvolvimento de soluções."
        icon={Lightbulb}
        cards={projectTabs[3].cards}
      />

      {/* FECHAMENTO */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex size-16 items-center justify-center border border-primary/25 bg-background">
              <Network className="size-7 text-primary" />
            </div>

            <div>
              <p className="font-display text-4xl leading-[0.9] sm:text-6xl">
                UM PROJETO TERMINA.
                <br />
                O APRENDIZADO CONTINUA.
              </p>

              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Documentar, compartilhar e conectar fazem parte daquilo
                que queremos construir como equipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">
              Próximo passo
            </p>

            <h2 className="mt-2 font-display text-5xl leading-none sm:text-6xl">
              TEM UMA IDEIA?
              <br />
              FALE COM A EQUIPE.
            </h2>
          </div>

          <a
            href="mailto:mecatiger6@gmail.com"
            className="inline-flex h-12 w-fit items-center gap-2 border border-primary-foreground/30 bg-background px-6 text-sm font-bold uppercase text-foreground transition-transform hover:-translate-y-0.5"
          >
            mecatiger6@gmail.com
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </SiteShell>
  );
}