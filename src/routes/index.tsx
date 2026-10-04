import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CircuitBoard,
  Globe2,
  Handshake,
  Instagram,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Network,
  Newspaper,
  Radio,
  Users,
  Wrench,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/site-shell";
import { engineeringAreas } from "@/content/site-content";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "MECATIGER FTC #32578 — Maracanaú, Ceará",
      },
      {
        name: "description",
        content:
          "MECATIGER FTC #32578 — robótica, comunidade, engenharia e conhecimento conectados a partir de Maracanaú.",
      },
      {
        property: "og:title",
        content: "MECATIGER FTC #32578",
      },
      {
        property: "og:description",
        content: "Ideias que ganham alcance.",
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
  component: HomePage,
});

const communityActions = [
  {
    icon: MessageCircle,
    number: "01",
    label: "Pedir ajuda",
    title: "Uma dúvida pode ser o começo de uma conexão.",
    copy:
      "Queremos criar um espaço onde equipes possam encontrar orientação, experiências e caminhos para resolver problemas reais.",
    to: "/comunidade",
  },
  {
    icon: Users,
    number: "02",
    label: "Encontrar um mentor",
    title: "Experiência compartilhada encurta caminhos.",
    copy:
      "Aproximar estudantes, equipes, professores e profissionais é parte central do que queremos construir.",
    to: "/comunidade",
  },
  {
    icon: Globe2,
    number: "03",
    label: "Compartilhar conhecimento",
    title: "O que aprendemos não precisa ficar na oficina.",
    copy:
      "Documentação, projetos, experiências e aprendizados podem continuar circulando muito depois de um teste ou competição.",
    to: "/comunidade",
  },
] as const;

const principles = [
  {
    number: "01",
    title: "Criar",
    copy:
      "Transformar ideias em projetos, experiências e soluções que possam ser testadas no mundo real.",
    icon: Lightbulb,
  },
  {
    number: "02",
    title: "Aprender",
    copy:
      "Usar cada erro, teste e desafio como matéria-prima para evoluir.",
    icon: BookOpen,
  },
  {
    number: "03",
    title: "Conectar",
    copy:
      "Aproximar pessoas com diferentes experiências, conhecimentos e lugares.",
    icon: Network,
  },
  {
    number: "04",
    title: "Multiplicar",
    copy:
      "Fazer com que uma experiência de uma equipe possa ajudar muitas outras.",
    icon: Wrench,
  },
] as const;

const timeline = [
  {
    date: "08.2025",
    title: "O começo",
    copy:
      "A MECATIGER nasce no SESI SENAI Maracanaú com a vontade de aprender, competir e construir uma equipe capaz de ir além do campo.",
  },
  {
    date: "2025–2026",
    title: "Primeira temporada",
    copy:
      "Nossa estreia na FIRST Tech Challenge colocou teoria, engenharia, programação, estratégia e trabalho em equipe em contato com desafios reais.",
  },
  {
    date: "2026–2027",
    title: "Segunda temporada",
    copy:
      "Na temporada BIOBUZZ, entramos em um novo ciclo de desenvolvimento técnico, organização e amadurecimento da equipe.",
  },
  {
    date: "Agora",
    title: "O Hub",
    copy:
      "Começamos a transformar parte do que vivemos como equipe em uma plataforma aberta para conhecimento, projetos e conexões.",
  },
] as const;

const resources = [
  {
    number: "01",
    label: "Projetos",
    title: "Explore o que estamos construindo.",
    copy:
      "Um espaço para iniciativas técnicas, educacionais e comunitárias da MECATIGER.",
    to: "/projetos",
    icon: CircuitBoard,
  },
  {
    number: "02",
    label: "Engenharia",
    title: "Veja como pensamos antes de construir.",
    copy:
      "Processos, testes, decisões, programação, mecânica e aprendizados documentados.",
    to: "/engenharia",
    icon: Wrench,
  },
  {
    number: "03",
    label: "Diário",
    title: "Acompanhe o caminho, não só o resultado.",
    copy:
      "Registros reais da evolução da equipe durante a temporada.",
    to: "/diario",
    icon: Newspaper,
  },
] as const;

