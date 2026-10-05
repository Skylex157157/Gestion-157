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

const CONFIG: ConfigFirebase | null = {
  apiKey: 'AIzaSyBFsRiaJX6zycd-hZS2Mz-6E286fg-8Wxs',
  authDomain: 'juntada-157.firebaseapp.com',
  projectId: 'juntada-157',
  storageBucket: 'juntada-157.firebasestorage.app',
  messagingSenderId: '343611111931',
  appId: '1:343611111931:web:5680fb72b93bd95501f35e',
};

/** Para probar contra el emulador local de Firestore (npm run emulador). */
export const USAR_EMULADOR = import.meta.env.VITE_FIREBASE_EMULADOR === '1';

export const configFirebase: ConfigFirebase | null = USAR_EMULADOR
  ? { apiKey: 'demo', projectId: 'demo-juntada', appId: 'demo' }
  : CONFIG;

/** Se puede compartir: hay un proyecto de Firebase configurado y no estamos dentro de claude.ai. */
export const NUBE_DISPONIBLE = import.meta.env.MODE !== 'artifact' && configFirebase !== null;
