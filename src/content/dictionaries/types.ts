export interface Dictionary {
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  nav: {
    home: string;
    about: string;
    projects: string;
    contact: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    eyebrow: string;
    brand: string;
    lede: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scroll: string;
  };
  about: {
    eyebrow: string;
    title: string;
    p1: string;
    p2: string;
    p3: string;
    conclusion: string;
    skillsLabel: string;
  };
  projects: {
    eyebrow: string;
    title: string;
    tagline: string;
    open: string;
    close: string;
    filterAll: string;
    status: {
      ongoing: string;
      paused: string;
      finished: string;
    };
    links: {
      github: string;
      figma: string;
      website: string;
    };
    emptyImage: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    name: string;
    email: string;
    message: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
    orEmail: string;
    placeholders: {
      name: string;
      email: string;
      message: string;
    };
  };
  footer: {
    credit: string;
    rights: string;
  };
}
