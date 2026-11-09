export const APPLICATION_STATUSES = [
  "todo",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_CHANNELS = [
  "linkedin",
  "website",
  "email",
  "referral",
  "other",
] as const;

export type ApplicationChannel = (typeof APPLICATION_CHANNELS)[number];

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  channel: ApplicationChannel;
  url?: string;
  location?: string;
  appliedAt?: string;
  followUpAt?: string;
  interviewAt?: string;
  notes: string;
  jobDescription: string;
  draftLm: string;
  draftMail: string;
  draftCv: string;
  createdAt: string;
  updatedAt: string;
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  todo: "To do",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    typeof value === "string" &&
    (APPLICATION_STATUSES as readonly string[]).includes(value)
  );
}

export function isApplicationChannel(
  value: unknown,
): value is ApplicationChannel {
  return (
    typeof value === "string" &&
    (APPLICATION_CHANNELS as readonly string[]).includes(value)
  );
}
