import { getLocales } from "expo-localization"

const en = {
  title: "Connect to your server",
  hint: "Paste the address shown in the terminal when Converse starts. It changes each time the server restarts.",
  label: "Server address",
  placeholder: "https://….trycloudflare.com",
  paste: "Paste",
  connect: "Connect",
  connecting: "Connecting…",
  errorEmpty: "Enter the server address.",
  errorInvalid: "This isn't a valid address.",
  errorUnreachable: "Can't reach this server. Check the address and that Converse is running.",
  errorNotConverse: "This address doesn't look like a Converse server.",
  errorLost: "Connection to the server lost. It may have restarted with a new address.",
}

type Strings = typeof en

const fr: Strings = {
  title: "Connexion à votre serveur",
  hint: "Collez l’adresse affichée dans le terminal au lancement de Converse. Elle change à chaque redémarrage du serveur.",
  label: "Adresse du serveur",
  placeholder: "https://….trycloudflare.com",
  paste: "Coller",
  connect: "Se connecter",
  connecting: "Connexion…",
  errorEmpty: "Saisissez l’adresse du serveur.",
  errorInvalid: "Cette adresse n’est pas valide.",
  errorUnreachable: "Impossible de joindre ce serveur. Vérifiez l’adresse et que Converse est lancé.",
  errorNotConverse: "Cette adresse ne semble pas être un serveur Converse.",
  errorLost: "Connexion au serveur perdue. Il a peut-être redémarré avec une nouvelle adresse.",
}

/** Phone language: French if the device is in French, English otherwise (like the web app). */
export const language: "en" | "fr" = getLocales()[0]?.languageCode === "fr" ? "fr" : "en"

export const strings: Strings = language === "fr" ? fr : en
