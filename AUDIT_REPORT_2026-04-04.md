# Audit report 2026-04-04

## Ringkasan
Project sudah diaudit dan dipatch pada area yang paling berisiko untuk error runtime dan inkonsistensi state. Fokus patch utama ada pada reset harian, streak, reward points, streak freeze, sinkronisasi leaderboard, dan pembersihan state onboarding.

## Perbaikan inti
1. Memperbaiki perhitungan streak harian agar streak tidak tetap hidup saat jeda sudah lebih dari 1 hari.
2. Menambahkan maintenance harian yang aktif saat app kembali fokus, tab dibuka lagi, dan interval berjalan, supaya daily quest dan daily dungeon tidak macet kalau app dibiarkan terbuka melewati tengah malam.
3. Menambahkan sistem `momentum` baru:
   - reward points dari quest
   - bonus poin saat mencapai combo quest harian
   - pembelian streak freeze dengan poin
   - auto consume streak freeze saat 1 atau beberapa hari terlewat
   - reset streak bila freeze tidak cukup
4. Menambahkan UI momentum wallet dan status freeze di halaman Rewards, Dashboard, dan Sidebar.
5. Menyinkronkan streak leaderboard agar memakai streak terbaik dari habit atau momentum.
6. Memperbaiki alur quest completion supaya toast reward points tidak bisa tampil dengan nilai salah akibat side effect dari updater state.
7. Memperkeras normalisasi state momentum agar tahan terhadap data lama atau data rusak.
8. Mereset state onboarding secara penuh agar data user lama tidak bocor ke user baru.
9. Memperbaiki filter type predicate di planner yang berpotensi memunculkan error type-check.

## Validasi yang sempat dijalankan
- Parse check untuk file yang dipatch: lolos.
- Uji logika momentum dan streak freeze: lolos.
- Audit konsistensi import dan props pada file yang dipatch: lolos secara statis.

## Catatan lingkungan
Build penuh dengan `npm install` dan `npm run check` tidak bisa diselesaikan di container ini karena akses jaringan ke registry npm tidak tersedia. Jadi validasi akhir dilakukan dengan audit statis, parse check, dan uji logika lokal pada modul yang dipatch.

## File utama yang berubah
- `src/app/utils/momentum.ts`
- `src/app/types/index.ts`
- `src/app/utils/storage.ts`
- `src/app/hooks/useLeveldayState.ts`
- `src/app/utils/rewards.ts`
- `src/app/pages/RewardsPage.tsx`
- `src/app/components/AppSidebar.tsx`
- `src/app/pages/Dashboard.tsx`
- `src/app/App.tsx`
- `src/app/utils/social.ts`
- `functions/src/index.ts`
- `src/app/utils/planner.ts`
