/**
 * User-facing server messages in the UI languages.
 * The web app sends its current language in `Accept-Language`; anything else
 * (or a missing header) gets English. Protocol/developer errors stay English.
 */
import { HTTPError } from "nitro/h3"
import type { H3Event } from "nitro/h3"

export const LOCALES = ["en", "fr"] as const
export type Locale = (typeof LOCALES)[number]

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

const en = {
  notAuthenticated: "Not signed in",
  invalidCredentials: "Invalid email or password",
  emailTaken: "An account already exists with this email",
  fieldLength: "{field} must be between {min} and {max} characters",
  "field.name": "Name",
  "field.email": "Email",
  "field.password": "Password",
  "field.body": "Message",
  invalidLocale: "Unsupported language",
  unknownUser: "No account with the email {email}",
  unknownUsers: "No accounts with these emails: {emails}",
  directNeedsOne: "A direct conversation is with exactly one other person",
  roomNotFound: "Conversation not found",
  mediaNotFound: "Media not found",
  voiceUnsupportedFormat: "Unsupported audio format",
  voiceTooLarge: "Voice message too large (10 MB max)",
  voiceEmpty: "Empty voice message",
  voiceUnavailable: "Voice messages are not available on this server",
  voiceUnreadable: "Unreadable audio file",
  voiceTooShort: "Voice message too short",
  voiceTooLong: "A voice message can't be longer than 5 minutes",
}

export type MessageKey = keyof typeof en

const fr: Record<MessageKey, string> = {
  notAuthenticated: "Non connecté",
  invalidCredentials: "Email ou mot de passe incorrect",
  emailTaken: "Un compte existe déjà avec cet email",
  fieldLength: "{field} doit contenir entre {min} et {max} caractères",
  "field.name": "Le nom",
  "field.email": "L’email",
  "field.password": "Le mot de passe",
  "field.body": "Le message",
  invalidLocale: "Langue non prise en charge",
  unknownUser: "Aucun compte avec l’email {email}",
  unknownUsers: "Aucun compte avec ces emails : {emails}",
  directNeedsOne: "Une conversation privée se fait avec une seule autre personne",
  roomNotFound: "Conversation introuvable",
  mediaNotFound: "Média introuvable",
  voiceUnsupportedFormat: "Format audio non pris en charge",
  voiceTooLarge: "Message vocal trop volumineux (10 Mo maximum)",
  voiceEmpty: "Message vocal vide",
  voiceUnavailable: "Les messages vocaux ne sont pas disponibles sur ce serveur",
  voiceUnreadable: "Fichier audio illisible",
  voiceTooShort: "Message vocal trop court",
  voiceTooLong: "Un message vocal ne peut pas dépasser 5 minutes",
}

const messages: Record<Locale, Record<MessageKey, string>> = { en, fr }

/** First supported language of `Accept-Language` (the app sends exactly one), else English. */
export function requestLocale(event: H3Event): Locale {
  const header = event.req.headers.get("accept-language") ?? ""
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase().slice(0, 2)
    if (isLocale(tag)) return tag
  }
  return "en"
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`),
  )
}

/** An HTTP error whose message is in the requester's language. */
export function localizedError(
  event: H3Event,
  status: number,
  key: MessageKey,
  params?: Record<string, string | number>,
): HTTPError {
  return new HTTPError({ status, message: translate(requestLocale(event), key, params) })
}
