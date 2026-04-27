# Levelday stability + quest UX patch

Basis patch ini sengaja diambil dari codebase awal yang lebih stabil, lalu ditambahkan perbaikan yang lebih aman daripada refactor total sebelumnya.

## Yang diperbaiki

- Menambahkan `.npmrc` agar install memakai registry npm publik.
- Menambahkan auto-restore session dengan `onAuthStateChanged` supaya login Firebase lebih konsisten saat reload.
- Menahan sinkronisasi Firebase sampai remote state selesai dimuat agar local cache tidak mudah menimpa data cloud terlalu cepat.
- Menutup celah farm XP pada habit dengan `xpAwardedDates`, jadi uncheck-recheck di hari yang sama tidak terus memberi XP.
- Mendesain ulang dialog pembuatan quest agar lebih cepat dipakai:
  - role picker yang lebih jelas
  - template cepat
  - due date presets
  - preset subtasks 1/3/5 langkah
  - quick tags
  - preview card
  - sticky action bar

## Catatan

Patch ini memprioritaskan stabilitas fitur yang sudah ada. Jadi belum memasukkan refactor backend agresif seperti pemecahan seluruh `appState` ke subcollections, karena itu yang sebelumnya justru membuat banyak flow lama patah.
