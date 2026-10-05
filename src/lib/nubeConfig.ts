// Datos del proyecto de Firebase donde se guardan los encuentros compartidos.
// Son públicos (van dentro de la app): lo que protege los datos son las reglas
// de firestore.rules, que solo dejan entrar a quien conoce el código del encuentro.
// Se copian desde la consola de Firebase: Configuración del proyecto → Tus apps → Configuración.

export interface ConfigFirebase {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const CONFIG: ConfigFirebase | null = null;

/** Para probar contra el emulador local de Firestore (npm run emulador). */
export const USAR_EMULADOR = import.meta.env.VITE_FIREBASE_EMULADOR === '1';

export const configFirebase: ConfigFirebase | null = USAR_EMULADOR
  ? { apiKey: 'demo', projectId: 'demo-juntada', appId: 'demo' }
  : CONFIG;

/** Se puede compartir: hay un proyecto de Firebase configurado y no estamos dentro de claude.ai. */
export const NUBE_DISPONIBLE = import.meta.env.MODE !== 'artifact' && configFirebase !== null;
