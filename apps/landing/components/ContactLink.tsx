"use client";

import { useCallback, useRef, useState } from "react";

const CONTACT_EMAIL = "hi@picantully.com";

async function copyToClipboard(text: string): Promise<boolean> {
  // Preferred path: async Clipboard API. Works in secure contexts (HTTPS) on a
  // user gesture, with no permission prompt for the active page.
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy fallback
  }

  // Legacy fallback for older browsers / non-secure contexts.
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

type ContactLinkProps = {
  /** Visible label. Defaults to the email address itself. */
  label?: string;
  className?: string;
  /** Text shown briefly after a successful copy. */
  copiedLabel?: string;
};

/**
 * Renders a contact link that, on click, copies the contact email to the
 * clipboard AND opens the user's mail client (mailto). The mailto navigation is
 * left intact; copying is a best-effort side effect that never blocks it.
 */
export default function ContactLink({
  label = CONTACT_EMAIL,
  className,
  copiedLabel = "¡Copiado!",
}: ContactLinkProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async () => {
    const ok = await copyToClipboard(CONTACT_EMAIL);
    if (!ok) return;
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1800);
  }, []);

  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      onClick={handleClick}
      className={className}
      title={`Escribinos — ${CONTACT_EMAIL} (se copia al portapapeles)`}
      aria-label={`Contacto: ${CONTACT_EMAIL}. Al hacer clic se copia al portapapeles y se abre tu cliente de correo.`}
    >
      {copied ? copiedLabel : label}
      <span aria-live="polite" className="sr-only">
        {copied ? `${CONTACT_EMAIL} copiado al portapapeles` : ""}
      </span>
    </a>
  );
}
