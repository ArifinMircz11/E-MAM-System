/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'info',
      comment: 'Siklus dependensi terdeteksi. Silakan refaktor untuk menghindari circular dependency.',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'ui-no-repositories-services-firestore',
      severity: 'info',
      comment: 'Layer UI (components) dilarang keras mengimpor langsung dari repositories, services (kecuali jika diizinkan via custom hook/store), dan firebase.',
      from: {
        path: '(^src/components/|^src/features/[^/]+/components/)'
      },
      to: {
        path: '(repositories/|firebase/firestore|@firebase/firestore|dexie)'
      }
    },
    {
      name: 'ui-no-dexie',
      severity: 'info',
      comment: 'Komponen dilarang langsung mengakses dexie.',
      from: {
        path: '(^src/components/|^src/features/.*\\.tsx$)'
      },
      to: {
        path: '(dexie|db/dexie)'
      }
    },
    {
      name: 'hooks-no-firestore-dexie',
      severity: 'info',
      comment: 'Layer Hook dilarang mengimpor langsung dari @firebase/firestore dan db/dexie (Gunakan Store/Service).',
      from: {
        path: '(^src/hooks/|^src/features/[^/]+/hooks/)'
      },
      to: {
        path: '(firebase/firestore|@firebase/firestore)'
      }
    },
    {
      name: 'repositories-no-firestore',
      severity: 'info',
      comment: 'Layer Repository dilarang mengimpor dari @firebase/firestore (Firebase SDK hanya boleh di Service/Sync layer).',
      from: {
        path: '(^src/features/[^/]+/repositories/|^src/database/repositories/|^src/repositories/)'
      },
      to: {
        path: '(firebase/firestore|@firebase/firestore|firebase/auth)'
      }
    },
    {
      name: 'stores-no-firestore',
      severity: 'info',
      comment: 'Store tidak boleh mengakses firestore secara langsung. Sync ditangani SyncEngine.',
      from: {
        path: '^src/stores/'
      },
      to: {
        path: '(firebase/firestore|@firebase/firestore)'
      }
    },
    {
      name: 'services-no-ui',
      severity: 'info',
      comment: 'Service layer tidak boleh mengimpor UI layer.',
      from: {
        path: '^src/services/'
      },
      to: {
        path: '(^src/components/|\\.tsx$)'
      }
    }
  ],
  options: {
    exitCode: 0,
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    reporterOptions: {
      text: {
        highlightFocused: true
      }
    }
  }
};
