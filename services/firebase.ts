import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCpZ1iVrU_JwK10gEvi9FGderKYaffgMGg",
  authDomain: "data-library-5cf6c.firebaseapp.com",
  projectId: "data-library-5cf6c",
  storageBucket: "data-library-5cf6c.firebasestorage.app",
  messagingSenderId: "976961164680",
  appId: "1:976961164680:web:4aa7027e61f13425bc163d"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore 초기화
export const db = getFirestore(app);

// Authentication 초기화
export const auth = getAuth(app);

// 개발 환경에서만 Firestore 로컬 에뮬레이터 연결 (선택사항)
// if (process.env.NODE_ENV === 'development' && !location.hostname.includes('localhost')) {
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

// 오프라인 지원 활성화 (IndexedDB 사용)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('IndexedDB 지원 실패: 여러 탭에서 실행 중일 수 있습니다.');
  } else if (err.code === 'unimplemented') {
    console.warn('IndexedDB 브라우저 미지원');
  }
});

export default app;