const updates = [
  {
    number: "01",
    label: "Temporada",
    title: "BIOBUZZ 2026–2027",
    copy:
      "Nosso segundo ciclo na FTC está em andamento.",
    to: "/temporada",
  },
  {
    number: "02",
    label: "Comunidade",
    title: "MECATIGER Community",
    copy:
      "O Hub está sendo preparado para futuras conexões entre equipes, estudantes, professores e profissionais.",
    to: "/comunidade",
  },
  {
    number: "03",
    label: "Conhecimento",
    title: "MECA AI",
    copy:
      "Uma futura base inteligente construída a partir dos conteúdos oficiais da equipe.",
    to: "/meca-ai",
  },
] as const;

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${
        visible ? "scroll-reveal-visible" : ""
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({ value }: { value: number | null }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === null) return;

    if (value === 0) {
      setDisplay(0);
      return;
    }

    const duration = 1000;
    const start = performance.now();
    const startValue = 0;

    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(
        Math.floor(
          startValue + (value - startValue) * eased,
        ),
      );

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (value === null) {
    return <>—</>;
  }

  return <>{display.toLocaleString("pt-BR")}</>;
}

function useVisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!supabase) {
        if (active) setCount(null);
        return;
      }

      const visitorKey = "mecatiger-visitor-counted-v1";
      const alreadyCounted =
        window.localStorage.getItem(visitorKey) === "1";

      if (!alreadyCounted) {
        const { data, error } = await supabase.rpc(
          "increment_site_visitor",
        );

        if (!error) {
          window.localStorage.setItem(visitorKey, "1");

          if (active) {
            setCount(Number(data ?? 0));
          }

          return;
        }
      }

      const { data, error } = await supabase
        .from("site_stats")
        .select("visitors")
        .eq("id", "main")
        .single();

      if (!error && active) {
        setCount(Number(data?.visitors ?? 0));
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return count;
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) return;

    if (!supabase) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: normalizedEmail,
      });

    if (!error) {
      setEmail("");
      setStatus("success");
      return;
    }

    if (error.code === "23505") {
      setStatus("duplicate");
      return;
    }

    setStatus("error");
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setStatus("idle");
          }}
          placeholder="seu@email.com"
          className="h-12 min-w-0 flex-1 border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          aria-label="Seu e-mail"
        />

        <Button
          type="submit"
          variant="industrial"
          size="lg"
          disabled={status === "loading"}
        >
          {status === "loading"
            ? "Enviando..."
            : "Quero receber"}
          <ArrowRight />
        </Button>
      </form>

      <p
        className="mt-3 min-h-5 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {status === "success" &&
          "Pronto. Você entrou na lista de novidades da MECATIGER."}

        {status === "duplicate" &&
          "Esse e-mail já está cadastrado."}

        {status === "error" &&
          "Não conseguimos cadastrar agora. Tente novamente em instantes."}
      </p>
    </div>
  );
}

function ArrowLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-primary transition-[gap] duration-300 hover:gap-3"
    >
      {children}
      <ArrowRight className="size-4" />
    </Link>
  );
}

