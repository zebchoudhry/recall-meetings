export const en = {
  // Header
  "header.settings": "Settings",
  "header.privacyTitle": "Privacy & Storage Settings",
  "header.goDashboard": "Go to dashboard",

  // Recording controls
  "record.heading": "Recording Controls",
  "record.start": "Start Transcription",
  "record.stop": "Stop Transcription",
  "record.status": "Status:",
  "record.listening": "Listening",
  "record.idle": "Idle",
  "record.entries": "Entries:",
  "record.clear": "Clear Transcript",

  // Language selector
  "lang.label": "Languages",
  "lang.iSpeak": "I speak",
  "lang.showIn": "Show in",
  "lang.showOriginal": "Show original",

  // Transcript display
  "transcript.title": "Live Transcript",
  "transcript.recording": "Recording",
  "transcript.listeningHint": "Listening for speech...",
  "transcript.startHint": "Click the record button to start transcribing",
  "transcript.confidence": "{n}% confidence",

  // Sidebar cards
  "catchup.title": "Catch Me Up",
  "catchup.subtitle": "Get instant summary of what you missed",
  "catchup.button": "Catch Me Up Now",
  "catchup.summaryHeading": "Summary",

  "brainstorm.title": "Voice Brainstorm",
  "brainstorm.subtitle": "Capture ideas hands-free, get AI summary via email",
  "brainstorm.button": "Start Brainstorm Session",

  "privacy.cardTitle": "Privacy Protected",
  "privacy.cardBody": "No data stored externally. Your conversations stay private on your device.",

  // Tabs
  "tabs.record": "Record",
  "tabs.settings": "Settings",
  "tabs.actions": "Actions",

  // Action buttons
  "actions.aiSummary": "AI Summary",
  "actions.generating": "Generating...",
  "actions.exportTranscript": "Export transcript",
  "actions.meetingSummary": "Meeting Summary",
  "actions.aiSummaryHeading": "AI Summary",

  // Ask about meeting
  "ask.title": "Ask About Meeting",
  "ask.subtitle": "Get answers without interrupting",
  "ask.placeholder": 'Try: "Who mentioned the budget?" or "What did I miss?"',

  // Feedback
  "feedback.button": "Feedback",
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;

export const es: Translations = {
  "header.settings": "Ajustes",
  "header.privacyTitle": "Privacidad y almacenamiento",
  "header.goDashboard": "Ir al panel",

  "record.heading": "Controles de grabación",
  "record.start": "Iniciar transcripción",
  "record.stop": "Detener transcripción",
  "record.status": "Estado:",
  "record.listening": "Escuchando",
  "record.idle": "Inactivo",
  "record.entries": "Entradas:",
  "record.clear": "Borrar transcripción",

  "lang.label": "Idiomas",
  "lang.iSpeak": "Yo hablo",
  "lang.showIn": "Mostrar en",
  "lang.showOriginal": "Mostrar original",

  "transcript.title": "Transcripción en vivo",
  "transcript.recording": "Grabando",
  "transcript.listeningHint": "Escuchando voz...",
  "transcript.startHint": "Pulsa el botón de grabar para empezar a transcribir",
  "transcript.confidence": "{n}% de confianza",

  "catchup.title": "Ponme al día",
  "catchup.subtitle": "Obtén un resumen instantáneo de lo que te perdiste",
  "catchup.button": "Ponme al día ahora",
  "catchup.summaryHeading": "Resumen",

  "brainstorm.title": "Lluvia de ideas por voz",
  "brainstorm.subtitle": "Captura ideas con manos libres y recibe el resumen por correo",
  "brainstorm.button": "Iniciar sesión de ideas",

  "privacy.cardTitle": "Privacidad protegida",
  "privacy.cardBody": "No se almacenan datos externamente. Tus conversaciones permanecen privadas en tu dispositivo.",

  "tabs.record": "Grabar",
  "tabs.settings": "Ajustes",
  "tabs.actions": "Acciones",

  "actions.aiSummary": "Resumen IA",
  "actions.generating": "Generando...",
  "actions.exportTranscript": "Exportar transcripción",
  "actions.meetingSummary": "Resumen de la reunión",
  "actions.aiSummaryHeading": "Resumen IA",

  "ask.title": "Pregunta sobre la reunión",
  "ask.subtitle": "Obtén respuestas sin interrumpir",
  "ask.placeholder": 'Prueba: "¿Quién mencionó el presupuesto?" o "¿Qué me perdí?"',

  "feedback.button": "Comentarios",
};

export const dictionaries: Record<string, Translations> = { en, es };