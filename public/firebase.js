/* ---------- Firebase: инициализация, авторизация, Firestore ---------- */
/* Работает и без реального конфига: если значения плейсхолдеры — FB_AVAILABLE=false, всё остальное без операций */

let FB_PLACEHOLDER_RE = /YOUR_|^XXX+$/i;
let FB_CONFIG_REAL = FIREBASE_CONFIG && !FB_PLACEHOLDER_RE.test(FIREBASE_CONFIG.apiKey || '') && !FB_PLACEHOLDER_RE.test(FIREBASE_CONFIG.projectId || '');

var FB_AVAILABLE = false;
var FB_auth = null;
var FB_db = null;
var FB_authListeners = [];

var FB = {
  get user() { return FB_auth ? FB_auth.currentUser : null; },
  get AVAILABLE() { return FB_AVAILABLE; },
  onAuthChange(cb) {
    FB_authListeners.push(cb);
    // Если пользователь уже есть — вызвать callback сразу
    if (FB_auth && FB_auth.currentUser) {
      queueMicrotask(() => cb(FB_auth.currentUser));
    }
  },
  async loginEmail(email, password) {
    if (!FB_AVAILABLE) throw new Error('Firebase не настроен');
    try {
      await FB_auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      const code = e.code;
      // Если пользователь не найден — пробуем зарегистрировать
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        try {
          await FB_auth.createUserWithEmailAndPassword(email, password);
          return;
        } catch (e2) {
          const code2 = e2.code;
          if (code2 === 'auth/email-already-in-use') throw new Error('Email уже занят');
          if (code2 === 'auth/weak-password') throw new Error('Пароль слишком простой (мин. 6 символов)');
          throw new Error(e2.message || 'Ошибка регистрации');
        }
      }
      // Другие ошибки входа
      if (code === 'auth/wrong-password') throw new Error('Неверный пароль');
      if (code === 'auth/invalid-email') throw new Error('Неверный формат email');
      if (code === 'auth/too-many-requests') throw new Error('Слишком много попыток, попробуй позже');
      throw new Error(e.message || 'Ошибка входа');
    }
  },
  async loginGoogle() {
    if (!FB_AVAILABLE) throw new Error('Firebase не настроен');
    const provider = new firebase.auth.GoogleAuthProvider();
    await FB_auth.signInWithPopup(provider);
  },
  async logout() {
    if (!FB_AVAILABLE) return;
    await FB_auth.signOut();
  },
  async loadAll(uid) {
    if (!FB_AVAILABLE) return { workouts: [], customExercises: [] };
    try {
      const [wSnap, cSnap] = await Promise.all([
        FB_db.collection('users').doc(uid).collection('workouts').get(),
        FB_db.collection('users').doc(uid).collection('customExercises').get()
      ]);
      const workouts = wSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
      const customExercises = cSnap.docs.map((d) => ({ ...d.data(), name: d.id }));
      return { workouts, customExercises };
    } catch { return { workouts: [], customExercises: [] }; }
  },
  async saveAll(uid, { workouts, customExercises }) {
    if (!FB_AVAILABLE) return;
    const wCol = FB_db.collection('users').doc(uid).collection('workouts');
    const cCol = FB_db.collection('users').doc(uid).collection('customExercises');
    const wOld = await wCol.get();
    const cOld = await cCol.get();
    const batch = FB_db.batch();
    wOld.docs.forEach((d) => batch.delete(d.ref));
    cOld.docs.forEach((d) => batch.delete(d.ref));
    workouts.forEach((w) => {
      const { id, ...rest } = w;
      batch.set(wCol.doc(id || idGen()), rest);
    });
    customExercises.forEach((ex) => {
      batch.set(cCol.doc(ex.name || ''), { ...ex, name: undefined });
    });
    await batch.commit();
  },
};

/* инициализация после загрузки SDK */
function initFirebase() {
  if (!FB_CONFIG_REAL) {
    FB_AVAILABLE = false;
    console.info('[FB] конфиг-плейсхолдер — Firebase отключён, работаем только локально');
    return;
  }
  try {
    const app = firebase.initializeApp(FIREBASE_CONFIG);
    FB_auth = app.auth();
    FB_db = app.firestore();
    FB_db.settings({ timestampsInSnapshots: true });
    FB_db.enablePersistence({ synchronizeTabs: true }).catch(() => {/* оффлайн-кэш недоступен — не критично */});
    // Сохраняем сессию между перезагрузками
    FB_auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      console.info('[FB] persistence set to LOCAL');
    }).catch((e) => {
      console.warn('[FB] persistence error:', e.message);
    });
    FB_auth.onAuthStateChanged((u) => FB_authListeners.forEach((cb) => cb(u)));
    FB_AVAILABLE = true;
    console.info('[FB] подключён');
  } catch (e) {
    console.error('[FB] ошибка инициализации:', e);
    FB_AVAILABLE = false;
  }
}

/* генератор id, когда у документа ещё нет своего */
function idGen() {
  return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

initFirebase();