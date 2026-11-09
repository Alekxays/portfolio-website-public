export type StudioProfile = {
  fullName: string;
  email: string;
  phone: string;
  school: string;
  program: string;
  targetRole: string;
  skills: string;
  experience: string;
  cvText: string;
  tone: string;
  updatedAt: string;
};

export const emptyProfile = (): StudioProfile => ({
  fullName: "",
  email: "",
  phone: "",
  school: "",
  program: "",
  targetRole: "",
  skills: "",
  experience: "",
  cvText: "",
  tone: "pro_chaleureux",
  updatedAt: "",
});
