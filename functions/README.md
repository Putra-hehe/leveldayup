# Levelday Firebase Functions

Fungsi ini memindahkan jalur sensitif ke backend Firebase:
- `aiChatProxy`: proxy aman untuk Groq
- `syncLeaderboardPublic`: sinkronisasi snapshot leaderboard publik dari `appState/{uid}` ke `leaderboard_public/{uid}`

## Secrets / params yang perlu diisi

- `GROQ_API_KEY`
- `GROQ_MODEL` (opsional, default `llama-3.3-70b-versatile`)
- `GROQ_SERVICE_TIER` (opsional, default `on_demand`)

Contoh set secret:

```bash
firebase functions:secrets:set GROQ_API_KEY
```

Deploy:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```
