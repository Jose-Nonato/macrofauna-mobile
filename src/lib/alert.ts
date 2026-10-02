import { Alert, Platform } from "react-native";

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

/**
 * react-native-web implementa Alert.alert como um no-op total (não mostra
 * nada e nunca chama onPress dos botões) — na web usamos window.alert /
 * window.confirm, que são síncronos/bloqueantes, então o código após a
 * chamada só roda depois que o usuário fecha o diálogo.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  if (buttons.length === 2) {
    const cancelButton = buttons.find((b) => b.style === "cancel");
    const confirmButton = buttons.find((b) => b !== cancelButton) || buttons[buttons.length - 1];

    if (window.confirm(text)) {
      confirmButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
    return;
  }

  // 3+ botões: window.confirm só tem 2 opções, então listamos as escolhas
  // num prompt numerado em vez de perder as opções extras silenciosamente.
  const optionsList = buttons
    .map((b, i) => `${i + 1}. ${b.text || "OK"}`)
    .join("\n");
  const choice = window.prompt(`${text}\n\n${optionsList}\n\nDigite o número da opção:`);
  const index = choice ? parseInt(choice, 10) - 1 : -1;
  const chosen = buttons[index];
  chosen?.onPress?.();
}