function HomePage() {
  const visitorCount = useVisitorCount();

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative min-h-[min(900px,100svh)] overflow-hidden pt-18">
        <div className="absolute inset-0 bg-background" />
        <div className="technical-grid absolute inset-0 opacity-30" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,hsl(var(--primary)/0.18),transparent_34%)]" />

        <div className="absolute -right-40 top-24 h-[32rem] w-[32rem] rotate-45 border border-primary/20" />
        <div className="absolute -right-24 top-44 h-[24rem] w-[24rem] rotate-45 border border-primary/10" />
        <div className="absolute right-20 top-72 h-4 w-4 bg-primary shadow-[0_0_0_10px_hsl(var(--primary)/0.08)]" />

        <div className="absolute left-[-20%] top-[58%] h-px w-[140%] rotate-[-8deg] bg-primary/20" />
        <div className="absolute left-[-20%] top-[68%] h-px w-[140%] rotate-[-8deg] bg-foreground/10" />

        <div className="kinetic-one absolute -left-24 top-48 h-36 w-[135%] bg-primary/10 backdrop-blur-md" />
        <div className="kinetic-two absolute -right-24 top-[55%] h-20 w-[130%] bg-foreground/5 backdrop-blur-sm" />

        <div className="relative mx-auto flex min-h-[calc(min(900px,100svh)-4.5rem)] max-w-7xl flex-col justify-end px-5 pb-12 sm:px-6 md:pb-16 lg:px-8">
          <div className="reveal-one inline-flex w-fit items-center gap-2 border border-primary/35 bg-background/70 px-3 py-2 backdrop-blur-md">
            <span className="size-1.5 bg-primary" />

            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              FTC Team #32578
            </span>
          </div>

          <h1 className="reveal-two mt-5 max-w-6xl font-display text-[clamp(4.8rem,16vw,11rem)] leading-[0.78] text-foreground">
            MECATIGER
          </h1>

          <div className="reveal-two mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span>Maracanaú — Ceará — Brasil</span>
            <span>BIOBUZZ 2026–2027</span>
          </div>

          <p className="reveal-three mt-6 max-w-4xl font-display text-4xl leading-[0.9] sm:text-6xl">
            IDEIAS QUE GANHAM{" "}
            <span className="text-primary">ALCANCE.</span>
          </p>

          <p className="reveal-three mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Uma equipe de robótica que também quer ser ponto de encontro para
            pessoas, conhecimento, projetos e novas possibilidades.
          </p>

          <div className="reveal-three mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="industrial" size="lg" asChild>
              <Link to="/projetos">
                Explore nossos projetos
                <ArrowRight />
              </Link>
            </Button>

            <Button variant="industrialOutline" size="lg" asChild>
              <Link to="/equipe">
                Conheça nossa história
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            <span className="h-px w-10 bg-primary" />
            <span>O Hub está começando aqui.</span>
          </div>
        </div>
      </section>

      {/* IDENTIDADE */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          {[
            ["32578", "FTC Team"],
            ["08.2025", "Fundação"],
            ["02", "Temporada"],
            ["CE", "Maracanaú"],
          ].map(([value, label], index) => (
            <Reveal key={label} delay={index * 70}>
              <div className="px-5 py-7 sm:px-8">
                <p className="font-display text-4xl text-primary sm:text-5xl">
                  {value}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ECOSSISTEMA */}
      <section className="section-band relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="technical-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="eyebrow">
              01 / O ecossistema MECATIGER
            </span>

            <h2 className="mt-5 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
              UMA EQUIPE É O
              <br />
              <span className="text-primary">PONTO DE PARTIDA.</span>
            </h2>

            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              A robótica nos colocou na mesma sala. O conhecimento pode nos
              levar muito além dela. O Hub nasce para transformar aquilo que
              aprendemos em conteúdo, conexão e oportunidade.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px border border-border bg-border md:grid-cols-4">
            {principles.map(
              ({ number, title, copy, icon: Icon }, index) => (
                <Reveal key={title} delay={index * 90}>
                  <article className="h-full bg-card p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <Icon className="size-6 text-primary" />

                      <span className="font-display text-3xl text-primary/50">
                        {number}
                      </span>
                    </div>

                    <h3 className="mt-12 font-display text-4xl leading-none sm:text-5xl">
                      {title}
                    </h3>

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {copy}
                    </p>
                  </article>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="border-y border-border bg-card section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="eyebrow">02 / Nossa história</span>

            <h2 className="mt-5 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
              UMA EQUIPE
              <br />
              <span className="text-primary">EM CONSTRUÇÃO.</span>
            </h2>

            <p className="mt-7 max-w-4xl text-lg leading-relaxed text-muted-foreground">
              A MECATIGER é uma equipe de robótica do SESI SENAI Maracanaú,
              criada em agosto de 2025. Hoje estamos em nossa segunda temporada
              da FIRST Tech Challenge, um programa da FIRST em que equipes de
              estudantes, com apoio de mentores, projetam, constroem,
              programam e operam robôs enquanto desenvolvem competências de
              STEM, engenharia, colaboração e resolução de problemas.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px border border-border bg-border">
            {timeline.map(({ date, title, copy }, index) => (
              <Reveal key={title} delay={index * 80}>
                <article className="grid gap-6 bg-background p-6 sm:grid-cols-[8rem_1fr_auto] sm:items-start sm:p-8">
                  <span className="font-display text-3xl text-primary">
                    {date}
                  </span>

                  <div>
                    <h3 className="font-display text-4xl leading-none sm:text-5xl">
                      {title}
                    </h3>

                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {copy}
                    </p>
                  </div>

                  <span className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-2">
            <Reveal>
              <div className="bg-background p-7 sm:p-10">
                <span className="eyebrow">O nome</span>

                <h3 className="mt-5 font-display text-6xl leading-none">
                  MECA
                  <br />
                  <span className="text-primary">+</span>
                  <br />
                  TIGER
                </h3>

                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  “Mecha” faz referência ao imaginário dos animes e mangás
                  sobre grandes máquinas e robôs. “Tiger” é tigre em inglês —
                  uma ideia de força, coragem e presença. Juntos, os dois
                  conceitos representam a mistura entre inovação robótica,
                  atitude e a identidade que queremos construir.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="bg-card p-7 sm:p-10">
                <span className="eyebrow">Quem somos</span>

                <h3 className="mt-5 font-display text-6xl leading-none">
                  MAIS DO
                  <br />
                  QUE O
                  <br />
                  <span className="text-primary">ROBÔ.</span>
                </h3>

                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  Cada temporada traz um robô diferente. O que permanece são
                  as pessoas, os aprendizados, os projetos e a vontade de
                  abrir novos caminhos para quem também quer aprender.
                </p>

                <ArrowLink to="/equipe">
                  Conhecer a história completa
                </ArrowLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* MISSÃO */}
      <section className="section-band">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:px-8">
          <Reveal>
            <span className="eyebrow">03 / Nossa missão</span>

            <h2 className="mt-5 font-display text-6xl leading-[0.88] sm:text-8xl">
              A TECNOLOGIA
              <br />
              É NOSSA
              <br />
              <span className="text-primary">PONTE.</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="max-w-3xl text-xl leading-relaxed text-foreground sm:text-2xl">
              Não precisamos estar fisicamente juntos para construir juntos.
            </p>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
              Existem equipes que podem precisar de uma explicação, um
              professor que pode encontrar um projeto, um profissional que
              pode orientar uma decisão e um estudante que só precisa descobrir
              por onde começar. O Hub existe para criar essas pontes.
            </p>

            <div className="mt-8 border-l-2 border-primary pl-5">
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                Neste primeiro estágio, nossa atuação comunitária acontece
                100% pela web.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Uma tela pode ser suficiente para iniciar uma conversa que
                nunca teria acontecido de outra forma.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMUNIDADE */}
      <section className="relative overflow-hidden border-y border-border bg-card section-band">
        <div className="absolute inset-0">
          <div className="technical-grid absolute inset-0 opacity-20" />

          <div className="absolute right-[-8rem] top-16 h-96 w-96 rounded-full border border-primary/10" />
          <div className="absolute right-[-3rem] top-32 h-72 w-72 rounded-full border border-primary/10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="eyebrow">
              04 / MECATIGER Community
            </span>

            <h2 className="mt-5 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
              UMA DÚVIDA PODE
              <br />
              SER O COMEÇO
              <br />
              DE UMA <span className="text-primary">CONEXÃO.</span>
            </h2>

            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Queremos transformar o Hub em um espaço onde quem procura
              conhecimento encontra pessoas, materiais, experiências e
              possibilidades de colaboração.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px border border-border bg-border md:grid-cols-3">
            {communityActions.map(
              ({ icon: Icon, number, label, title, copy, to }, index) => (
                <Reveal key={label} delay={index * 100}>
                  <article className="group h-full bg-background p-6 transition-colors duration-300 hover:bg-accent sm:p-8">
                    <div className="flex items-center justify-between">
                      <Icon className="size-7 text-primary" />

                      <span className="font-display text-3xl text-primary/50">
                        {number}
                      </span>
                    </div>

                    <p className="mt-12 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {label}
                    </p>

                    <h3 className="mt-3 font-display text-4xl leading-none sm:text-5xl">
                      {title}
                    </h3>

                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                      {copy}
                    </p>

                    <ArrowLink to={to}>Entrar na comunidade</ArrowLink>
                  </article>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* NÚMEROS */}
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="eyebrow">05 / Números reais</span>

            <h2 className="mt-5 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
              CRESCIMENTO QUE
              <br />
              <span className="text-primary">A GENTE CONSEGUE MEDIR.</span>
            </h2>

            <p className="mt-7 max-w-3xl text-base leading-relaxed text-muted-foreground">
              O Hub vai registrar dados reais da comunidade à medida que ela
              crescer. Sem estimativas inventadas e sem transformar uma métrica
              em outra.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
            {[
              {
                value: visitorCount,
                label: "Visitantes",
                suffix: "",
              },
              {
                value: 0,
                label: "Estudantes",
                suffix: "",
              },
              {
                value: 0,
                label: "Equipes",
                suffix: "",
              },
              {
                value: 0,
                label: "Professores",
                suffix: "",
              },
              {
                value: 0,
                label: "Cidades",
                suffix: "",
              },
              {
                value: 0,
                label: "Países",
                suffix: "",
              },
              {
                value: 0,
                label: "Mentorias",
                suffix: "",
              },
              {
                value: "date",
                label: "Atuação",
                suffix: "",
              },
            ].map((item, index) => (
              <Reveal key={item.label} delay={index * 60}>
                <div className="bg-card p-5 sm:p-7">
                  <p className="font-display text-4xl text-foreground sm:text-5xl">
                    {item.value === "date" ? "08.2025" : <CountUp value={item.value} />}
                  </p>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 border border-border bg-card p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="flex size-16 items-center justify-center border border-primary/30 bg-background">
                <Globe2 className="size-7 text-primary" />
              </div>

              <div>
                <p className="font-display text-4xl leading-none sm:text-5xl">
                  Cada acesso pode abrir uma porta para alguém.
                </p>

                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Começamos pela web porque é onde a distância deixa de ser
                  uma barreira técnica e passa a ser apenas uma variável.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONEXÃO DIGITAL */}
      <section className="relative overflow-hidden border-y border-border bg-card section-band">
        <div className="absolute inset-0">
          <div className="technical-grid absolute inset-0 opacity-20" />

          <div className="absolute left-[8%] top-[24%] size-2 bg-primary" />
          <div className="absolute left-[26%] top-[55%] size-2 bg-primary/60" />
          <div className="absolute right-[26%] top-[35%] size-2 bg-primary/70" />
          <div className="absolute right-[8%] top-[62%] size-2 bg-primary/50" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <Reveal>
            <span className="eyebrow">06 / Conexões</span>

            <h2 className="mt-5 font-display text-6xl leading-[0.88] sm:text-8xl">
              A INTERNET
              <br />
              É SÓ O
              <br />
              <span className="text-primary">PRIMEIRO PASSO.</span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Em vez de um mapa, queremos mostrar uma rede. Um estudante.
              Uma equipe. Um professor. Um mentor. Um profissional. Pessoas
              diferentes conectadas por uma mesma vontade de aprender e
              construir.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative min-h-[28rem] overflow-hidden border border-border bg-background p-6 sm:p-10">
              <div className="technical-grid absolute inset-0 opacity-30" />

              <div className="relative flex min-h-[24rem] flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <span>REDE MECATIGER</span>
                  <span>FASE 01</span>
                </div>

                <div className="relative my-10 flex-1">
                  <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-card">
                    <div className="text-center">
                      <span className="block font-display text-3xl text-primary">
                        MECA
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                        HUB
                      </span>
                    </div>
                  </div>

                  <div className="connection-line absolute left-[14%] top-[22%] h-px w-[33%] rotate-[18deg]" />
                  <div className="connection-line absolute right-[14%] top-[22%] h-px w-[33%] rotate-[-18deg]" />
                  <div className="connection-line absolute left-[13%] bottom-[24%] h-px w-[35%] rotate-[-18deg]" />
                  <div className="connection-line absolute right-[13%] bottom-[24%] h-px w-[35%] rotate-[18deg]" />
                  <div className="connection-line absolute left-1/2 top-[12%] h-[25%] w-px -translate-x-1/2" />
                  <div className="connection-line absolute bottom-[12%] left-1/2 h-[25%] w-px -translate-x-1/2" />

                  <span className="network-node absolute left-[7%] top-[8%]">
                    ESTUDANTE
                  </span>

                  <span className="network-node absolute right-[4%] top-[8%]">
                    EQUIPE
                  </span>

                  <span className="network-node absolute bottom-[9%] left-[4%]">
                    PROFESSOR
                  </span>

                  <span className="network-node absolute bottom-[9%] right-[2%]">
                    MENTOR
                  </span>

                  <span className="network-node absolute left-1/2 top-[2%] -translate-x-1/2">
                    PROFISSIONAL
                  </span>

                  <span className="network-node absolute bottom-[2%] left-1/2 -translate-x-1/2">
                    COMUNIDADE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="border border-border p-3">
                    <p className="font-display text-2xl text-primary">
                      WEB
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      Canal inicial
                    </p>
                  </div>

                  <div className="border border-border p-3">
                    <p className="font-display text-2xl text-primary">
                      01
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      Hub ativo
                    </p>
                  </div>

                  <div className="border border-border p-3">
                    <p className="font-display text-2xl text-primary">
                      ∞
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      Possibilidades
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROJETOS */}
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="eyebrow">07 / Explore nossos projetos</span>

            <h2 className="mt-5 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
              A ROBÓTICA É
              <br />
              <span className="text-primary">UMA DAS NOSSAS LINGUAGENS.</span>
            </h2>

            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              O Hub também vai servir para mostrar o que nasce da equipe:
              projetos, iniciativas, estudos, experimentos e ações pensadas
              para gerar conhecimento.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-3">
            {resources.map(
              ({ number, label, title, copy, to, icon: Icon }, index) => (
                <Reveal key={label} delay={index * 90}>
                  <Link
                    to={to}
                    className="group block h-full bg-card p-6 transition-colors duration-300 hover:bg-accent sm:p-8"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="size-7 text-primary" />

                      <span className="font-display text-3xl text-primary/50">
                        {number}
                      </span>
                    </div>

                    <p className="mt-12 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {label}
                    </p>

                    <h3 className="mt-3 font-display text-4xl leading-none sm:text-5xl">
                      {title}
                    </h3>

                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                      {copy}
                    </p>

                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-primary transition-[gap] duration-300 group-hover:gap-3">
                      Explorar
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section className="border-y border-border bg-card section-band">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:px-8">
          <Reveal>
            <span className="eyebrow">08 / As pessoas</span>

            <h2 className="mt-5 font-display text-6xl leading-[0.88] sm:text-8xl">
              QUEM FAZ
              <br />
              <span className="text-primary">TUDO ISSO ACONTECER.</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative min-h-80 overflow-hidden border border-border bg-background p-7 sm:p-10">
              <div className="technical-grid absolute inset-0 opacity-30" />

              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                    MECATIGER / FTC #32578
                  </span>

                  <Users className="size-5 text-primary" />
                </div>

                <div>
                  <p className="font-display text-5xl leading-none sm:text-7xl">
                    EQUIPE.
                  </p>

                  <p className="font-display text-5xl leading-none text-primary sm:text-7xl">
                    PESSOAS.
                  </p>

                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    As fotografias reais da equipe serão adicionadas aqui.
                    Nenhuma imagem gerada por IA será utilizada para
                    representar integrantes reais.
                  </p>
                </div>

                <ArrowLink to="/equipe">
                  Conheça nossa equipe
                </ArrowLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TEMPORADA / ROBÔ */}
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="eyebrow">09 / Temporada</span>

            <h2 className="mt-5 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
              A MEQUINHA
              <br />
              <span className="text-primary">FAZ PARTE.</span>
            </h2>

            <p className="mt-7 max-w-3xl text-base leading-relaxed text-muted-foreground">
              O robô continua tendo sua própria página, documentação e espaço
              técnico. Mas dentro do Hub ele aparece na dimensão correta:
              como parte do trabalho da equipe, e não como o motivo de
              existência da plataforma.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-[auto_1fr_auto]">
              <div className="flex items-center justify-center bg-card p-8">
                <Bot className="size-12 text-primary" />
              </div>

              <div className="bg-background p-8">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  BIOBUZZ 2026–2027
                </p>

                <h3 className="mt-2 font-display text-5xl">
                  MEQUINHA
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Fotos reais, vídeos, CAD, mecanismos, programação e
                  documentação entrarão na página técnica conforme a
                  temporada avançar.
                </p>
              </div>

              <div className="flex items-end bg-card p-8">
                <ArrowLink to="/robo">
                  Ver página técnica
                </ArrowLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ATUALIZAÇÕES */}
      <section className="border-y border-border bg-card section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="eyebrow">
              10 / Agora na MECATIGER
            </span>

            <h2 className="mt-5 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
              O QUE ESTÁ
              <br />
              <span className="text-primary">ACONTECENDO AGORA.</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-3">
            {updates.map(
              ({ number, label, title, copy, to }, index) => (
                <Reveal key={title} delay={index * 100}>
                  <Link
                    to={to}
                    className="group block h-full bg-background p-6 transition-colors duration-300 hover:bg-accent sm:p-8"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        {label}
                      </span>

                      <span className="font-display text-3xl text-primary/40">
                        {number}
                      </span>
                    </div>

                    <h3 className="mt-14 font-display text-4xl leading-none sm:text-5xl">
                      {title}
                    </h3>

                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                      {copy}
                    </p>

                    <ArrowRight className="mt-7 size-5 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden border border-border bg-card p-7 sm:p-10">
              <div className="technical-grid absolute inset-0 opacity-20" />

              <div className="absolute -right-20 -top-20 size-64 rounded-full border border-primary/10" />
              <div className="absolute -right-8 top-12 size-32 rounded-full border border-primary/10" />

              <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-end">
                <div>
                  <span className="eyebrow">
                    11 / Novidades por e-mail
                  </span>

                  <h2 className="mt-5 max-w-4xl font-display text-6xl leading-[0.88] sm:text-8xl">
                    FIQUE POR DENTRO DO QUE{" "}
                    <span className="text-primary">ESTAMOS CRIANDO.</span>
                  </h2>

                  <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                    Receba atualizações da temporada, novos projetos,
                    oportunidades de colaboração e novidades do Hub
                    diretamente no seu e-mail.
                  </p>
                </div>

                <div>
                  <NewsletterForm />

                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Seu e-mail será usado somente para as comunicações da
                    MECATIGER relacionadas ao Hub.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PARCEIROS + MECA AI */}
      <section className="border-y border-border bg-card section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-px border border-border bg-border lg:grid-cols-2">
            <Reveal>
              <article className="bg-background p-7 sm:p-10">
                <Handshake className="size-7 text-primary" />

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Parceiros
                </p>

                <h2 className="mt-3 font-display text-6xl leading-none">
                  CONSTRUA
                  <br />
                  <span className="text-primary">COM A GENTE.</span>
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Empresas, escolas, universidades e profissionais podem
                  encontrar espaço para colaborar com a equipe e com o
                  crescimento da comunidade.
                </p>

                <ArrowLink to="/parceiros">
                  Conhecer parcerias
                </ArrowLink>
              </article>
            </Reveal>

            <Reveal delay={100}>
              <article className="relative overflow-hidden bg-card p-7 sm:p-10">
                <div className="technical-grid absolute inset-0 opacity-30" />

                <div className="relative">
                  <Bot className="size-7 text-primary" />

                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    12 / Conhecimento
                  </p>

                  <h2 className="mt-3 font-display text-6xl leading-none">
                    MECA AI
                  </h2>

                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Uma futura inteligência baseada nos conteúdos oficiais da
                    equipe para tornar nossa história e nosso conhecimento
                    ainda mais acessíveis.
                  </p>

                  <div className="mt-8 flex items-center gap-3 border border-border bg-background p-4">
                    <Radio className="size-4 text-primary" />

                    <span className="text-xs font-bold uppercase tracking-[0.1em]">
                      Base em preparação
                    </span>
                  </div>

                  <ArrowLink to="/meca-ai">
                    Conhecer a MECA AI
                  </ArrowLink>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                13 / Contato
              </p>

              <h2 className="mt-3 max-w-5xl font-display text-6xl leading-[0.88] sm:text-8xl">
                TEM ESPAÇO
                <br />
                PARA VOCÊ
                <br />
                <span className="text-primary-foreground/70">
                  AQUI.
                </span>
              </h2>
            </Reveal>

            <Reveal delay={120}>
              <div className="flex flex-col gap-4">
                <Button
                  variant="industrialOutline"
                  size="lg"
                  asChild
                >
                  <Link to="/contato">
                    Fale com a equipe
                    <ArrowRight />
                  </Link>
                </Button>

                <a
                  href="mailto:mecatiger6@gmail.com"
                  className="inline-flex items-center justify-center gap-2 text-sm font-bold uppercase"
                >
                  <Mail className="size-4" />
                  mecatiger6@gmail.com
                </a>

                <a
                  href="https://www.instagram.com/mecatiger_ftc/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm font-bold uppercase"
                >
                  <Instagram className="size-4" />
                  @mecatiger_ftc
                </a>

                <span className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] opacity-80">
                  <MapPin className="size-3.5" />
                  Maracanaú — Ceará — Brasil
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}