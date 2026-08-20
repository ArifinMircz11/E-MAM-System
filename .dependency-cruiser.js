/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Siklus dependensi terdeteksi. Silakan refaktor untuk menghindari circular dependency.',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'ui-no-repositories-services-firestore',
      severity: 'error',
      comment: 'Layer UI (components) dilarang keras mengimpor langsung dari repositories, services, dan @firebase/firestore.',
      from: {
        path: '(^src/components/|^src/features/[^/]+/components/)'
      },
      to: {
        path: '(repositories/|services/|firebase/firestore|@firebase/firestore)'
      }
    },
    {
      name: 'hooks-no-firestore-dexie',
      severity: 'error',
      comment: 'Layer Hook dilarang mengimpor langsung dari @firebase/firestore dan db/dexie.',
      from: {
        path: '(^src/hooks/|^src/features/[^/]+/hooks/)'
      },
      to: {
        path: '(firebase/firestore|@firebase/firestore|database/dexie)'
      }
    },
    {
      name: 'repositories-no-firestore',
      severity: 'error',
      comment: 'Layer Repository dilarang mengimpor dari @firebase/firestore (Firebase SDK hanya boleh di Service/Sync layer).',
      from: {
        path: '(^src/features/[^/]+/repositories/|^src/database/repositories/|^src/features/users/repositories/)'
      },
      to: {
        path: '(firebase/firestore|@firebase/firestore|firebase/auth)'
      }
    }
  ],
  options: {
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
