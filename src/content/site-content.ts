export const primaryNav = [
  { label: "Comunidade", to: "/comunidade" },
  { label: "A equipe", to: "/equipe" },
  { label: "Projetos", to: "/projetos" },
  { label: "Engenharia", to: "/engenharia" },
  { label: "Diário", to: "/diario" },
  { label: "Temporada", to: "/temporada" },
  { label: "Meca AI", to: "/meca-ai" },
  { label: "Competições", to: "/competicoes" },
  { label: "Galeria", to: "/galeria" },
  { label: "Parceiros", to: "/parceiros" },
  { label: "Nosso robô", to: "/robo" },
  { label: "Contato", to: "/contato" },
] as const;

export const robotSystems = [
  "Drivetrain",
  "Intake",
  "Lift",
  "Outtake",
  "Vision",
  "Software",
];

export const engineeringAreas = [
  ["Mecânica", "Estruturas, mecanismos e fabricação"],
  ["Eletrônica", "Energia, sensores e integração"],
  ["Software", "Controle, arquitetura e teleop"],
  ["Visão computacional", "Detecção, localização e dados"],
  ["Autônomo", "Navegação e rotinas de partida"],
  ["Estratégia", "Análise de jogo e tomada de decisão"],
] as const;

export const impactMetrics = [
  "Visitantes",
  "Membros da comunidade",
  "Equipes alcançadas",
  "Estados alcançados",
  "Países alcançados",
  "Mentorias",
  "Pedidos de ajuda",
  "Projetos compartilhados",
];

export type PageContent = {
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  sections: {
    title: string;
    copy: string;
    items?: string[];
  }[];
};

