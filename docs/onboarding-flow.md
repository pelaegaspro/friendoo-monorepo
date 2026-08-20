# Onboarding — Language Selection Flow

Verified against actual codebase on 2026-05-12.
All node references map to real file locations.

## Flow Diagram

```mermaid
graph TB
    subgraph Startup["Startup & Navigation"]
        1a["1a: MainActivity<br/>initializes app"]
        1b["1b: AppNavigation<br/>starts at roleGate"]
        1c["1c: RoleGate<br/>checks onboarding status"]
        1d["1d: Navigate to<br/>onboarding if incomplete"]
    end

    subgraph StateInit["State Initialization"]
        2a["2a: OnboardingScreen<br/>created with ViewModel"]
        2b["2b: Check consent<br/>from preferences"]
        2c["2c: Load existing<br/>languages"]
        2d["2d: Update UI state<br/>for screens to show"]
    end

    subgraph UIRender["Language Selection UI"]
        3a["3a: LanguageSelectionScreen<br/>rendered"]
        3b["3b: Language list<br/>defined (10 languages)"]
        3c["3c: FlowRow layout<br/>created"]
        3d["3d: Check selection<br/>state per language"]
        3e["3e: Language pill<br/>onClick handler"]
    end

    subgraph StateManagement["State Management"]
        4a["4a: toggleLanguage<br/>function called"]
        4b["4b: Get current<br/>selections"]
        4c["4c: Update state<br/>add/remove language"]
    end

    subgraph Persistence["Persistence & Navigation"]
        5a["5a: Continue button<br/>enabled if languages selected"]
        5b["5b: continueAfterLanguageSelection<br/>called"]
        5c["5c: Save languages<br/>to preferences"]
        5d["5d: Hide language screen<br/>show alias screen"]
        5e["5e: Persist to DataStore<br/>as comma-separated string"]
    end

    subgraph Prefs["User Preferences"]
        UP["UserPreferences<br/>DataStore"]
    end

    1a -->|initializes with| 1b
    1b -->|checks| 1c
    1c -->|routes to| 1d
    1d -->|navigates to| 2a

    2a -->|injects ViewModel| StateInit
    2b -->|reads from| UP
    2c -->|reads from| UP
    2d -->|updates| 3a

    3a -->|displays| 3b
    3b -->|renders in| 3c
    3c -->|evaluates| 3d
    3d -->|triggers| 3e

    3e -->|calls| 4a
    4a -->|retrieves| 4b
    4b -->|modifies| 4c
    4c -.->|reactive state update| 3d

    4c -.->|reactive side-effect| 5a
    5a -->|enables| 5b
    5b -->|persists| 5c
    5c -->|writes to| 5e
    5e -->|saves in| UP
    5b -->|hides language| 5d

    style Startup fill:#fcc2d7
    style StateInit fill:#d0bfff
    style UIRender fill:#b2f2bb
    style StateManagement fill:#ffec99
    style Persistence fill:#ffd8a8
    style Prefs fill:#99e9f2
```

## Code References

| Node | File | Line(s) | Description |
|------|------|---------|-------------|
| 1a | `presentation/MainActivity.kt` | 30–36 | Initializes `AppNavigation` |
| 1b | `presentation/Navigation.kt` | 41 | `startDestination = "roleGate"` |
| 1c | `presentation/Navigation.kt` | 170–175 | `RoleGate` checks `onboardingCompleted` |
| 1d | `presentation/Navigation.kt` | 170–175 | Routes to `onboarding` if incomplete |
| 2b | `onboarding/OnboardingViewModel.kt` | 35–47 | `init` reads `consentGivenFlow` |
| 2c | `onboarding/OnboardingViewModel.kt` | 35–47 | `init` reads `preferredLanguagesFlow` |
| 2d | `onboarding/OnboardingScreen.kt` | 45–51 | Renders screen based on state flags |
| 3a | `onboarding/OnboardingScreen.kt` | 45–51 | `LanguageSelectionScreen` rendered |
| 3b | `onboarding/OnboardingScreen.kt` | 79 | 10-language list defined |
| 3c | `onboarding/OnboardingScreen.kt` | 116 | `FlowRow` layout |
| 3d | `onboarding/OnboardingScreen.kt` | 122–124 | Selection check per pill |
| 3e | `onboarding/OnboardingScreen.kt` | 122–124 | `Surface(onClick)` handler |
| 4a | `onboarding/OnboardingViewModel.kt` | 57–62 | `toggleLanguage()` called |
| 4b | `onboarding/OnboardingViewModel.kt` | 57–62 | Gets current `selectedLanguages` |
| 4c | `onboarding/OnboardingViewModel.kt` | 57–62 | Adds or removes language from set |
| 5a | `onboarding/OnboardingScreen.kt` | 143–147 | Continue button enabled check |
| 5b | `onboarding/OnboardingViewModel.kt` | 64–69 | `continueAfterLanguageSelection()` |
| 5c/5e | `data/local/UserPreferences.kt` | 110–114 | Comma-separated save to DataStore |
| 5d | `onboarding/OnboardingViewModel.kt` | 64–69 | Sets `showLanguageScreen = false` |

## Diagram Notes

- The `4c → 5a` edge is a **reactive side-effect**, not a direct call.
  The language pill `onClick` only calls `toggleLanguage()`.
  The Continue button enabling is driven by `selectedLanguages.isNotEmpty()` recomposing reactively.
  This is shown as a dashed edge in the diagram above.
- The `OnboardingScreen` falls through to `AliasSelectionScreen` once `showLanguageScreen` becomes `false`.
  See `OnboardingScreen.kt` lines 49–50.

## Onboarding Screen Flow

```
Login / OTP
    │
    ▼
RoleGate (Navigation.kt)
    │ onboardingCompleted == false
    ▼
OnboardingScreen
    ├── showConsentScreen == true  →  ConsentScreen
    ├── showLanguageScreen == true →  LanguageSelectionScreen  ← THIS FILE
    └── else                       →  AliasSelectionScreen
```

## Related Files

- `Friendoo/app/src/main/java/com/friendoo/app/presentation/onboarding/OnboardingScreen.kt`
- `Friendoo/app/src/main/java/com/friendoo/app/presentation/onboarding/OnboardingViewModel.kt`
- `Friendoo/app/src/main/java/com/friendoo/app/data/local/UserPreferences.kt`
- `Friendoo/app/src/main/java/com/friendoo/app/presentation/Navigation.kt`
- `Friendoo/app/src/main/java/com/friendoo/app/presentation/MainActivity.kt`
