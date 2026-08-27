/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Siklus dependensi terdeteksi. Silakan refaktor untuk menghindari circular dependency.',
      from: {},
      to: { circular: true }
    },
    {
      name: 'ui-no-repositories-services-firestore',
      severity: 'error',
      comment: 'Layer UI (components) dilarang mengimpor langsung dari repositories, services, dan @firebase/firestore.',
      from: { path: '(^src/components/|^src/features/[^/]+/components/)' },
      to: { path: '(repositories/|services/|firebase/firestore|@firebase/firestore|database/dexie)' }
    },
    {
      name: 'hooks-no-firestore-dexie',
      severity: 'error',
      comment: 'Layer Hook dilarang mengimpor langsung dari @firebase/firestore dan database/dexie.',
      from: { path: '(^src/hooks/|^src/features/[^/]+/hooks/)' },
      to: { path: '(firebase/firestore|@firebase/firestore|database/dexie)' }
    },
    {
      name: 'stores-no-dexie',
      severity: 'error',
      comment: 'Zustand/store layer tidak boleh mengakses Dexie secara langsung; gunakan Service/Use Case → Repository.',
      from: { path: '(^src/stores/|^src/features/[^/]+/stores/)' },
      to: { path: '(database/dexie|dexie)' }
    },
    {
      name: 'services-no-dexie',
      severity: 'error',
      comment: 'Service/Use Case tidak boleh mengakses Dexie langsung; persistence harus melalui Repository.',
      from: { path: '(^src/services/|^src/features/[^/]+/services/|^src/core/service/)' },
      to: { path: '(database/dexie)' }
    },
    {
      name: 'repositories-no-firestore',
      severity: 'error',
      comment: 'Layer Repository dilarang mengimpor dari @firebase/firestore (Firebase SDK hanya boleh di Service/Sync layer).',
      from: { path: '(^src/repositories/|^src/features/[^/]+/repositories/|^src/database/repositories/|^src/features/users/repositories/)' },
      to: { path: '(firebase/firestore|@firebase/firestore|firebase/auth)' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    reporterOptions: { text: { highlightFocused: true } }
  }
};