export const pages = {
  equipe: {
    eyebrow: "FTC Team #32578",
    title: "Somos a MECATIGER",
    description:
      "Conheça a equipe de robótica MECATIGER, de Maracanaú, Ceará.",
    intro:
      "Somos uma equipe de robótica de Maracanaú, Ceará, formada por estudantes apaixonados por tecnologia, engenharia e inovação.",
    sections: [
      {
        title: "Nossa identidade",
        copy:
          "Força, precisão, engenharia, tecnologia e comunidade orientam cada ciclo de aprendizado.",
      },
      {
        title: "Equipe",
        copy:
          "A página da equipe receberá os integrantes, mentores, organização e bastidores oficiais.",
        items: [
          "Integrantes",
          "Mentores",
          "Organização",
          "Bastidores",
        ],
      },
      {
        title: "Ficha técnica",
        copy:
          "FTC #32578 · Rookie Year: 2025 · Maracanaú — Ceará — Brasil",
      },
    ],
  },

  robo: {
    eyebrow: "BIOBUZZ 2026–2027",
    title: "Mequinha",
    description:
      "Conheça a Mequinha, o robô da MECATIGER para a temporada BIOBUZZ 2026–2027.",
    intro:
      "Ainda estamos trabalhando no robô da temporada. Esta página acompanhará o desenvolvimento da Mequinha, recebendo fotos, vídeos, CAD, especificações e documentação conforme o projeto avança.",
    sections: robotSystems.map((title) => ({
      title,
      copy:
        "Sistema em desenvolvimento. A documentação será atualizada conforme a equipe avançar na temporada.",
    })),
  },

  temporada: {
    eyebrow: "2026–2027",
    title: "Temporada BIOBUZZ",
    description:
      "Acompanhe a temporada BIOBUZZ 2026–2027 da MECATIGER FTC #32578.",
    intro:
      "Este espaço reunirá o desafio, calendário, estratégia e evolução técnica da temporada.",
    sections: [
      {
        title: "Desafio",
        copy: "Conteúdo oficial em preparação.",
      },
      {
        title: "Calendário",
        copy: "Conteúdo oficial em preparação.",
      },
      {
        title: "Estratégia",
        copy: "Conteúdo oficial em preparação.",
      },
      {
        title: "Evolução",
        copy: "Conteúdo oficial em preparação.",
      },
    ],
  },

  engenharia: {
    eyebrow: "Força + precisão",
    title: "Nossa engenharia",
    description:
      "Mecânica, eletrônica, software, visão computacional, autônomo e estratégia na MECATIGER.",
    intro:
      "Da primeira hipótese ao teste em campo, documentamos decisões, iterações e aprendizados.",
    sections: engineeringAreas.map(([title, copy]) => ({
      title,
      copy,
    })),
  },

  diario: {
    eyebrow: "Diário da temporada",
    title: "MECATIGER Log",
    description:
      "O diário de engenharia e evolução da MECATIGER FTC #32578.",
    intro:
      "Registros reais da evolução da equipe serão publicados com data, imagem, resumo, conteúdo, tags e categoria.",
    sections: [
      {
        title: "Registros da temporada",
        copy:
          "Os registros oficiais serão adicionados conforme o diário de bordo da equipe for organizado.",
      },
    ],
  },

  competicoes: {
    eyebrow: "Nossa trajetória",
    title: "Competições",
    description:
      "Histórico de competições da MECATIGER FTC #32578.",
    intro:
      "O histórico oficial será organizado por ano, evento, local, resultado, registros e aprendizados.",
    sections: [
      {
        title: "Histórico",
        copy:
          "Nenhum resultado foi publicado nesta etapa.",
        items: [
          "Ano",
          "Evento",
          "Local",
          "Resultado",
          "Fotos",
          "Vídeos",
          "Aprendizados",
        ],
      },
    ],
  },

  comunidade: {
    eyebrow: "Portal FTC",
    title: "Encontre sua comunidade.",
    description:
      "Um portal para encontrar comunidades, servidores e espaços independentes dedicados à FIRST Tech Challenge.",
    intro:
      "O Hub não cria uma nova comunidade. Ele organiza os caminhos para chegar às comunidades FTC que já existem.",
    sections: [
      {
        title: "Comunidades FTC",
        copy:
          "Discord, Reddit e outros espaços independentes voltados à FIRST Tech Challenge.",
      },
      {
        title: "Mentores",
        copy:
          "Recursos e plataformas que podem aproximar equipes de pessoas com experiência técnica.",
      },
      {
        title: "Compartilhar conhecimento",
        copy:
          "Conhecimento, documentação e experiências podem circular entre equipes e participantes.",
      },
      {
        title: "Áreas",
        copy:
          "Encontre espaços relacionados a diferentes necessidades da competição.",
        items: [
          "Programação",
          "Mecânica",
          "Eletrônica",
          "Visão computacional",
          "CAD",
          "Autônomo",
          "Estratégia",
          "Mentoria",
        ],
      },
    ],
  },

  projetos: {
    eyebrow: "Pesquisa + impacto",
    title: "Projetos",
    description:
      "Projetos da equipe, iniciativas educacionais, ações comunitárias e projetos STEM da MECATIGER.",
    intro:
      "Um espaço para organizar aquilo que a equipe está construindo, aprendendo, compartilhando e desenvolvendo ao longo da sua trajetória.",
    sections: [
      {
        title: "Projetos da equipe",
        copy:
          "Projetos diretamente ligados à MECATIGER, à temporada e ao desenvolvimento técnico da equipe.",
        items: [
          "Mequinha",
          "MECATIGER Hub",
          "Processo técnico",
        ],
      },
      {
        title: "Iniciativas educacionais",
        copy:
          "Conteúdos e iniciativas que transformam o que aprendemos em conhecimento acessível.",
        items: [
          "Documentação",
          "Diário",
          "MECA AI",
        ],
      },
      {
        title: "Ações comunitárias",
        copy:
          "Ações que aproximam a equipe de outras pessoas, equipes e espaços.",
        items: [
          "Conexões",
          "Compartilhamento",
          "Colaboração",
        ],
      },
      {
        title: "Projetos STEM",
        copy:
          "Projetos que conectam ciência, tecnologia, engenharia e matemática a experiências práticas.",
        items: [
          "Experimentação",
          "Engenharia",
          "Aprendizado",
        ],
      },
    ],
  },

  galeria: {
    eyebrow: "Arquivo visual",
    title: "Galeria",
    description:
      "Fotos e vídeos oficiais da MECATIGER FTC #32578.",
    intro:
      "A galeria receberá fotografias reais da equipe e será otimizada para navegação no celular.",
    sections: [
      {
        title: "Equipe",
        copy: "Mídia oficial aguardando envio.",
      },
      {
        title: "Robô",
        copy: "Mídia oficial aguardando envio.",
      },
      {
        title: "Oficina",
        copy: "Mídia oficial aguardando envio.",
      },
      {
        title: "Competições",
        copy: "Mídia oficial aguardando envio.",
      },
      {
        title: "Eventos",
        copy: "Mídia oficial aguardando envio.",
      },
      {
        title: "Mentorias",
        copy: "Mídia oficial aguardando envio.",
      },
      {
        title: "Bastidores",
        copy: "Mídia oficial aguardando envio.",
      },
    ],
  },

  parceiros: {
    eyebrow: "Construa conosco",
    title: "Apoie a MECATIGER",
    description:
      "Seja patrocinador, apoiador ou parceiro institucional da MECATIGER.",
    intro:
      "Parcerias aproximam a equipe de ferramentas, conhecimento e oportunidades para competir e gerar impacto.",
    sections: [
      {
        title: "Seja nosso parceiro",
        copy:
          "A apresentação institucional e as contrapartidas serão adicionadas com informações oficiais.",
      },
      {
        title: "Parceiros",
        copy:
          "Nenhuma organização será exibida sem confirmação.",
      },
    ],
  },

  "meca-ai": {
    eyebrow: "Interface conceitual",
    title: "MECA AI",
    description:
      "Conheça a Meca Tiger por meio de uma futura base de conhecimento aprovada pela equipe.",
    intro:
      "Esta primeira etapa apresenta somente a interface. Nenhuma resposta oficial é gerada ainda.",
    sections: [
      {
        title: "Perguntas sugeridas",
        copy:
          "Escolha uma pergunta para visualizar o estado de preparação.",
        items: [
          "Quem é a Meca Tiger?",
          "Como funciona a Mequinha?",
          "Qual é a história da equipe?",
          "O que é FTC?",
          "Quais mecanismos nosso robô possui?",
          "Como vocês trabalham com programação?",
        ],
      },
      {
        title: "Base futura",
        copy:
          "Documentos, páginas, histórico, documentação técnica, materiais oficiais e conteúdos aprovados pela equipe.",
      },
    ],
  },

  contato: {
    eyebrow: "Vamos construir juntos",
    title: "Contato",
    description:
      "Entre em contato com a MECATIGER FTC #32578.",
    intro:
      "Parcerias, mentoria, projetos, imprensa, colaboração ou comunidade: fale diretamente com a equipe.",
    sections: [
      {
        title: "E-mail",
        copy: "mecatiger6@gmail.com",
      },
      {
        title: "Instagram",
        copy: "@mecatiger_ftc",
      },
      {
        title: "Local",
        copy: "Maracanaú — Ceará — Brasil",
      },
    ],
  },
} satisfies Record<string, PageContent>;