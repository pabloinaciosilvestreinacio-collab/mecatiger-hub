[1mdiff --git a/src/routes/index.tsx b/src/routes/index.tsx[m
[1mindex 8eec392..e38bea0 100644[m
[1m--- a/src/routes/index.tsx[m
[1m+++ b/src/routes/index.tsx[m
[36m@@ -1,126 +1,1420 @@[m
 import { createFileRoute, Link } from "@tanstack/react-router";[m
[31m-import { ArrowRight, Bot, CircuitBoard, Cpu, Globe2, Handshake, Instagram, Radio, Wrench } from "lucide-react";[m
[32m+[m[32mimport {[m
[32m+[m[32m  ArrowRight,[m
[32m+[m[32m  BookOpen,[m
[32m+[m[32m  Bot,[m
[32m+[m[32m  CircuitBoard,[m
[32m+[m[32m  Globe2,[m
[32m+[m[32m  Handshake,[m
[32m+[m[32m  Instagram,[m
[32m+[m[32m  Lightbulb,[m
[32m+[m[32m  Mail,[m
[32m+[m[32m  MapPin,[m
[32m+[m[32m  MessageCircle,[m
[32m+[m[32m  Network,[m
[32m+[m[32m  Newspaper,[m
[32m+[m[32m  Radio,[m
[32m+[m[32m  Users,[m
[32m+[m[32m  Wrench,[m
[32m+[m[32m} from "lucide-react";[m
[32m+[m[32mimport {[m
[32m+[m[32m  FormEvent,[m
[32m+[m[32m  ReactNode,[m
[32m+[m[32m  useEffect,[m
[32m+[m[32m  useRef,[m
[32m+[m[32m  useState,[m
[32m+[m[32m} from "react";[m
[32m+[m
 import { Button } from "@/components/ui/button";[m
 import { SiteShell } from "@/components/site/site-shell";[m
[31m-import { engineeringAreas, impactMetrics, robotSystems } from "@/content/site-content";[m
[31m-import robotHero from "@/assets/mecatiger-robot-hero.jpg";[m
[31m-import teamImage from "@/assets/mecatiger-team-placeholder.jpg";[m
[31m-import engineeringImage from "@/assets/mecatiger-engineering-placeholder.jpg";[m
[32m+[m[32mimport { engineeringAreas } from "@/content/site-content";[m
[32m+[m[32mimport { supabase } from "@/lib/supabase";[m
 [m
 export const Route = createFileRoute("/")({[m
   head: () => ({[m
     meta: [[m
[31m-      { title: "MECATIGER FTC #32578 — Maracanaú, Ceará" },[m
[31m-      { name: "description", content: "Site oficial da MECATIGER FTC #32578. Engenharia, tecnologia e comunidade de Maracanaú, Ceará." },[m
[31m-      { property: "og:title", content: "MECATIGER FTC #32578" },[m
[31m-      { property: "og:description", content: "Sonhamos alto. Projetamos com precisão." },[m
[31m-      { property: "og:type", content: "website" },[m
[31m-      { name: "twitter:card", content: "summary_large_image" },[m
[32m+[m[32m      {[m
[32m+[m[32m        title: "MECATIGER FTC #32578 — Maracanaú, Ceará",[m
[32m+[m[32m      },[m
[32m+[m[32m      {[m
[32m+[m[32m        name: "description",[m
[32m+[m[32m        content:[m
[32m+[m[32m          "MECATIGER FTC #32578 — robótica, comunidade, engenharia e conhecimento conectados a partir de Maracanaú.",[m
[32m+[m[32m      },[m
[32m+[m[32m      {[m
[32m+[m[32m        property: "og:title",[m
[32m+[m[32m        content: "MECATIGER FTC #32578",[m
[32m+[m[32m      },[m
[32m+[m[32m      {[m
[32m+[m[32m        property: "og:description",[m
[32m+[m[32m        content: "Ideias que ganham alcance.",[m
[32m+[m[32m      },[m
[32m+[m[32m      {[m
[32m+[m[32m        property: "og:type",[m
[32m+[m[32m        content: "website",[m
[32m+[m[32m      },[m
[32m+[m[32m      {[m
[32m+[m[32m        name: "twitter:card",[m
[32m+[m[32m        content: "summary_large_image",[m
[32m+[m[32m      },[m
     ],[m
   }),[m
   component: HomePage,[m
 });[m
 [m
[31m-const sectionLinks = [[m
[31m-  { label: "Comunidade", title: "Conhecimento não precisa de fronteiras.", copy: "Uma futura rede para aproximar equipes, estudantes, mentores e profissionais STEM.", to: "/comunidade", icon: Globe2 },[m
[31m-  { label: "Projetos", title: "Ideias que saem da oficina.", copy: "Iniciativas técnicas, educacionais e comunitárias documentadas com transparência.", to: "/projetos", icon: CircuitBoard },[m
[32m+[m[32mconst communityActions = [[m
[32m+[m[32m  {[m
[32m+[m[32m    icon: MessageCircle,[m
[32m+[m[32m    number: "01",[m
[32m+[m[32m    label: "Pedir ajuda",[m
[32m+[m[32m    title: "Uma dúvida pode ser o começo de uma conexão.",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Queremos criar um espaço onde equipes possam encontrar orientação, experiências e caminhos para resolver problemas reais.",[m
[32m+[m[32m    to: "/comunidade",[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    icon: Users,[m
[32m+[m[32m    number: "02",[m
[32m+[m[32m    label: "Encontrar um mentor",[m
[32m+[m[32m    title: "Experiência compartilhada encurta caminhos.",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Aproximar estudantes, equipes, professores e profissionais é parte central do que queremos construir.",[m
[32m+[m[32m    to: "/comunidade",[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    icon: Globe2,[m
[32m+[m[32m    number: "03",[m
[32m+[m[32m    label: "Compartilhar conhecimento",[m
[32m+[m[32m    title: "O que aprendemos não precisa ficar na oficina.",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Documentação, projetos, experiências e aprendizados podem continuar circulando muito depois de um teste ou competição.",[m
[32m+[m[32m    to: "/comunidade",[m
[32m+[m[32m  },[m
[32m+[m[32m] as const;[m
[32m+[m
[32m+[m[32mconst principles = [[m
[32m+[m[32m  {[m
[32m+[m[32m    number: "01",[m
[32m+[m[32m    title: "Criar",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Transformar ideias em projetos, experiências e soluções que possam ser testadas no mundo real.",[m
[32m+[m[32m    icon: Lightbulb,[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    number: "02",[m
[32m+[m[32m    title: "Aprender",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Usar cada erro, teste e desafio como matéria-prima para evoluir.",[m
[32m+[m[32m    icon: BookOpen,[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    number: "03",[m
[32m+[m[32m    title: "Conectar",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Aproximar pessoas com diferentes experiências, conhecimentos e lugares.",[m
[32m+[m[32m    icon: Network,[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    number: "04",[m
[32m+[m[32m    title: "Multiplicar",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Fazer com que uma experiência de uma equipe possa ajudar muitas outras.",[m
[32m+[m[32m    icon: Wrench,[m
[32m+[m[32m  },[m
[32m+[m[32m] as const;[m
[32m+[m
[32m+[m[32mconst timeline = [[m
[32m+[m[32m  {[m
[32m+[m[32m    date: "08.2025",[m
[32m+[m[32m    title: "O começo",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "A MECATIGER nasce no SESI SENAI Maracanaú com a vontade de aprender, competir e construir uma equipe capaz de ir além do campo.",[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    date: "2025–2026",[m
[32m+[m[32m    title: "Primeira temporada",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Nossa estreia na FIRST Tech Challenge colocou teoria, engenharia, programação, estratégia e trabalho em equipe em contato com desafios reais.",[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    date: "2026–2027",[m
[32m+[m[32m    title: "Segunda temporada",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Na temporada BIOBUZZ, entramos em um novo ciclo de desenvolvimento técnico, organização e amadurecimento da equipe.",[m
[32m+[m[32m  },[m
[32m+[m[32m  {[m
[32m+[m[32m    date: "Agora",[m
[32m+[m[32m    title: "O Hub",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Começamos a transformar parte do que vivemos como equipe em uma plataforma aberta para conhecimento, projetos e conexões.",[m
[32m+[m[32m  },[m
[32m+[m[32m] as const;[m
[32m+[m
[32m+[m[32mconst resources = [[m
[32m+[m[32m  {[m
[32m+[m[32m    number: "01",[m
[32m+[m[32m    label: "Projetos",[m
[32m+[m[32m    title: "Explore o que estamos construindo.",[m
[32m+[m[32m    copy:[m
[32m+[m[32m      "Um espaço para iniciativas técnicas, educacionais e comunitárias da MECATIGER.",[m
[32m+[m[32m    to: "/projetos"