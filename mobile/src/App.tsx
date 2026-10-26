import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

import { ChatScreen } from "./ChatScreen"
import { strings } from "./i18n"
import { ServerScreen } from "./ServerScreen"
import { colors } from "./theme"

type Screen = { name: "server"; error?: string } | { name: "chat"; origin: string }

/** Two screens: the server address (every launch), then the chat. */
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "server" })

  const leaveChat = useCallback((lost: boolean) => {
    setScreen({ name: "server", error: lost ? strings.errorLost : undefined })
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        {screen.name === "server" ? (
          <ServerScreen
            initialError={screen.error}
            onConnected={(origin) => setScreen({ name: "chat", origin })}
          />
        ) : (
          <ChatScreen origin={screen.origin} onLeave={leaveChat} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
})
