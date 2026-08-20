import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(

  // =====================================================
  // GLOBAL IGNORE
  // =====================================================

  {
    ignores: [
      'dist',
      'dev-dist',
      'node_modules',
      '*.config.js',
      '*.cjs',
      '*.d.ts'
    ]
  },


  // =====================================================
  // BASE TYPESCRIPT CONFIG
  // =====================================================

  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended
    ],

    files: [
      'src/**/*.{ts,tsx}'
    ],

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },

    plugins: {
      'react-hooks': reactHooks,
    },


    rules: {

      ...reactHooks.configs.recommended.rules,


      // ================================================
      // QUALITY RULES
      // ================================================

      'no-empty': [
        'warn',
        {
          allowEmptyCatch: true
        }
      ],

      'no-case-declarations': 'warn',

      'no-control-regex': 'off',

      'no-useless-escape': 'off',

      'prefer-const': 'warn',


      '@typescript-eslint/no-empty-object-type':
      'off',


      '@typescript-eslint/ban-ts-comment':
      'off',


      '@typescript-eslint/no-explicit-any':
      'warn',


      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_'
        }
      ],


      // ================================================
      // DEFAULT FIREBASE PROTECTION
      // ================================================

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'firebase/firestore',
                'firebase/auth',
                '@firebase/*'
              ],

              message:
              'Firebase SDK hanya boleh digunakan pada Infrastructure Sync Layer.'
            }
          ]
        }
      ]

    }

  },


  // =====================================================
  // FIREBASE & SYNC INFRASTRUCTURE ALLOW
  // =====================================================

  {
    files: [

      'src/infrastructure/firebase/**/*.ts',

      'src/infrastructure/sync/**/*.ts',

      'src/services/sync/**/*.ts',

      'src/services/SyncEngine.ts',

      'src/services/masterSyncService.ts',

      'src/core/realtime/**/*.ts',

      'src/utils/firestoreHelpers.ts'

    ],

    rules: {

      'no-restricted-imports':
      'off'

    }

  },


  // =====================================================
  // DOMAIN LAYER PROTECTION
  // Pure DDD Domain
  // =====================================================

  {
    files: [

      'src/domain/**/*.ts'

    ],

    rules: {

      'no-restricted-imports': [
        'error',
        {
          patterns: [

            {
              group: [

                'react',
                'react-dom',
                'firebase/*',
                '@firebase/*',
                '*dexie*',
                'zustand',
                '@/services/*',
                '@/application/*'

              ],

              message:
              'Domain layer harus framework independent.'
            }

          ]
        }
      ]

    }

  },


  // =====================================================
  // UI COMPONENT LAYER
  // =====================================================

  {
    files: [

      'src/components/**/*.tsx',

      'src/features/**/*.tsx',

      'src/pages/**/*.tsx',

      'src/app/**/*.tsx'

    ],


    ignores: [

      'src/components/DeveloperConsole/**/*.tsx',

      'src/components/DeveloperConsole.tsx',

      'src/components/OfflineSyncIndicator.tsx',

      'src/components/SyncBadge.tsx',

      'src/features/dashboard/components/HeaderSyncIndicator.tsx',

      'src/features/audit/components/AuditRBACDashboard.tsx'

    ],


    rules: {

      'no-restricted-imports': [

        'error',

        {

          patterns: [

            {

              group: [

                '*dexie*',
                '*Dexie*',
                '@/infrastructure/database/*'

              ],

              message:
              'UI tidak boleh mengakses Dexie langsung. Gunakan Store atau Hook.'
            },


            {

              group: [

                'firebase/*',
                '@firebase/*'

              ],

              message:
              'UI tidak boleh mengakses Firebase langsung.'
            },


            {

              group: [

                '@/repositories/*',
                '@/infrastructure/*'

              ],

              message:
              'Feature UI tidak boleh bypass Repository.'
            }

          ]

        }

      ]

    }

  },


  // =====================================================
  // STORE LAYER
  // Zustand State Layer
  // =====================================================

  {
    files: [

      'src/stores/**/*.ts'

    ],

    rules: {

      'no-restricted-imports': [

        'error',

        {

          patterns: [

            {

              group: [

                'firebase/firestore',
                'firebase/auth',
                '@firebase/*'

              ],

              message:
              'Store tidak boleh akses Firebase. Gunakan Sync Engine.'
            }

          ]

        }

      ]

    }

  },


  // =====================================================
  // SERVICE LAYER
  // Business Logic Only
  // =====================================================

  {
    files: [

      'src/services/**/*.ts'

    ],

    ignores: [

      'src/services/hooks/**/*.ts'

    ],


    rules: {

      'no-restricted-imports': [

        'error',

        {

          patterns: [

            {

              group: [

                'react',
                'react-dom',
                '@/components/*',
                '../components/*',
                '../../components/*'

              ],

              message:
              'Service tidak boleh bergantung pada UI.'
            },


            {

              group: [

                '*dexie*',
                '*Dexie*',
                '@/infrastructure/database/*'

              ],

              message:
              'Service tidak boleh akses database langsung. Gunakan Repository.'
            }

          ]

        }

      ]

    }

  },


  // =====================================================
  // REPOSITORY LAYER
  // =====================================================

  {
    files: [

      'src/repositories/**/*.ts',

      'src/domain/**/repositories/**/*.ts',

      'src/infrastructure/repositories/**/*.ts'

    ],


    rules: {

      'no-restricted-imports': [

        'error',

        {

          patterns: [

            {

              group: [

                'react',
                'react-dom'

              ],

              message:
              'Repository tidak boleh bergantung pada UI.'
            }

          ]

        }

      ]

    }

  },


  // =====================================================
  // NAVIGATION REGISTRY
  // DATA ONLY
  // =====================================================

  {
    files: [

      'src/navigation/registries/**/*.ts'

    ],

    rules: {

      'no-restricted-imports': [

        'error',

        {

          patterns: [

            {

              group: [

                '@/services/*',
                '../services/*',
                '../../services/*'

              ],

              message:
              'Navigation Registry hanya boleh berisi metadata.'
            }

          ]

        }

      ],


      'no-restricted-syntax': [

        'error',

        {

          selector:
          'FunctionDeclaration',

          message:
          'Navigation Registry tidak boleh memiliki function logic.'

        }

      ]

    }

  },


  // =====================================================
  // NAVIGATION SERVICE
  // =====================================================

  {
    files: [

      'src/navigation/services/**/*.ts'

    ],

    rules: {

      'no-restricted-imports': [

        'error',

        {

          patterns: [

            {

              group: [

                'react',
                'react-dom'

              ],

              message:
              'NavigationService tidak boleh bergantung pada UI.'
            }

          ]

        }

      ]

    }

  },


  // =====================================================
  // APP KERNEL PROTECTION
  // =====================================================

  {
    files: [

      'src/App.tsx',

      'src/app/**/*.ts'

    ],

    rules: {

      'no-restricted-imports': [

        'error',

        {

          patterns: [

            {

              group: [

                'firebase/*',
                '@firebase/*',
                '*dexie*'

              ],

              message:
              'Application Kernel tidak boleh mengakses Infrastructure langsung.'
            }

          ]

        }

      ]

    }

  },


  // =====================================================
  // SYNC ENGINE FULL ACCESS
  // =====================================================

  {
    files: [

      'src/infrastructure/sync/**/*.ts',

      'src/services/sync/**/*.ts'

    ],

    rules: {

      'no-restricted-imports':
      'off'

    }

  }

);