import * as Clipboard from "expo-clipboard"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { language, strings } from "./i18n"
import { checkServer, loadLastServerUrl, normalizeServerUrl, saveLastServerUrl } from "./server"
import { colors } from "./theme"

type Props = {
  /** Shown when coming back because the chat lost its server. */
  initialError?: string
  onConnected: (origin: string) => void
}

/**
 * Shown every time the app opens: the Quick Tunnel address changes whenever the
 * server restarts, so the user confirms (or pastes) it each time.
 */
export function ServerScreen({ initialError, onConnected }: Props) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState(initialError)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void loadLastServerUrl().then((last) => setUrl((current) => current || last))
  }, [])

  async function paste() {
    const text = (await Clipboard.getStringAsync()).trim()
    if (!text) return
    // Keep only the address when a whole terminal line was copied.
    setUrl(text.match(/https?:\/\/\S+/i)?.[0] ?? text)
    setError(undefined)
  }

  async function connect() {
    if (!url.trim()) return setError(strings.errorEmpty)
    const origin = normalizeServerUrl(url)
    if (!origin) return setError(strings.errorInvalid)

    setError(undefined)
    setBusy(true)
    const result = await checkServer(origin, language)
    setBusy(false)
    if (result === "unreachable") return setError(strings.errorUnreachable)
    if (result === "notConverse") return setError(strings.errorNotConverse)

    setUrl(origin)
    await saveLastServerUrl(origin)
    onConnected(origin)
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>CONVERSE</Text>
        <Text style={styles.title}>{strings.title}</Text>
        <Text style={styles.hint}>{strings.hint}</Text>

        <Text style={styles.label} nativeID="server-url-label">
          {strings.label}
        </Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={(text) => {
              setUrl(text)
              setError(undefined)
            }}
            placeholder={strings.placeholder}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            editable={!busy}
            onSubmitEditing={() => void connect()}
            accessibilityLabelledBy="server-url-label"
          />
          <Pressable
            onPress={() => void paste()}
            style={({ pressed }) => [styles.paste, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.pasteText}>{strings.paste}</Text>
          </Pressable>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void connect()}
          disabled={busy}
          style={({ pressed }) => [styles.button, (pressed || busy) && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
        >
          {busy && <ActivityIndicator color={colors.onPrimary} style={styles.spinner} />}
          <Text style={styles.buttonText}>{busy ? strings.connecting : strings.connect}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  brand: { color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 2.4 },
  title: { color: colors.text, fontSize: 24, fontWeight: "700", marginTop: 12 },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  label: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 28 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  paste: { height: 52, paddingHorizontal: 12, justifyContent: "center", borderRadius: 12 },
  pasteText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  error: { color: colors.error, fontSize: 13, lineHeight: 18, marginTop: 10 },
  button: {
    height: 52,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  spinner: { marginRight: 8 },
  pressed: { opacity: 0.7 },
})
