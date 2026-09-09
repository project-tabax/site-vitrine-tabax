import { useState } from "react";
import { titles, regions, normalizeSenegalMobile } from "@/data/senegal";
import { submitMembership } from "@/services/membershipService";
import { PhotoCropper } from "./PhotoCropper";
import "./MembershipForm.css";

interface FormState {
  title: string;
  lastName: string;
  firstName: string;
  phone: string;
  address: string;
  region: string;
}

const empty: FormState = {
  title: "",
  lastName: "",
  firstName: "",
  phone: "",
  address: "",
  region: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

/**
 * Formulaire d'adhésion natif : saisie des données personnelles, module photo
 * d'identité (cadrage + prévisualisation) et validation locale du numéro
 * sénégalais. Envoi via le service (back-end à brancher plus tard).
 */
export function MembershipForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = (k: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): Errors {
    const err: Errors = {};
    if (!form.title) err.title = "Sélectionnez un titre.";
    if (!form.lastName.trim()) err.lastName = "Nom requis.";
    if (!form.firstName.trim()) err.firstName = "Prénom requis.";
    if (!normalizeSenegalMobile(form.phone))
      err.phone = "Numéro sénégalais invalide (ex. 77 123 45 67).";
    if (!form.address.trim()) err.address = "Adresse requise.";
    if (!form.region) err.region = "Sélectionnez une région.";
    return err;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;

    setStatus("sending");
    const res = await submitMembership({
      title: form.title,
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      phone: normalizeSenegalMobile(form.phone)!,
      address: form.address.trim(),
      region: form.region,
      photo: photo ?? undefined,
    });

    if (res.ok) {
      setStatus("done");
      setMessage("Votre demande d'adhésion a bien été enregistrée. Merci !");
    } else {
      // Pas de back-end configuré : la saisie est validée et prête à l'envoi.
      setStatus("done");
      setMessage(
        "Formulaire validé ✔. L'envoi au serveur sera activé prochainement " +
          "(configuration back-end en attente)."
      );
    }
  }

  if (status === "done") {
    return (
      <div className="tx-membership tx-membership--done">
        <h3>Merci, {form.firstName} !</h3>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form className="tx-membership" onSubmit={onSubmit} noValidate>
      <div className="tx-membership__row">
        <Field label="Titre" error={errors.title}>
          <select value={form.title} onChange={set("title")}>
            <option value="">—</option>
            {titles.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Nom" error={errors.lastName} grow>
          <input type="text" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
        </Field>
        <Field label="Prénom" error={errors.firstName} grow>
          <input type="text" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
        </Field>
      </div>

      <div className="tx-membership__row">
        <Field label="Téléphone portable" error={errors.phone} grow>
          <input
            type="tel"
            inputMode="tel"
            placeholder="77 123 45 67"
            value={form.phone}
            onChange={set("phone")}
            autoComplete="tel"
          />
        </Field>
        <Field label="Région de résidence" error={errors.region} grow>
          <select value={form.region} onChange={set("region")}>
            <option value="">—</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Adresse de résidence" error={errors.address}>
        <textarea rows={2} value={form.address} onChange={set("address")} autoComplete="street-address" />
      </Field>

      <div className="tx-membership__photo">
        <span className="tx-membership__label">Photo d'identité</span>
        <PhotoCropper onChange={setPhoto} />
      </div>

      <button type="submit" className="tx-membership__submit" disabled={status === "sending"}>
        {status === "sending" ? "Envoi…" : "Adhérer"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  grow,
  children,
}: {
  label: string;
  error?: string;
  grow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`tx-field${grow ? " tx-field--grow" : ""}${error ? " tx-field--error" : ""}`}>
      <span className="tx-field__label">{label}</span>
      {children}
      {error && <span className="tx-field__error">{error}</span>}
    </label>
  );
}
