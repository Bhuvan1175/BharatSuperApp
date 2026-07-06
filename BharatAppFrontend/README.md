# Bharat Super App — React Native CLI Frontend

An AI-powered lifestyle super app for India that unifies health, area intelligence, fuel & travel, government schemes, utilities and emergencies behind one conversational assistant.

Built with **React Native CLI** (not Expo) + **TypeScript**.

---

## Important: generating the native `android/` and `ios/` folders

This repository ships the **complete JavaScript/TypeScript application** (all screens, components, navigation, theme, services and mock data). The native `android/` and `ios/` folders are **environment-specific and must be generated on your machine** so they carry the correct package name, SDK versions and signing config for your setup. This is standard practice — native folders are not hand-authored.

Two supported ways to get the native shells:

### Option A — Generate a fresh RN app and copy its native folders (recommended)

```bash
# 1. In a scratch directory, create a matching RN CLI app (same RN version: 0.74.5)
npx @react-native-community/cli@latest init BharatSuperApp --version 0.74.5

# 2. Copy ONLY the generated native folders into this project
cp -R BharatSuperApp/android ./android
cp -R BharatSuperApp/ios ./ios

# 3. Install JS dependencies here
npm install

# 4. iOS pods (macOS only)
cd ios && pod install && cd ..
```

Make sure `app.json` `name` (`BharatSuperApp`) matches the name you used in `init`, so `AppRegistry.registerComponent` resolves.

### Option B — Init in place

If you prefer, run the init in an empty sibling folder and move the whole `src/`, `App.tsx`, `index.js`, `babel.config.js`, `tsconfig.json`, `metro.config.js` and `package.json` from here into it.

---

## Install & run

```bash
npm install

# start Metro
npm start

# Android (device/emulator running)
npm run android

# iOS (macOS)
npm run ios
```

### Fonts & icons

- Typography uses **Poppins** (UI) and **Roboto Mono** (data annotations). Drop the `.ttf` files into `src/assets/fonts/` and run `npx react-native-asset` to link them. Until then the app falls back to the system font gracefully (see `src/theme/typography.ts`).
- Icons use **react-native-vector-icons** (Feather set — 2px line icons matching the design). For Android, the Gradle line is added automatically by autolinking; for iOS add the fonts to `Info.plist` (`UIAppFonts`) per the library docs.

---

## Architecture

```
src/
├── assets/          # fonts, images
├── components/
│   ├── common/      # Button, Card, Input, SearchBar, Chip, Badge, ScoreCircle, AIOrb, ...
│   ├── cards/       # AreaScoreCard, PharmacyCard, SchemeCard, FuelStationCard, AlertCard, ...
│   └── chat/        # ChatBubble, TypingIndicator, SuggestionChip
├── constants/       # config, quick actions, categories
├── context/         # ThemeContext, LanguageContext, AuthContext, AppDataContext
├── data/            # mock/dummy data for every domain
├── hooks/           # useTheme, useTranslation, useDebounce, useMockQuery
├── localization/    # en + hi string tables
├── navigation/      # RootNavigator, AuthNavigator, BottomTabNavigator, types
├── screens/         # one folder per domain
├── services/        # api client stub + domain services (swap mocks for real APIs)
├── theme/           # colors, typography, spacing, radii — single source of truth
├── types/           # shared TypeScript models (matches the PDF data model)
└── utils/           # storage, formatters, helpers
```

### Design system (from the spec)

| Token | Hex | Usage |
|---|---|---|
| Deep Saffron (primary) | `#FF7A00` | Primary actions, active nav, brand |
| Royal Blue (secondary) | `#0057FF` | Links, secondary actions, info |
| Emerald (accent) | `#22C55E` | Success, positive scores, in-stock |
| Alert Red | `#FF3B30` | Emergency, SOS, high-crowd |
| Ink | `#121212` | Text / dark surfaces |
| Off-white | `#FAFAF8` | Light background |
| Dark surface | `#0C0C0F` | Dark-mode background |

Full light **and** dark themes toggle at runtime and persist. All colors, fonts, spacing and radii live in `src/theme` — never hard-code a value in a screen.

### Navigation

Five bottom-nav tabs: **Home · Explore · Travel · Government · Profile**. Health, Utilities and Emergency are reached as quick actions and via AI deep-links (per the IA in the spec). The AI Chat is reachable from the Home search bar on every relevant screen.

### Data

Everything runs on realistic **dummy data** in `src/data`. The service layer (`src/services`) is structured so each mock call can be replaced 1:1 with a real endpoint from the documented API surface (`/ai/query`, `/area/score`, `/health/medicine`, `/schemes/eligibility`, `/travel/stations`, `/emergency/sos`, ...).

## Screens implemented

Onboarding (3-slide + language) · Login (phone) · OTP · Biometric unlock · Permissions · Home · AI Chat · Explore/Area Score · Travel/Fuel · Road-trip planner · Government + Eligibility checker + Scheme results · Health/Medicines + Prescription scanner · Emergency + SOS · Utilities/Electricity · Profile · Saved · Settings.

## Quality

- `npm run tsc` — type-check
- `npm run lint` — lint
- `npm test` — unit tests
