"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { Button } from "@picantully/design-system";
import { Icon } from "@picantully/design-system/icons";
import { functions, FUNCTION_WAITLIST_ID } from "@/lib/appwrite";
import { PLATFORMS, type PlatformValue } from "@/lib/platforms";

type FormStatus =
  | "idle"
  | "loading"
  | "success"
  | "selected"
  | "duplicate"
  | "error";

// Response contract returned by the `waitlist` Appwrite Function.
type WaitlistResponse = {
  ok: boolean;
  position?: number;
  status?: string;
  isITBA?: boolean;
  alreadyOnList?: boolean;
  error?: string;
  message?: string;
};

const ONBOARDING_URL = "https://www.picantully.com/onboarding";
type OccupationValue = "study" | "work";

// ── Validation schema ───────────────────────────────────────────────────────

const waitlistSchema = z
  .object({
    email: z
      .string()
      .email("Ese mail no me convence. Poné uno de verdad."),
    hasOccupation: z
      .boolean()
      .refine((v) => v === true, {
        message: "Decime qué onda: ¿estudiás, laburás, o procrastinás?",
      }),
    platforms: z
      .string()
      .array()
      .min(1, "Elegí al menos una plataforma donde querés recuperar el foco."),
    occupations: z.array(z.string()),
    studyField: z.string(),
    workField: z.string(),
  })
  .superRefine(({ occupations, studyField, workField }, ctx) => {
    if (occupations.includes("study") && !studyField.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studyField"],
        message: "Contanos qué estudiás.",
      });
    }
    if (occupations.includes("work") && !workField.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["workField"],
        message: "Contanos en qué trabajás.",
      });
    }
  });

type ValidationErrors = Partial<
  Record<"email" | "hasOccupation" | "platforms" | "studyField" | "workField", string>
>;

// ── Occupation options ──────────────────────────────────────────────────────

const OCC_OPTIONS: { value: OccupationValue; label: string; icon: React.ReactNode }[] = [
  {
    value: "study",
    label: "Estudio",
    icon: <Icon name="edu" size={16} color="currentColor" stroke={1.9} />,
  },
  {
    value: "work",
    label: "Trabajo",
    icon: <Icon name="briefcase" size={16} color="currentColor" stroke={1.9} />,
  },
];

// ── Shared input styles ─────────────────────────────────────────────────────

const inputClass =
  "h-[54px] w-full rounded-[15px] border border-border2 px-[18px] text-[15.5px] text-ink outline-none transition-colors placeholder:text-mut2 focus:border-red disabled:opacity-50";
const inputStyle = { background: "rgba(255,255,255,0.05)" };

// ── Occupation chip (full-width stretch) ────────────────────────────────────

function ToggleChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[46px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[14px] border text-[13.5px] font-bold transition disabled:opacity-50"
      style={
        active
          ? {
              background: "linear-gradient(150deg,var(--pica-red),var(--pica-red-dark))",
              color: "#fff",
              borderColor: "transparent",
            }
          : {
              background: "rgba(255,255,255,0.04)",
              color: "var(--pica-mut)",
              borderColor: "var(--pica-border2)",
            }
      }
    >
      {children}
    </button>
  );
}

// ── Platform card (icon + label, selectable) ────────────────────────────────

function PlatformCard({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border px-3 py-3 text-[12.5px] font-bold transition disabled:opacity-50"
      style={
        active
          ? {
              background: "linear-gradient(150deg,rgba(239,68,56,0.18),rgba(180,28,18,0.22))",
              color: "var(--pica-ink)",
              borderColor: "var(--pica-red)",
              boxShadow: "0 0 0 1px var(--pica-red)",
            }
          : {
              background: "rgba(255,255,255,0.04)",
              color: "var(--pica-mut)",
              borderColor: "var(--pica-border2)",
            }
      }
    >
      {active && (
        <span
          className="absolute right-1.5 top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full"
          style={{ background: "var(--pica-red)" }}
        >
          <Icon name="check" size={9} color="#fff" stroke={2.5} />
        </span>
      )}
      {children}
    </button>
  );
}

// ── Animated detail input ───────────────────────────────────────────────────

