# Levelday

Levelday is a gamified anti-procrastination app for students.

Instead of acting like a generic to-do list, Levelday turns academic pressure into a tighter RPG-style progression loop:

- choose one meaningful weekly target
- break it into quests
- complete focus sessions and daily support actions
- earn XP and level up
- chip away at a weekly boss without feeling overwhelmed

## Product focus

Levelday is intentionally narrow.

It is designed for:

- university students
- school students
- people who struggle with consistency
- users who respond well to levels, quests, streaks, and visible progress

Core systems in this build:

- quest system
- focus session timer
- daily dungeon
- weekly boss
- habits and routines
- XP, levels, and badges
- lightweight personalization through class and goal track

## Tech stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Radix UI components
- Firebase Authentication
- Cloud Firestore persistence

## Local setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials inside `.env.local`, then run the app:

```bash
npm run dev
```

To create a production build:

```bash
npm run build
```

Optional type check:

```bash
npm run check
```

## Environment variables

Levelday uses Firebase for authentication and persistence.

Required variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Optional:

```bash
VITE_FIREBASE_MEASUREMENT_ID=
```

## Firebase checklist

1. Create a Firebase project.
2. Enable **Authentication**.
3. Enable **Email/Password** sign-in.
4. Enable **Google** sign-in if you want one-click sign-in.
5. Create **Cloud Firestore**.
6. Add your local and deployment domains to **Authorized domains**.

Suggested Firestore rules for this app:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appState/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Project structure

```txt
src/
  app/
    components/   reusable product UI
    hooks/        app state orchestration
    pages/        main screens
    types/        shared domain types
    utils/        product logic, storage, dates, XP, mock data
```

## Notes

- Levelday keeps backward compatibility with Solo-branded local storage keys from the previous build.
- Weekly progress, badges, focus sessions, and daily dungeon rewards are persisted in the app state.
- This project is intentionally MVP-sized so it stays realistic for demos, iteration, and technopreneurship presentations.
