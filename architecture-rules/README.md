# e-MAM Enterprise Architecture Rules

Folder ini ditujukan sebagai referensi aturan arsitektural yang ditegakkan melalui `eslint` dan `dependency-cruiser`.

## Contract e-MAM Enterprise

1. **Komponen UI dilarang mengakses Firebase dan Dexie.** 
   (Komponen React harus mengakses data melalui Zustand Store atau Hooks, yang membaca state di memori atau berkoordinasi via Service).
2. **Store dilarang mengakses Firestore langsung.**
   (Store bertugas mengelola local state dan trigger Service; sinkronisasi dengan cloud di-handle murni oleh SyncEngine).
3. **Service Layer murni logic.**
   (Service tidak boleh mengimpor UI React component; berfungsi sebagai API internal dan orchestrator).
4. **Local First (Dexie).**
   (Dexie digunakan sebagai sumber data utama offline. Repository berinteraksi langsung dengan Dexie, dan Service menggunakan Repository).
5. **Firebase Boundary.**
   (Akses ke SDK Firebase (`firebase/firestore`, `firebase/auth`) HANYA diizinkan di dalam `SyncService`, `SyncEngine`, atau lapisan infrastruktur Firebase (`src/infrastructure/firebase`)).

Penolakan otomatis telah diintegrasikan pada:
- `eslint.config.js` (dengan rules `no-restricted-imports`)
- `.dependency-cruiser.cjs`

Menjalankan `npm run lint` juga akan memvalidasi dependensi secara otomatis (opsional dapat menambahkan script: `"lint:deps": "depcruise src"`).