function DetailInput({
  label,
  placeholder,
  value,
  onChange,
  onClearError,
  disabled,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onClearError?: () => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div
      className="overflow-hidden transition-all duration-200"
      style={{ maxHeight: "96px", opacity: 1 }}
    >
      <div className="pb-1 pt-2.5">
        <label className="mb-1.5 block text-[12px] font-bold text-mut2">{label}</label>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onClearError?.();
          }}
          disabled={disabled}
          maxLength={160}
          className={`h-[44px] w-full rounded-[12px] border px-[14px] text-[14px] text-ink outline-none transition-colors placeholder:text-mut2 focus:border-red disabled:opacity-50${error ? " border-red" : " border-border2"}`}
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <FieldError message={error} />
      </div>
    </div>
  );
}

// ── Inline field error ──────────────────────────────────────────────────────

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--pica-red)" }}>
      {message}
    </p>
  );
}

// ── Main form component ─────────────────────────────────────────────────────

interface WaitlistFormProps {
  preselectedPlatform?: PlatformValue | null;
  onResolved?: (resolved: boolean) => void;
}

export default function WaitlistForm({ preselectedPlatform, onResolved }: WaitlistFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [occupations, setOccupations] = useState<Set<OccupationValue>>(new Set());
  const [procrastinating, setProcrastinating] = useState(false);
  const [platforms, setPlatforms] = useState<Set<PlatformValue>>(new Set());
  const [studyField, setStudyField] = useState("");
  const [workField, setWorkField] = useState("");
  const [position, setPosition] = useState<string>("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const emailRef = useRef<HTMLInputElement>(null);

  // Notify parent when the form reaches a terminal result state.
  useEffect(() => {
    if (status === "success" || status === "selected" || status === "duplicate") {
      onResolved?.(true);
    }
  }, [status, onResolved]);

  // Pre-select platform when the prop changes (e.g. from a download button
  // click). Adjusting state during render — while tracking the last value we
  // reacted to — is React's recommended pattern for syncing to a changed prop;
  // it avoids the cascading re-render of doing the same work in an effect.
  const [lastPreselected, setLastPreselected] = useState<PlatformValue | null>(null);
  if (preselectedPlatform && preselectedPlatform !== lastPreselected) {
    setLastPreselected(preselectedPlatform);
    setPlatforms((prev) => {
      if (prev.has(preselectedPlatform)) return prev;
      const next = new Set(prev);
      next.add(preselectedPlatform);
      return next;
    });
  }

  function toggleOccupation(val: OccupationValue) {
    setProcrastinating(false);
    setOccupations((prev) => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
        if (val === "study") setStudyField("");
        if (val === "work") setWorkField("");
      } else {
        next.add(val);
      }
      return next;
    });
    // Clear occupation error once user interacts with the field
    setErrors((prev) => ({ ...prev, hasOccupation: undefined }));
  }

  function toggleProcrastinating() {
    setProcrastinating((prev) => {
      if (!prev) {
        setOccupations(new Set());
        setStudyField("");
        setWorkField("");
      }
      return !prev;
    });
    // Clear occupation error once user interacts with the field
    setErrors((prev) => ({ ...prev, hasOccupation: undefined }));
  }

  function togglePlatform(val: PlatformValue) {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
    // Clear platforms error once user picks at least one
    setErrors((prev) => ({ ...prev, platforms: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = emailRef.current?.value?.trim() ?? "";

    // ── Zod validation ──────────────────────────────────────────────────────
    const result = waitlistSchema.safeParse({
      email,
      hasOccupation: occupations.size > 0 || procrastinating,
      platforms: Array.from(platforms),
      occupations: Array.from(occupations),
      studyField,
      workField,
    });

    if (!result.success) {
      const fieldErrors: ValidationErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ValidationErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      // Focus the first invalid field
      if (fieldErrors.email && emailRef.current) {
        emailRef.current.focus();
      }
      return;
    }

    setErrors({});
    setStatus("loading");

    // The `waitlist` table is locked to clients. We call the server-side
    // function, which writes with the dynamic API key, dedups by email and
    // sends the branded email. We only show success on a real `ok:true`.
    //
    // Anti-spam (no captcha yet): we rely on Appwrite's built-in per-IP rate
    // limit on createExecution + the function's unique-email dedup (early
    // return, no re-email). Turnstile/captcha is a future hardening.
    try {
      const trimmedStudy = studyField.trim();
      const trimmedWork = workField.trim();

      const payload = {
        email,
        occupations: Array.from(occupations),
        platforms: Array.from(platforms),
        ...(trimmedStudy ? { studyField: trimmedStudy } : {}),
        ...(trimmedWork ? { workField: trimmedWork } : {}),
      };

      const execution = await functions.createExecution({
        functionId: FUNCTION_WAITLIST_ID,
        body: JSON.stringify(payload),
        async: false,
      });

      // Non-2xx execution OR unparseable body → treat as failure.
      if (execution.responseStatusCode >= 400) {
        setStatus("error");
        return;
      }

      let data: WaitlistResponse;
      try {
        data = JSON.parse(execution.responseBody) as WaitlistResponse;
      } catch {
        setStatus("error");
        return;
      }

      if (!data.ok) {
        // Server-side validation rejection: show message inline on the relevant
        // field when we can map it, otherwise fall through to generic error.
        if (data.error === "missing_study_field" && data.message) {
          setErrors({ studyField: data.message });
          setStatus("idle");
        } else if (data.error === "missing_work_field" && data.message) {
          setErrors({ workField: data.message });
          setStatus("idle");
        } else {
          setStatus("error");
        }
        return;
      }

      if (typeof data.position === "number") {
        setPosition("#" + data.position.toLocaleString("es-AR"));
      } else {
        setPosition("");
      }

      if (data.alreadyOnList) {
        setStatus("duplicate");
      } else if (data.isITBA || data.status === "accepted") {
        setStatus("selected");
      } else {
        setStatus("success");
      }
    } catch {
      // Network error / SDK throw (e.g. rate limited) → never fake success.
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="py-2.5 text-center">
        <h3 className="disp text-[30px] font-bold">
          <span className="grad-green">
            Estás adentro!{" "}
            <Icon name="flame" size={28} color="var(--pica-green)" stroke={1.9} />
          </span>
        </h3>
        <p className="my-3 text-[16px] text-mut">
          {position ? (
            <>
              Sos el <b className="text-ink">{position}</b> de la lista. Te
              avisamos apenas se libere tu lugar. Mientras tanto cerrá esa
              pestaña.
            </>
          ) : (
            <>
              Te avisamos apenas se libere tu lugar. Mientras tanto cerrá esa
              pestaña.
            </>
          )}
        </p>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-[7px] text-[13px] font-bold">
          <span className="h-[7px] w-[7px] rounded-full bg-green" /> Te guardamos el
          lugar
        </span>
      </div>
    );
  }

  if (status === "selected") {
    return (
      <div className="py-2.5 text-center">
        <h3 className="disp text-[30px] font-bold">
          <span className="grad-green">
            ¡Quedaste seleccionado!{" "}
            <Icon name="flame" size={28} color="var(--pica-green)" stroke={1.9} />
          </span>
        </h3>
        <p className="my-3 text-[16px] text-mut">
          Tenés acceso directo. Te mandamos el acceso por mail. Empezá el
          onboarding ahora.
        </p>
        <a
          href={ONBOARDING_URL}
          className="inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-[14.5px] font-bold text-white"
          style={{
            background:
              "linear-gradient(150deg,var(--pica-red),var(--pica-red-dark))",
          }}
        >
          Empezar el onboarding{" "}
          <Icon name="flame" size={16} color="#fff" stroke={2} />
        </a>
      </div>
    );
  }

  if (status === "duplicate") {
    return (
      <div className="py-2.5 text-center">
        <h3 className="disp text-[30px] font-bold">Ya estás en la lista, crack.</h3>
        <p className="my-3 text-[16px] text-mut">
          {position ? (
            <>
              Sos el <b className="text-ink">{position}</b> de la lista. Calma,
              que te avisamos cuando sea el momento.{" "}
              <Icon name="flame" size={16} color="var(--pica-red)" stroke={1.9} />
            </>
          ) : (
            <>
              Calma, que te avisamos cuando sea el momento.{" "}
              <Icon name="flame" size={16} color="var(--pica-red)" stroke={1.9} />
            </>
          )}
        </p>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-[7px] text-[13px] font-bold">
          <span className="h-[7px] w-[7px] rounded-full bg-green" /> Tu lugar está
          guardado
        </span>
      </div>
    );
  }

  const isLoading = status === "loading";
  const showStudy = occupations.has("study");
  const showWork = occupations.has("work");

  return (
    <form onSubmit={handleSubmit} noValidate className="text-left">
      {/* Email */}
      <div className="mb-4">
        <label className="mb-2.5 block text-[13px] font-bold text-mut">Tu email</label>
        <input
          ref={emailRef}
          type="email"
          placeholder="vos@email.com"
          disabled={isLoading}
          onChange={() => setErrors((prev) => ({ ...prev, email: undefined }))}
          className={`${inputClass}${errors.email ? " border-red" : ""}`}
          style={inputStyle}
          aria-label="Email para la lista de espera"
        />
        <FieldError message={errors.email} />
      </div>

      {/* Occupation multi-select */}
      <div className="mb-4">
        <label className="mb-2.5 block text-[13px] font-bold text-mut">
          ¿Qué hacés hoy?
        </label>
        <div className="flex flex-wrap gap-2.5">
          {OCC_OPTIONS.map((o) => (
            <ToggleChip
              key={o.value}
              active={occupations.has(o.value)}
              disabled={isLoading}
              onClick={() => toggleOccupation(o.value)}
            >
              {o.icon}
              {o.label}
            </ToggleChip>
          ))}
          {/* Exclusive "neither" option */}
          <ToggleChip
            active={procrastinating}
            disabled={isLoading}
            onClick={toggleProcrastinating}
          >
            <Icon name="coffee" size={16} color="currentColor" stroke={1.9} />
            Procrastino
          </ToggleChip>
        </div>
        <FieldError message={errors.hasOccupation} />

        {/* Conditional detail inputs — both can show simultaneously */}
        {showStudy && (
          <DetailInput
            label="¿Qué estudiás?"
            placeholder="Diseño, ingeniería, idiomas…"
            value={studyField}
            onChange={setStudyField}
            onClearError={() => setErrors((prev) => ({ ...prev, studyField: undefined }))}
            disabled={isLoading}
            error={errors.studyField}
          />
        )}
        {showWork && (
          <DetailInput
            label="¿En qué trabajás?"
            placeholder="Desarrollo, marketing, consultoría…"
            value={workField}
            onChange={setWorkField}
            onClearError={() => setErrors((prev) => ({ ...prev, workField: undefined }))}
            disabled={isLoading}
            error={errors.workField}
          />
        )}
      </div>

      {/* Platform multi-select */}
      <div className="mb-4">
        <label className="mb-2.5 block text-[13px] font-bold text-mut">
          ¿Dónde querés recuperar el foco?
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PLATFORMS.map((p) => (
            <PlatformCard
              key={p.value}
              active={platforms.has(p.value)}
              disabled={isLoading}
              onClick={() => togglePlatform(p.value)}
            >
              {p.icon(20)}
              {p.title}
            </PlatformCard>
          ))}
        </div>
        <FieldError message={errors.platforms} />
      </div>

      <Button type="submit" kind="red" full disabled={isLoading} style={{ marginTop: 6 }}>
        {isLoading ? (
          "Un segundo…"
        ) : (
          <span className="flex items-center justify-center gap-2">
            Quiero mi lugar{" "}
            <Icon name="flame" size={17} color="#fff" stroke={2} />
          </span>
        )}
      </Button>

      {status === "error" && (
        <p className="mt-3.5 text-center text-[12.5px] text-red">
          Uy, algo no se guardó bien. Escribinos a{" "}
          <a href="mailto:help@picantully.com" className="underline">
            help@picantully.com
          </a>{" "}
          y lo resolvemos.
        </p>
      )}
      {status !== "error" && (
        <div className="mt-3.5 text-[12.5px] text-mut2">
          Sin spam. Te escribimos solo para darte acceso.
        </div>
      )}
    </form>
  );
}
