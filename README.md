# DiscoverPNG

A mobile app for finding places to visit across Papua New Guinea — browse locations by category, check the weather before you go, see where to stay, and read (or leave) real reviews from people who've actually been there. Built as the individual semester project for IS323 Mobile Application Development.

**Student:** Jason Peter Miria
**Student number:** 24703715
**Unit:** IS323 Mobile Application Development
**Submission:** Week 14, Final Submission

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Setup and run instructions](#setup-and-run-instructions)
- [Environment variables](#environment-variables)
- [Backend setup (Supabase)](#backend-setup-supabase)
- [External APIs and services](#external-apis-and-services)
- [Build instructions (APK / AAB)](#build-instructions-apk--aab)
- [Screenshot gallery](#screenshot-gallery)
- [Known limitations](#known-limitations)
- [AI assistance](#ai-assistance)

---

## Features

- **Browse places** across PNG by category (Nature, Culture, Trekking, Island) on the Explore tab.
- **Place details** — description, a "where to stay" note, and a live current-weather card pulled from the place's own coordinates.
- **Register / log in / log out** with real Supabase authentication; a session persists after closing the app, and signed-out users are redirected away from the main app if they land on a protected route directly.
- **Write a review** — star rating (1–5), a comment, and an optional photo attached from the phone's gallery.
- **Edit or delete your own review** — guarded by a confirmation dialog on delete. Reviews belonging to other users cannot be edited or deleted, enforced by the database itself (Row Level Security), not just hidden in the UI.
- **My Reviews** on the Profile tab — every review you've written, in one place.
- **Offline fallback** — if the places list can't be fetched (no connection, backend unreachable), the app shows the last successfully loaded list instead of a blank screen, with a banner noting it's showing cached data.

Seven screens in total: Welcome, Login, Register, Explore, Location Detail, Add/Edit Review, Profile.

## Tech stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Expo (SDK 57) + Expo Router + TypeScript | Required by the brief; file-based routing kept the 7-screen navigation structure simple to reason about. |
| Backend | Supabase (Postgres + Auth + Storage) | One provider for authentication, a real relational database, and file storage, with Row Level Security built in for per-user data ownership. |
| Local storage | `@react-native-async-storage/async-storage` | Persists the Supabase session (stay logged in) and caches the last-loaded places list for offline viewing. |
| Icons | `@expo/vector-icons` (Ionicons) | Back buttons, password-visibility toggle, tab icons, star ratings. |
| Photo picking | `expo-image-picker` + `expo-file-system` (base64 read) + `base64-arraybuffer` | Lets a user attach a photo to a review and uploads it to Supabase Storage. Reading the file through `expo-file-system` rather than `fetch().blob()` was a deliberate fix — see [Known limitations](#known-limitations) / the Technical Report reflection for why. |
| Weather | Open-Meteo REST API | No API key or account needed, which removes one more secret to manage and one less thing that can silently break from an expired free-tier key. |

## Setup and run instructions

These steps work from a clean clone.

1. **Clone the repository**
   ```
   git clone [repository URL]
   cd discoverpng
   ```
2. **Install dependencies**
   ```
   npm install
   ```
3. **Set up environment variables** — create a `.env` file in the project root (see [Environment variables](#environment-variables) below).
4. **Start the dev server**
   ```
   npx expo start
   ```
5. **Open it on a phone** — install **Expo Go** from the Play Store on a physical Android device, then scan the QR code printed in the terminal. (The app was built and tested against Expo SDK 57 — using a different Expo Go version can cause compatibility errors.)

## Environment variables

Create a `.env` file in the project root with:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Both values come from your Supabase project's **Settings → API** page. The `EXPO_PUBLIC_` prefix is required — Expo only exposes variables with that prefix to the app's JavaScript at runtime. `.env` is already excluded via `.gitignore` and must never be committed.

## Backend setup (Supabase)

The app expects a Supabase project with two tables and two storage buckets, matching the data model in the Technical Report. To stand up a fresh backend (for example, to run this project with your own Supabase account), run the following in the Supabase SQL editor:

```sql
-- Tables
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,            -- 'nature' | 'culture' | 'trekking' | 'island'
  region text not null,
  description text not null,
  accommodation_note text,
  latitude float8,
  longitude float8,
  image_url text,
  created_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) not null,
  user_id uuid references auth.users(id) not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  photo_url text,
  author_name text,                  -- denormalised display name, see Technical Report
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table places enable row level security;
alter table reviews enable row level security;

create policy "places are publicly readable" on places
  for select using (true);

create policy "reviews are readable by signed-in users" on reviews
  for select using (auth.role() = 'authenticated');
create policy "users can insert their own reviews" on reviews
  for insert with check (auth.uid() = user_id);
create policy "users can update their own reviews" on reviews
  for update using (auth.uid() = user_id);
create policy "users can delete their own reviews" on reviews
  for delete using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('review-photos', 'review-photos', true);
insert into storage.buckets (id, name, public) values ('place-photos', 'place-photos', true);
```

`review-photos` additionally has per-user folder policies (a user can only upload/delete inside a folder named after their own `auth.uid()`; anyone can read, since the bucket is public). `place-photos` is admin-curated — photos are uploaded once via the Supabase dashboard, not by end users, so it needs no per-user policies beyond public read.

Also enable **Authentication → Providers → Email**, and leave **Authentication → User Signups → Confirm email** switched off, so a new account logs straight into the app with no email-verification step (a deliberate choice, not an oversight — see the Technical Report).

Finally, seed a few rows into `places` with real `latitude`/`longitude` values — the weather card has nothing to show for a place with no coordinates.

## External APIs and services

| Provider | Used for | Rate limits | On failure |
|---|---|---|---|
| **Open-Meteo** (`api.open-meteo.com/v1/forecast`) | Current temperature and condition on the Location Detail screen, looked up from each place's stored coordinates. No key required. | Free tier, no key, soft rate limit (fair-use); not hit during development. | Independent loading/error state — a failed weather call never blocks the place details or reviews from showing. Shows an error state rather than crashing the screen. |
| **Supabase** (Auth, Postgres, Storage) | User accounts and sessions; the `places` and `reviews` tables; `review-photos` and `place-photos` storage. | Free tier project limits (connections, storage, bandwidth); not hit during development. | Auth and data calls show inline error text / loading states rather than failing silently; the Explore list falls back to the last cached copy (see [Features](#features)) if the fetch fails entirely. |

## Build instructions (APK / AAB)

> **Status: not yet produced.** This section will be completed once EAS Build has been run.

Planned process, using EAS (`eas-cli`):

```
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview      # produces the signed APK
eas build --platform android --profile production   # produces the signed AAB
```

Once builds succeed, this section will be updated with the build IDs for both artefacts and a note of any configuration changes (e.g. in `eas.json` or `app.json`) that were needed to get the compiled build working, as distinct from running in Expo Go.

## Screenshot gallery

> Add screenshots for each screen here before submitting. Save them into a `/screenshots` folder at the project root and reference them like this:

```markdown
| Welcome | Login | Register |
|---|---|---|
| ![Welcome](./screenshots/welcome.png) | ![Login](./screenshots/login.png) | ![Register](./screenshots/register.png) |

| Explore | Location Detail | Add/Edit Review | Profile |
|---|---|---|---|
| ![Explore](./screenshots/explore.png) | ![Location Detail](./screenshots/location-detail.png) | ![Add Review](./screenshots/add-review.png) | ![Profile](./screenshots/profile.png) |
```

Screenshots already exist for Welcome, Login, Register, Explore and Profile from earlier testing — they just need saving into `/screenshots` with those file names. Location Detail and Add/Edit Review still need a fresh screenshot each.

## Known limitations

Written honestly, as required:

- **No GitHub repository has been set up yet.** The brief requires the final commit on `main` to be tagged `v1.0` and run from a clean clone — this is outstanding and is the single biggest remaining risk against Section 7 of the brief.
- **No EAS build has been produced yet.** The app has only been run through Expo Go on a physical device, not as a compiled, installed APK/AAB. See [Build instructions](#build-instructions-apk--aab).
- The protected-route guard (redirecting a signed-out user away from the main app) is hard to trigger through normal use, because logging out already redirects before the guard would ever need to fire. It was verified by code review and by confirming no regression to the normal login/logout flow, rather than by a reproducible manual click-path that forces a signed-out user directly into a protected screen.
- On login, there's a brief visible flash of the Welcome screen before the app settles on the Explore tab for an already-signed-in user. Cosmetic only — it doesn't affect functionality — and was left as-is given time constraints.
- Location and place photos are a single admin-curated image per place (uploaded once via the Supabase dashboard), not a multi-photo gallery or user-submitted location photos.
- No maps/location-picker integration — Weather was chosen instead as the required external API, since the brief itself flags map rendering in Expo as one of the most common sources of Expo-Go-vs-compiled-build breakage, and weather carries much less of that risk for a first React Native project.
- The "save/favourite a place" idea from early planning was cut for this submission (it was only a could-have) — there is no favourites feature.
- There is no separate `profiles` table. Each review stores a denormalised `author_name` column instead, because `auth.users` isn't safely queryable from client-side code and a whole extra table felt like unnecessary scope just to show a display name.

## AI assistance

I used **Claude** (Anthropic), via the Claude Code / Cowork interface, as a coding assistant throughout this project. I don't code myself, so my working process was: I described the feature, screen, or problem I wanted in plain language (sometimes pasting an existing file so a new one would match its style), Claude wrote the actual code, and I copied it into my own project in VS Code and tested it myself on my physical Android phone through Expo Go — nothing was treated as done until I had actually run it on-device and confirmed the behaviour myself.

Specifically, I used it for:
- Writing the screen components, navigation structure, and Supabase integration code (auth, database queries, storage uploads) from my descriptions and specs.
- Explaining concepts I didn't know going in — Row Level Security, how Expo Router's file-based routing works, why a session needs `AsyncStorage` to persist, what a protected route is and why one was needed.
- Debugging real errors by reading the actual error message or console output and reasoning through the cause with me, rather than guessing — for example, the `useFocusEffect` import had to move from `@react-navigation/native` to `expo-router` itself after an SDK 56 compatibility error, and a review photo that silently failed to upload was diagnosed by checking the file size directly in the Supabase Storage dashboard (14 bytes — clearly broken) rather than assuming the error message would explain itself.
- Helping assemble this README and the Technical Report, including the data model and screen flow diagrams.

I own and can explain every part of this codebase. Where I didn't understand something Claude wrote, I asked for an explanation before moving on, rather than copying it forward unreviewed. Verification of behaviour (does it actually work, does the database actually enforce ownership, does the offline fallback actually trigger) was always done by me, on my own device, not assumed from the code alone.
