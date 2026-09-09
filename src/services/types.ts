// Contrats de données des fonctionnalités dépendant d'un back-end.
// Le back-end n'existe pas encore : ces types figent l'interface d'intégration.

export interface ContactMessage {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface MembershipApplication {
  title: string; // M., Mme, Dr, …
  lastName: string; // Nom
  firstName: string; // Prénom
  phone: string; // mobile sénégalais normalisé (9 chiffres)
  address: string; // adresse de résidence
  region: string; // région de résidence
  photo?: string; // photo d'identité cadrée (JPEG dataURL)
}

export interface DonationIntent {
  amount: number;
  currency: "XOF" | "EUR" | "USD";
  recurring: boolean;
  donor: { name: string; email: string };
}

export interface ServiceResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}
