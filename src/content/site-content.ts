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

export const robotSystems = ["Drivetrain", "Intake", "Lift", "Outtake", "Vision", "Software"];
export const engineeringAreas = [
  ["Mecânica", "Estruturas, mecanismos e fabricação"],
  ["Eletrônica", "Energia, sensores e integração"],
  ["Software", "Controle, arquitetura e teleop"],
  ["Visão computacional", "Detecção, localização e dados"],
  ["Autônomo", "Navegação e rotinas de partida"],
  ["Estratégia", "Análise de jogo e tomada de decisão"],
] as const;

export const impactMetrics = [
  "Visitantes", "Membros da comunidade", "Equipes alcançadas", "Estados alcançados",
  "Países alcançados", "Mentorias", "Pedidos de ajuda", "Projetos compartilhados",
];

export type PageContent = {
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  sections: { title: string; copy: string; items?: string[] }[];
};

export const pages = {
  equipe: {
    eyebrow: "FTC Team #32578", title: "Somos a MECATIGER",
    description: "Conheça a equipe de robótica MECATIGER, de Maracanaú, Ceará.",
    intro: "Somos uma equipe de robótica de Maracanaú, Ceará, formada por estudantes apaixonados por tecnologia, engenharia e inovação.",
    sections: [
      { title: "Nossa identidade", copy: "Força, precisão, engenharia, tecnologia e comunidade orientam cada ciclo de aprendizado." },
      { title: "Equipe", copy: "Conteúdo oficial em preparação.", items: ["Integrantes", "Mentores", "Organização", "Bastidores"] },
      { title: "Ficha técnica", copy: "FTC #32578 · Rookie Year: 2025 · Maracanaú — Ceará — Brasil" },
    ],
  },
  robo: {
    eyebrow: "BIOBUZZ 2026–2027", title: "Mequinha",
    description: "Conheça a Mequinha, o robô da MECATIGER para a temporada BIOBUZZ 2026–2027.",
    intro: "Uma apresentação técnica preparada para receber fotos oficiais, vídeos, CAD, especificações e documentação de cada sistema.",
    sections: robotSystems.map((title) => ({ title, copy: "Descrição técnica em preparação." })),
  },
  temporada: {
    eyebrow: "2026–2027", title: "Temporada BIOBUZZ",
    description: "Acompanhe a temporada BIOBUZZ 2026–2027 da MECATIGER FTC #32578.",
    intro: "Este espaço reunirá desafios, calendário, estratégia e evolução técnica da temporada.",
    sections: ["Desafio", "Calendário", "Estratégia", "Evolução"].map((title) => ({ title, copy: "Conteúdo oficial em preparação." })),
  },
  engenharia: {
    eyebrow: "Força + precisão", title: "Nossa engenharia",
    description: "Mecânica, eletrônica, software, visão computacional, autônomo e estratégia na MECATIGER.",
    intro: "Da primeira hipótese ao teste em campo, documentamos decisões, iterações e aprendizados.",
    sections: engineeringAreas.map(([title, copy]) => ({ title, copy })),
  },
  diario: {
    eyebrow: "Diário da temporada", title: "MECATIGER Log",
    description: "O diário de engenharia e evolução da MECATIGER FTC #32578.",
    intro: "Registros reais da evolução da equipe serão publicados com data, imagem, resumo, conteúdo, tags e categoria.",
    sections: ["Montagem da garra", "Estudos de navegação autônoma", "Estrutura do software da Mequinha", "Testes do IMU"].map((title) => ({ title, copy: "Exemplo provisório — não representa um fato oficial." })),
  },
  competicoes: {
    eyebrow: "Nossa trajetória", title: "Competições",
    description: "Histórico de competições da MECATIGER FTC #32578.",
    intro: "O histórico oficial será organizado por ano, evento, local, resultado, registros e aprendizados.",
    sections: [{ title: "Histórico", copy: "Nenhum resultado foi publicado nesta etapa.", items: ["Ano", "Evento", "Local", "Resultado", "Fotos", "Vídeos", "Aprendizados"] }],
  },
  comunidade: {
    eyebrow: "MECATIGER Community", title: "Conhecimento não precisa de fronteiras.",
    description: "Uma futura rede para aproximar equipes, estudantes, mentores e profissionais STEM.",
    intro: "Não precisamos estar fisicamente juntos para construir juntos. Queremos conectar pessoas para compartilhar conhecimento, tirar dúvidas, revisar projetos e criar oportunidades de aprendizado.",
    sections: [
      { title: "Pedir ajuda", copy: "Fluxo de solicitação preparado para uma etapa futura." },
      { title: "Encontrar um mentor", copy: "Perfis e disponibilidade serão integrados futuramente." },
      { title: "Compartilhar conhecimento", copy: "Documentos e experiências aprovados poderão ser publicados aqui." },
      { title: "Participar da comunidade", copy: "Cadastros e mensagens não fazem parte desta primeira etapa." },
      { title: "Áreas", copy: "Conexões por especialidade.", items: ["Engenharia Mecânica", "Engenharia Elétrica", "Programação", "Visão Computacional", "CAD", "Fabricação", "Estratégia", "Captação de recursos"] },
    ],
  },
  projetos: {
    eyebrow: "Pesquisa + impacto", title: "Projetos",
    description: "Projetos técnicos, educacionais e comunitários da MECATIGER.",
    intro: "Um arquivo preparado para iniciativas reais da equipe, com documentação e resultados verificáveis.",
    sections: ["Projetos da equipe", "Iniciativas educacionais", "Outreach", "Ações comunitárias", "Projetos STEM"].map((title) => ({ title, copy: "Conteúdo oficial em preparação." })),
  },
  galeria: {
    eyebrow: "Arquivo visual", title: "Galeria",
    description: "Fotos e vídeos oficiais da MECATIGER FTC #32578.",
    intro: "A galeria receberá fotografias reais da equipe e será otimizada para navegação no celular.",
    sections: ["Equipe", "Robô", "Oficina", "Competições", "Eventos", "Mentorias", "Bastidores"].map((title) => ({ title, copy: "Mídia oficial aguardando envio." })),
  },
  parceiros: {
    eyebrow: "Construa conosco", title: "Apoie a MECATIGER",
    description: "Seja patrocinador, apoiador ou parceiro institucional da MECATIGER.",
    intro: "Parcerias aproximam a equipe de ferramentas, conhecimento e oportunidades para competir e gerar impacto.",
    sections: [{ title: "Seja nosso parceiro", copy: "A apresentação institucional e as contrapartidas serão adicionadas com informações oficiais." }, { title: "Parceiros", copy: "Nenhuma organização será exibida sem confirmação." }],
  },
  "meca-ai": {
    eyebrow: "Interface conceitual", title: "MECA AI",
    description: "Conheça a Meca Tiger por meio de uma futura base de conhecimento aprovada pela equipe.",
    intro: "Esta primeira etapa apresenta somente a interface. Nenhuma resposta oficial é gerada ainda.",
    sections: [{ title: "Perguntas sugeridas", copy: "Escolha uma pergunta para visualizar o estado de preparação.", items: ["Quem é a Meca Tiger?", "Como funciona a Mequinha?", "Qual é a história da equipe?", "O que é FTC?", "Quais mecanismos nosso robô possui?", "Como vocês trabalham com programação?"] }, { title: "Base futura", copy: "Documentos, páginas, histórico, documentação técnica, materiais oficiais e conteúdos aprovados pela equipe." }],
  },
  contato: {
    eyebrow: "Vamos construir juntos", title: "Contato",
    description: "Entre em contato com a MECATIGER FTC #32578.",
    intro: "Parcerias, mentoria, imprensa ou comunidade: os canais oficiais serão consolidados nesta página.",
    sections: [{ title: "Instagram", copy: "@mecatiger_ftc" }, { title: "E-mail", copy: "Endereço oficial aguardando confirmação." }, { title: "Local", copy: "Maracanaú — Ceará — Brasil" }],
  },
} satisfies Record<string, PageContent>;
