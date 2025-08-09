export interface AtomMaterial {
  id: string;
  name: string;
  background: string;
  textColor: string;
  border: string;
  shadowColor: string;
  glowEffect: string;
}

export const ATOM_MATERIALS: Record<string, AtomMaterial> = {
  library: {
    id: "library",
    name: "Library",
    background: "linear-gradient(135deg, #fee2e2, #dc2626, #991b1b)",
    textColor: "#ffffff",
    border: "3px solid rgba(220, 38, 38, 0.8)",
    shadowColor: "rgba(220, 38, 38, 0.4)",
    glowEffect: "0 0 30px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.3)",
  },
  author: {
    id: "author",
    name: "Authors",
    background: "linear-gradient(135deg, #d1fae5, #10b981, #059669)",
    textColor: "#ffffff",
    border: "3px solid rgba(16, 185, 129, 0.8)",
    shadowColor: "rgba(16, 185, 129, 0.4)",
    glowEffect: "0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)",
  },
  social: {
    id: "social",
    name: "Social Media",
    background: "linear-gradient(135deg, #dbeafe, #3b82f6, #1d4ed8)",
    textColor: "#ffffff",
    border: "3px solid rgba(59, 130, 246, 0.8)",
    shadowColor: "rgba(59, 130, 246, 0.4)",
    glowEffect: "0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)",
  },
};
