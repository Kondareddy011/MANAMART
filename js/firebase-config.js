/**
 * Mana Community Survey - Firebase Service Layer
 * Supports Google Cloud Firestore real-time sync with automatic localStorage fallback.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJWHnppgTbMjtSP1XUmF3CYA8J_RmK9Is",
  authDomain: "mana-community-7698b.firebaseapp.com",
  projectId: "mana-community-7698b",
  storageBucket: "mana-community-7698b.firebasestorage.app",
  messagingSenderId: "680578909411",
  appId: "1:680578909411:web:181c274b47b474cbd5f1d6",
  measurementId: "G-WFNS8G90Z2"
};

const STORAGE_KEYS = {
  RESIDENTS: 'mana_community_survey_responses_v1',
  WHOLESALERS: 'mana_community_wholesaler_responses_v1'
};

const FirebaseService = (function() {
  let db = null;
  let isConnected = false;

  function init() {
    try {
      if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.firestore();
        if (firebase.analytics) {
          try { firebase.analytics(); } catch (e) {}
        }
        isConnected = true;
        console.log('🔥 Cloud Firestore initialized successfully.');
      } else {
        console.info('ℹ️ Firebase SDK not loaded, operating in Local Storage offline mode.');
      }
    } catch (err) {
      console.warn('Firebase initialization warning:', err.message);
      isConnected = false;
    }
  }

  // Get local responses
  function getLocal(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // Save local responses
  function saveLocal(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Add resident response
  async function submitResidentSurvey(data) {
    const item = {
      id: 'local-' + Date.now(),
      createdAtIso: new Date().toISOString(),
      ...data
    };

    // 1. Save to Local Storage immediately
    const localList = getLocal(STORAGE_KEYS.RESIDENTS);
    localList.unshift(item);
    saveLocal(STORAGE_KEYS.RESIDENTS, localList);

    // 2. Sync to Turso libSQL Cloud Database
    if (typeof window !== 'undefined' && window.TursoService) {
      try {
        await window.TursoService.submitResidentSurvey(data);
      } catch (err) {
        console.warn('Turso resident sync note:', err.message);
      }
    }

    // 3. Sync to Cloud Firestore if connected
    if (isConnected && db) {
      try {
        const docRef = await db.collection('survey_responses').add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          source: 'Web App'
        });
        item.firestoreId = docRef.id;
      } catch (err) {
        console.warn('Firestore sync failed, local copy preserved:', err.message);
      }
    }

    return item;
  }

  // Add wholesaler response
  async function submitWholesalerQuotation(data) {
    const item = {
      id: 'ws-' + Date.now(),
      createdAtIso: new Date().toISOString(),
      ...data
    };

    const localList = getLocal(STORAGE_KEYS.WHOLESALERS);
    localList.unshift(item);
    saveLocal(STORAGE_KEYS.WHOLESALERS, localList);

    // 2. Sync to Turso libSQL Cloud Database
    if (typeof window !== 'undefined' && window.TursoService) {
      try {
        await window.TursoService.submitWholesalerQuotation(data);
      } catch (err) {
        console.warn('Turso wholesaler sync note:', err.message);
      }
    }

    // 3. Sync to Cloud Firestore if connected
    if (isConnected && db) {
      try {
        const docRef = await db.collection('wholesaler_responses').add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          source: 'Wholesaler Portal'
        });
        item.firestoreId = docRef.id;
      } catch (err) {
        console.warn('Firestore wholesaler sync failed:', err.message);
      }
    }

    return item;
  }

  // Delete resident response (local, Turso, and Firestore)
  async function deleteResident(id) {
    const list = getLocal(STORAGE_KEYS.RESIDENTS);
    const item = list.find(r => r.id === id);
    const updated = list.filter(r => r.id !== id);
    saveLocal(STORAGE_KEYS.RESIDENTS, updated);

    if (typeof window !== 'undefined' && window.TursoService) {
      try {
        await window.TursoService.deleteResident(id);
      } catch (e) {}
    }

    if (isConnected && db) {
      try {
        const targetId = item?.firestoreId || id;
        if (targetId && !targetId.startsWith('local-') && !targetId.startsWith('demo-')) {
          await db.collection('survey_responses').doc(targetId).delete();
        }
      } catch (err) {
        console.warn('Firestore resident delete warning:', err.message);
      }
    }
    return updated;
  }

  // Delete wholesaler response (local, Turso, and Firestore)
  async function deleteWholesaler(id) {
    const list = getLocal(STORAGE_KEYS.WHOLESALERS);
    const item = list.find(w => w.id === id);
    const updated = list.filter(w => w.id !== id);
    saveLocal(STORAGE_KEYS.WHOLESALERS, updated);

    if (typeof window !== 'undefined' && window.TursoService) {
      try {
        await window.TursoService.deleteWholesaler(id);
      } catch (e) {}
    }

    if (isConnected && db) {
      try {
        const targetId = item?.firestoreId || id;
        if (targetId && !targetId.startsWith('ws-') && !targetId.startsWith('demo-ws-')) {
          await db.collection('wholesaler_responses').doc(targetId).delete();
        }
      } catch (err) {
        console.warn('Firestore wholesaler delete warning:', err.message);
      }
    }
    return updated;
  }

  // Real-time listener for residents with safe merge
  function subscribeResidents(onData) {
    // Deliver initial local data
    onData(getLocal(STORAGE_KEYS.RESIDENTS));

    if (isConnected && db) {
      return db.collection('survey_responses')
        .onSnapshot((snapshot) => {
          const fsList = [];
          snapshot.forEach(doc => {
            fsList.push({ id: doc.id, ...doc.data() });
          });

          // Merge Firestore items with pending local-only items (like demo records)
          const currentLocal = getLocal(STORAGE_KEYS.RESIDENTS);
          const localOnly = currentLocal.filter(loc => 
            !fsList.some(fs => fs.id === loc.id || (loc.firestoreId && fs.id === loc.firestoreId))
          );

          const combined = [...fsList, ...localOnly];
          combined.sort((a, b) => {
            const timeA = a.createdAt?.seconds || (a.createdAtIso ? new Date(a.createdAtIso).getTime() / 1000 : 0);
            const timeB = b.createdAt?.seconds || (b.createdAtIso ? new Date(b.createdAtIso).getTime() / 1000 : 0);
            return timeB - timeA;
          });

          saveLocal(STORAGE_KEYS.RESIDENTS, combined);
          onData(combined);
        }, (err) => {
          console.warn('Firestore snapshot error:', err.message);
        });
    }
    return () => {};
  }

  // Real-time listener for wholesalers with safe merge
  function subscribeWholesalers(onData) {
    onData(getLocal(STORAGE_KEYS.WHOLESALERS));

    if (isConnected && db) {
      return db.collection('wholesaler_responses')
        .onSnapshot((snapshot) => {
          const fsList = [];
          snapshot.forEach(doc => {
            fsList.push({ id: doc.id, ...doc.data() });
          });

          const currentLocal = getLocal(STORAGE_KEYS.WHOLESALERS);
          const localOnly = currentLocal.filter(loc => 
            !fsList.some(fs => fs.id === loc.id || (loc.firestoreId && fs.id === loc.firestoreId))
          );

          const combined = [...fsList, ...localOnly];
          combined.sort((a, b) => {
            const timeA = a.createdAt?.seconds || (a.createdAtIso ? new Date(a.createdAtIso).getTime() / 1000 : 0);
            const timeB = b.createdAt?.seconds || (b.createdAtIso ? new Date(b.createdAtIso).getTime() / 1000 : 0);
            return timeB - timeA;
          });

          saveLocal(STORAGE_KEYS.WHOLESALERS, combined);
          onData(combined);
        }, (err) => {
          console.warn('Firestore wholesaler snapshot error:', err.message);
        });
    }
    return () => {};
  }

  return {
    init,
    isAvailable: () => isConnected,
    STORAGE_KEYS,
    getLocalResidents: () => getLocal(STORAGE_KEYS.RESIDENTS),
    getLocalWholesalers: () => getLocal(STORAGE_KEYS.WHOLESALERS),
    saveLocalResidents: (items) => saveLocal(STORAGE_KEYS.RESIDENTS, items),
    saveLocalWholesalers: (items) => saveLocal(STORAGE_KEYS.WHOLESALERS, items),
    submitResidentSurvey,
    submitWholesalerQuotation,
    deleteResident,
    deleteWholesaler,
    subscribeResidents,
    subscribeWholesalers
  };
})();

// Auto initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    FirebaseService.init();
  });
}
