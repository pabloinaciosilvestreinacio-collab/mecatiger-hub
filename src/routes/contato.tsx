import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  AtSign,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      {
        title: "Contato — MECATIGER",
      },
      {
        name: "description",
        content:
          "Entre em contato com a MECATIGER FTC #32578.",
      },
      {
        property: "og:title",
        content: "Contato — MECATIGER",
      },
      {
        property: "og:description",
        content:
          "Entre em contato com a equipe MECATIGER FTC #32578.",
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
  component: ContatoPage,
});

const contactChannels = [
  {
    number: "01",
    icon: Mail,
    label: "E-mail da equipe",
    value: "mecatiger6@gmail.com",
    href: "mailto:mecatiger6@gmail.com",
    description:
      "Para parcerias, projetos, imprensa, colaboração, mentoria ou outras oportunidades de contato.",
  },
  {
    number: "02",
    icon: Instagram,
    label: "Instagram",
    value: "@mecatiger_ftc",
    href: "https://www.instagram.com/mecatiger_ftc/",
    description:
      "Acompanhe a temporada, bastidores, competições e atualizações da equipe.",
  },
  {
    number: "03",
    icon: MapPin,
    label: "Localização",
    value: "Maracanaú — Ceará — Brasil",
    href: "https://maps.google.com/?q=Maracanaú+Ceará+Brasil",
    description:
      "Somos uma equipe do SESI SENAI Maracanaú, no Ceará.",
  },
] as const;

function ContatoPage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative min-h-[620px] overflow-hidden border-b border-border pt-18">
        <div className="absolute inset-0 bg-background" />

        <div className="technical-grid absolute inset-0 opacity-30" />

        <div className="absolute left-[8%] top-[22%] size-2 bg-primary" />

        <div className="absolute right-[14%] top-[35%] size-2 bg-primary/60" />

        <div className="absolute right-[-12rem] top-20 size-[34rem] rotate-45 border border-primary/15" />

        <div className="absolute right-[-5rem] top-44 size-[24rem] rotate-45 border border-primary/10" />

        <div className="absolute left-[-15%] top-[76%] h-px w-[130%] rotate-[-7deg] bg-primary/20" />

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-end px-5 pb-14 sm:px-6 lg:px-8">
          <span className="eyebrow">
            Contato / MECATIGER FTC #32578
          </span>

          <h1 className="mt-5 max-w-6xl font-display text-7xl leading-[0.82] sm:text-9xl">
            FALE
            <br />
            <span className="text-primary">
              COM A
            </span>
            <br />
            EQUIPE.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Uma equipe de robótica também é feita pelas conexões que surgem
            fora do campo. Parcerias, colaboração, mentoria, imprensa ou
            simplesmente uma conversa: estamos por aqui.
          </p>
        </div>
      </section>

      {/* CONTACT CHANNELS */}
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {contactChannels.map(
              (
                {
                  number,
                  icon: Icon,
                  label,
                  value,
                  href,
                  description,
                },
              ) => (
                <a
                  key={label}
                  href={href}
                  target={
                    href.startsWith("mailto:")
                      ? undefined
                      : "_blank"
                  }
                  rel={
                    href.startsWith("mailto:")
                      ? undefined
                      : "noopener noreferrer"
                  }
                  className="group flex min-h-96 flex-col bg-card p-7 transition-colors duration-300 hover:bg-accent sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center border border-primary/25 bg-background">
                      <Icon className="size-5 text-primary" />
                    </div>

                    <span className="font-display text-3xl text-primary/40">
                      {number}
                    </span>
                  </div>

                  <p className="mt-12 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                    {label}
                  </p>

                  <h2 className="mt-3 break-words font-display text-4xl leading-none sm:text-5xl">
                    {value}
                  </h2>

                  <p className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>

                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-primary transition-[gap] duration-300 group-hover:gap-3">
                    Acessar
                    <ArrowRight className="size-4" />
                  </span>
                </a>
              ),
            )}
          </div>
        </div>
      </section>

      {/* EMAIL FEATURE */}
      <section className="border-y border-border bg-card section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <span className="eyebrow">
                Canal principal
              </span>

              <AtSign className="mt-7 size-10 text-primary" />
            </div>

            <div>
              <h2 className="font-display text-5xl leading-[0.9] sm:text-7xl">
                A EQUIPE RESPONDE PELO{" "}
                <span className="text-primary">
                  E-MAIL.
                </span>
              </h2>

              <a
                href="mailto:mecatiger6@gmail.com"
                className="mt-8 block border border-border bg-background p-5 transition-colors hover:bg-accent sm:p-7"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  E-mail oficial
                </p>

                <p className="mt-2 break-all font-display text-3xl text-primary sm:text-5xl">
                  mecatiger6@gmail.com
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT TO CONTACT ABOUT */}
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <span className="eyebrow">
                O que você pode trazer
              </span>

              <h2 className="mt-5 font-display text-6xl leading-[0.88] sm:text-8xl">
                UMA IDEIA
                <br />
                JÁ É UM
                <br />
                <span className="text-primary">
                  COMEÇO.
                </span>
              </h2>
            </div>

            <div className="grid gap-px border border-border bg-border">
              {[
                "Parcerias",
                "Mentoria",
                "Projetos",
                "Imprensa",
                "Colaboração",
                "Comunidade",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between bg-card p-5 sm:p-6"
                >
                  <span className="text-sm font-bold uppercase tracking-[0.08em]">
                    {item}
                  </span>

                  <span className="font-display text-2xl text-primary/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Continue acompanhando
            </p>

            <h2 className="mt-2 font-display text-5xl leading-none sm:text-6xl">
              SIGA A TEMPORADA.
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://www.instagram.com/mecatiger_ftc/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 border border-primary-foreground/30 bg-background px-6 text-sm font-bold uppercase text-foreground transition-transform hover:-translate-y-0.5"
            >
              <Instagram className="size-4" />
              Instagram
            </a>

            <Link
              to="/projetos"
              className="inline-flex h-12 items-center justify-center gap-2 border border-primary-foreground/30 px-6 text-sm font-bold uppercase text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-primary"
            >
              Projetos
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}