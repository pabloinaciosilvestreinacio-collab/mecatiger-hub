import { Link, useRouterState } from "@tanstack/react-router";
import { Instagram, Mail, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { primaryNav } from "@/content/site-content";

function Brand() {
  return (
    <Link
      to="/"
      className="group flex min-w-0 items-center gap-3"
      aria-label="MECATIGER — início"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center">
        <img
          src="/Screenshot_20261004_131612_Instagram.jpg"
          alt=""
          className="h-full w-full object-contain transition-transform group-hover:-translate-y-0.5"
        />
      </span>

      <span className="min-w-0 leading-none">
        <span className="block truncate font-display text-2xl text-foreground">
          MECATIGER
        </span>

        <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          FTC #32578
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid h-18 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="Navegação principal"
        >
          {primaryNav.slice(0, 7).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nav-link"
              activeProps={{
                className: "nav-link nav-link-active",
              }}
            >
              {item.label}
            </Link>
          ))}

          <Link to="/contato" className="nav-cta">
            Contato
          </Link>
        </nav>

        <Button
          variant="icon"
          size="icon"
          className="lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-5 lg:hidden">
          <nav
            className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border"
            aria-label="Menu móvel"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`bg-card px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] ${
                  pathname === item.to
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <Brand />

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              FTC Team #32578
              <br />
              Maracanaú — Ceará — Brasil
            </p>

            <a
              href="mailto:mecatiger6@gmail.com"
              className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4 text-primary" />
              mecatiger6@gmail.com
            </a>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3"
            aria-label="Rodapé"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>© 2026 MECATIGER FTC #32578</p>

          <div className="flex flex-wrap items-center gap-5">
            <a
              href="https://www.instagram.com/mecatiger_ftc/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-foreground"
            >
              <Instagram className="size-4" />
              Instagram
            </a>

            <a
              href="mailto:mecatiger6@gmail.com"
              className="inline-flex items-center gap-2 hover:text-foreground"
            >
              <Mail className="size-4" />
              E-mail
            </a>

            <span>Privacidade</span>
            <span>Termos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}