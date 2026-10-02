import { createFileRoute } from "@tanstack/react-router";
import { PageTemplate } from "@/components/site/page-template";
import { pages } from "@/content/site-content";
export const Route = createFileRoute("/equipe")({ head: () => ({ meta: [{ title: "A Equipe — MECATIGER FTC #32578" }, { name: "description", content: pages.equipe.description }, { property: "og:title", content: "A Equipe — MECATIGER" }, { property: "og:description", content: pages.equipe.description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: () => <PageTemplate content={pages.equipe} kind="equipe" /> });
