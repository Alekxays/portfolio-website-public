export type ProjectStatus = "ongoing" | "paused" | "finished";

export type ProjectLinkType = "github" | "figma" | "website";

export interface ProjectLink {
  type: ProjectLinkType;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  year: string;
  status: ProjectStatus;
  skills: string[];
  summary: { fr: string; en: string };
  pitch: { fr: string; en: string };
  links: ProjectLink[];
  image?: string;
}

export const projects: Project[] = [
  {
    id: "digizelle",
    title: "Digizelle",
    year: "2025",
    status: "finished",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GitHub"],
    summary: {
      fr: "Site web pour l'association Digizelle.",
      en: "Website for the Digizelle association.",
    },
    pitch: {
      fr: "Dans le cadre de mes études à Epitech, j'ai développé un site web pour Digizelle, une communauté où la diversité, l'innovation et l'apprentissage du numérique se rencontrent. Ce projet, conçu avec Next.js et Tailwind CSS, incarne la vision de l'association : offrir un espace inclusif où chacun peut explorer, apprendre et créer dans un univers technologique en constante évolution.\n\nL'initiative « Un Monde Digital, Pour Tous et Par Tous ! » favorise un écosystème collaboratif où passionnés et curieux du numérique se retrouvent pour partager leurs connaissances et développer des projets innovants.",
      en: "As part of my studies at Epitech, I developed a website for Digizelle, a community where diversity, innovation, and digital learning come together. This project, built with Next.js and Tailwind CSS, embodies the association's vision: to offer an inclusive space where everyone can explore, learn, and create in a constantly evolving technological world.\n\nThe « Un Monde Digital, Pour Tous et Par Tous ! » initiative fosters a collaborative ecosystem where digital enthusiasts and curious minds gather to share knowledge and develop innovative projects.",
    },
    links: [{ type: "website", url: "https://digizelle.fr" }],
  },
  {
    id: "cleany",
    title: "Cleany",
    year: "2024",
    status: "finished",
    skills: ["React Native", "TypeScript", "Figma", "GitHub", "Trello"],
    summary: {
      fr: "Application mobile iOS et Android pour la propreté urbaine.",
      en: "iOS and Android mobile app for urban cleanliness.",
    },
    pitch: {
      fr: "Dans le cadre d'un projet pour Epitech, nous devions concevoir une application visant à accompagner progressivement les villes dans leur transformation digitale. Nous avons ainsi développé Cleany.\n\nCleany facilite l'engagement des riverains en matière de propreté et d'écologie urbaine. En quelques clics, les utilisateurs peuvent signaler des incivilités dans leur quartier, comme des dépôts sauvages, tout en accédant à une carte interactive localisant les toilettes publiques et les composteurs les plus proches.\n\nConçue pour encourager des comportements responsables et renforcer l'accessibilité aux infrastructures, Cleany contribue à un environnement urbain plus sain.",
      en: "As part of a project for Epitech, we were tasked with designing an application aimed at gradually supporting cities in their digital transformation. We developed Cleany.\n\nCleany facilitates resident engagement in urban cleanliness and ecology. With just a few clicks, users can report issues like illegal dumping in their neighborhood while accessing an interactive map that locates nearby public restrooms and composting stations.\n\nDesigned to promote responsible behavior and enhance accessibility to infrastructure, Cleany helps build a cleaner urban environment.",
    },
    links: [
      { type: "github", url: "https://github.com/Alekxays/Cleany" },
      {
        type: "figma",
        url: "https://www.figma.com/design/RszBdMbH0VMxTj0to3X1Ai/Cleany-App?node-id=0-1",
      },
    ],
    image: "/img/projects/cleany.jpg",
  },
  {
    id: "hub",
    title: "H.U.B Epitech Paris",
    year: "2024",
    status: "finished",
    skills: ["Next.js", "TypeScript", "Firebase", "Figma", "Trello", "GitHub"],
    summary: {
      fr: "Site web pour l'association H.U.B (High-Tech Upbringing Bureau).",
      en: "Website for the H.U.B (High-Tech Upbringing Bureau) association.",
    },
    pitch: {
      fr: "Dans le cadre de mon parcours à Epitech, j'ai développé un site web pour le High-tech Upbringing Bureau (H.U.B), une association dédiée à la promotion des industries créatives et numériques. Ce site, réalisé avec Next.js et Tailwind CSS, vise à refléter la mission de l'association : encourager la créativité et l'innovation technologique.\n\nLe H.U.B offre un espace équipé de matériel de pointe, spécialement aménagé pour stimuler la collaboration entre étudiants et professionnels de la tech et des industries créatives.",
      en: "As part of my studies at Epitech, I developed a website for the High-tech Upbringing Bureau (H.U.B), an association dedicated to promoting the creative and digital industries. This site, built with Next.js and Tailwind CSS, aims to reflect the association's mission: to foster creativity and technological innovation.\n\nThe H.U.B offers a space equipped with state-of-the-art technology, specially designed to stimulate collaboration between students and professionals in tech and creative industries.",
    },
    links: [
      { type: "website", url: "https://www.hub-innovation.org" },
      {
        type: "figma",
        url: "https://www.figma.com/design/6KOE2mS5eoU1X0if94D9Ww/H.U.B?node-id=0-1",
      },
    ],
  },
  {
    id: "animeo",
    title: "Animeo",
    year: "2024",
    status: "finished",
    skills: ["React Native", "TypeScript", "Firebase", "Figma", "GitHub"],
    summary: {
      fr: "Application mobile et backend pour la santé animale.",
      en: "Mobile app and backend for pet health management.",
    },
    pitch: {
      fr: "Dans le cadre de mon cursus à Epitech, j'ai contribué au développement d'Animeo, un outil destiné à simplifier la gestion de la santé et du bien-être des animaux de compagnie.\n\nAnimeo aide les propriétaires à trouver rapidement des professionnels de la santé animale, comme des vétérinaires et des ostéopathes, et à suivre les soins de leurs compagnons. L'application propose une interface intuitive et une carte interactive pour localiser les services nécessaires et prendre rendez-vous facilement.",
      en: "As part of my studies at Epitech, I contributed to the development of Animeo, a tool aimed at simplifying the management of pet health and well-being.\n\nAnimeo helps pet owners quickly find animal health professionals, such as veterinarians and osteopaths, and track their pets' care. The app offers an intuitive interface and an interactive map to locate necessary services and easily schedule appointments.",
    },
    links: [],
  },
];
