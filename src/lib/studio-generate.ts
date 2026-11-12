import type { Application } from "@/lib/applications";
import type { StudioGenerateKind } from "@/lib/ai";
import { runStudioChat } from "@/lib/ai";
import type { StudioProfile } from "@/lib/profile";

function profileBlock(profile: StudioProfile) {
  return [
    `Nom: ${profile.fullName}`,
    profile.email ? `Email: ${profile.email}` : "",
    profile.phone ? `Téléphone: ${profile.phone}` : "",
    profile.school ? `École: ${profile.school}` : "",
    profile.program ? `Formation: ${profile.program}` : "",
    profile.targetRole ? `Objectif: ${profile.targetRole}` : "",
    profile.skills ? `Compétences:\n${profile.skills}` : "",
    profile.experience ? `Expérience / projets:\n${profile.experience}` : "",
    profile.cvText ? `CV (texte):\n${profile.cvText}` : "",
    `Ton souhaité: ${profile.tone || "pro_chaleureux"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function offerBlock(application: Application, jobDescription: string) {
  return [
    `Entreprise: ${application.company}`,
    `Poste: ${application.role}`,
    application.location ? `Lieu: ${application.location}` : "",
    application.url ? `URL offre: ${application.url}` : "",
    application.notes ? `Notes perso: ${application.notes}` : "",
    jobDescription
      ? `Description / annonce:\n${jobDescription}`
      : "Description: (non fournie - reste généraliste mais crédible)",
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM = `Tu es un coach carrière francophone pour une recherche d'alternance / apprentissage.
Tu rédiges des textes concrets, naturels, sans jargon IA, sans flatterie excessive.
N'invente jamais d'entreprises, diplômes, dates ou compétences absentes du profil.
Si une info manque, reste prudent ou formule de façon générale.
Réponds uniquement avec le texte demandé, sans préambule ni markdown de titre.`;

export async function generateApplicationCopy(options: {
  kind: StudioGenerateKind;
  profile: StudioProfile;
  application: Application;
  jobDescription?: string;
  mailKind?: "apply" | "followup";
  quality?: boolean;
}) {
  const jobDescription =
    options.jobDescription?.trim() || options.application.jobDescription || "";
  const profile = profileBlock(options.profile);
  const offer = offerBlock(options.application, jobDescription);

  if (options.kind === "lm") {
    return runStudioChat({
      quality: options.quality,
      maxTokens: 1600,
      system: SYSTEM,
      user: `Rédige une lettre de motivation en français pour une candidature d'alternance.

Contraintes:
- 250 à 400 mots
- Structure: accroche → adéquation profil/offre → motivation école/projet → conclusion + disponibilité
- Tutoiement interdit; vouvoiement
- Pas de formules creuses ("passionné depuis toujours")

PROFIL CANDIDAT
${profile}

OFFRE
${offer}`,
    });
  }

  if (options.kind === "mail") {
    const followup = options.mailKind === "followup";
    return runStudioChat({
      quality: options.quality,
      maxTokens: 900,
      system: SYSTEM,
      user: followup
        ? `Rédige un e-mail de relance poli en français (objet + corps).

Contraintes:
- Court (80–140 mots)
- Rappelle candidature + poste + entreprise
- Propose un échange sans pression
- Format:
Objet: ...
---
Corps

PROFIL
${profile}

OFFRE
${offer}`
        : `Rédige un e-mail de candidature en français (objet + corps) pour accompagner une lettre / CV.

Contraintes:
- Court (90–160 mots)
- Clair, pro, humain
- Format:
Objet: ...
---
Corps

PROFIL
${profile}

OFFRE
${offer}`,
    });
  }

  return runStudioChat({
    quality: options.quality,
    maxTokens: 1400,
    system: SYSTEM,
    user: `À partir du CV / profil, propose une version adaptée à CETTE offre d'alternance.

Produis uniquement:
1) Titre / accroche CV (1 ligne)
2) 6 à 10 puces "Expérience & projets" réordonnées / reformulées pour matcher l'offre
3) 8 à 12 compétences clés (liste)
4) 3 phrases "À propos" adaptées

Ne fabrique pas d'expérience fictive; reformule et priorise ce qui existe.

PROFIL
${profile}

OFFRE
${offer}`,
  });
}
