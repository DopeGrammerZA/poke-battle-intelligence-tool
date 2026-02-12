# PokéAPI Battle Intelligence

An advanced, production-quality data exploration tool for Pokémon built with Angular. This application allows users to browse, search, and compare Pokémon, leveraging an intelligence engine to calculate battle readiness and predict match outcomes.

This project was built as a demonstration of expert-level Angular development, UI/UX design, and state management practices.

## Features

-   **Pokédex:** A comprehensive list of the first 151 Pokémon with a fast, debounced search.
-   **Detailed View:** In-depth statistics for each Pokémon, including base stats, abilities, and a calculated "Battle Readiness Score".
-   **Comparison Engine:** A side-by-side comparison tool to analyze two Pokémon.
-   **Winner Prediction:** A sophisticated algorithm that simulates a battle to predict the winner, providing a clear explanation for the outcome.
-   **Type Explorer:** An interface to explore Pokémon by their elemental type and discover the "Apex" (strongest) Pokémon within each category.

## Tech Stack

-   **Framework:** Angular 21+ (Standalone Components, Signals, `inject()`)
-   **Styling:** Tailwind CSS for a utility-first, responsive "Cyber-Safari" theme.
-   **State Management:** Custom Signal-based store (`PokemonStore`), inspired by NgRx SignalStore, for reactive and predictable state management.
-   **Data Fetching:** Angular's `HttpClient` with RxJS.
-   **Build/Environment:** Zoneless Angular application bootstrapped for a modern, performant user experience.

---

## Architecture Decisions

### State Management (Custom Signal Store)

For this application, I chose a custom signal-based store (`pokemon.store.ts`) over a library like NgRx SignalStore.

-   **Why Signals?** Angular Signals provide a fine-grained, glitch-free reactivity model that is perfect for modern, performant applications. They simplify state management within components and across the application, reducing the need for complex selectors and memoization.
-   **Why a Custom Store?** While `@ngrx/signals` is an excellent library, building a custom store for this project demonstrates a deep understanding of Angular's core reactive primitives. It keeps dependencies minimal while providing all necessary features: centralized state, readonly public signals (selectors), and methods for state mutation (actions). This approach is lightweight, highly transparent, and perfectly tailored to the app's needs.

### Caching Service

A `CachingService` (`caching.service.ts`) was implemented using a simple `Map` with a Time-to-Live (TTL) for each entry.

-   **Purpose:** To minimize redundant API calls to `pokeapi.co`, improving performance and user experience, especially when navigating back and forth between views.
-   **Mechanism:** Before any API call, the service checks for a valid (non-expired) entry in the cache. If found, it returns the cached data as an `Observable`; otherwise, it proceeds with the HTTP request and caches the result upon success.

### Resilience Strategy

Instead of a global `HttpInterceptor`, resilience is handled directly within the `PokemonService` using the RxJS `retry` operator.

-   **Approach:** This provides more granular control. We can apply specific retry logic (like exponential backoff for `429 Too Many Requests` or `5xx` server errors) only to the API calls that need it, without affecting other potential HTTP calls in the application.

## Data Transformations

The core "intelligence" of the app lies in its data transformation and analysis services.

### Battle Readiness Score

The `calculateBattleReadinessScore` method in `battle-logic.service.ts` converts raw Pokémon stats into a single, understandable metric (0-100). The formula is a weighted average designed to provide a holistic view of a Pokémon's combat potential:

`Score = (BaseStats * 0.4) + (TypeAdvantage * 0.3) + (SpeedBonus * 0.2) + (LegendaryBonus * 0.1)`

-   **Base Stats:** The foundation of a Pokémon's power.
-   **Type Advantage:** A heuristic that rewards Pokémon with more super-effective matchups.
-   **Speed Bonus:** A crucial factor, as attacking first is a significant advantage.
-   **Legendary Bonus:** A small boost to reflect the innate power of legendary and mythical Pokémon.

### Winner Prediction

The `predictWinner` method simulates a 10-round battle. It uses an 18x18 **Type Effectiveness Matrix** to calculate damage multipliers. Speed determines the attack order in each round, and the Pokémon with more remaining HP after 10 rounds (or after one faints) is declared the winner. The service also generates a plain-language explanation for its prediction.

---

## Known Limitations

-   **Apex Pokémon Search:** For performance reasons, the "Find Apex Pokémon" feature in the Type Explorer only analyzes the first 50 Pokémon of a given type. A full analysis would require fetching details for every Pokémon, which could be slow.
-   **Battle Simulation:** The winner prediction is a simplified simulation. It doesn't account for abilities, specific moves, status effects, or critical hits.
-   **Data Scope:** The app is currently limited to the first 151 Pokémon for a classic, focused experience.

## What I Would Add With More Time

-   **Full Pokédex:** Implement pagination or infinite scrolling to support all 1000+ Pokémon.
-   **Advanced Battle Simulation:** Incorporate Pokémon moves and abilities into the prediction engine for more accurate results.
-   **Team Builder:** Allow users to build a team of six Pokémon and get an overall team "synergy" score.
-   **User Accounts:** Persist user-created teams and favorite Pokémon.

---

## Design Principles Applied

### 1. Clarity

*   **How it was applied:** The UI prioritizes a clear information hierarchy. Key data points, like the Battle Readiness Score, are given prominence with large typography and visual aids (progress bars). Complex data, like base stats, are broken down with labels and color-coding to be easily scannable.
*   **Example:** The **Pokémon Detail screen** places the most important information (name, image, types, score) in visually distinct, high-contrast cards, reducing cognitive load for the user.

### 2. Consistency

*   **How it was applied:** A consistent design language is used throughout the app. Components like Pokémon cards, buttons, and input fields share the same "Cyber-Safari" aesthetic (glassmorphism, neon accents). Navigation patterns and layouts are reused across different screens.
*   **Example:** The grid-based layout for displaying Pokémon is used on both the **Pokédex screen** and the **Type Explorer screen**, creating a familiar browsing experience for the user.

### 3. Feedback

*   **How it was applied:** The system provides immediate feedback for user actions and system states.
*   **Example:** When data is being fetched, loading skeletons are displayed on the **Pokédex screen** to manage user expectations. On the **Compare screen**, Pokémon cards update instantly after a search, and the "Battle Prediction" card appears only when both Pokémon are selected, clearly communicating the system's state.

### 4. Accessibility

*   **How it was applied:** The application was built with accessibility in mind. All interactive elements (links, buttons, inputs) have `aria-label` attributes for screen readers. The color palette was chosen to ensure sufficient contrast. The application is fully navigable using only a keyboard (Tab and Enter keys).
*   **Example:** In the main navigation header, each link has a descriptive `aria-label` like "View Pokémon list" or "Compare Pokémon", making it easy for users with assistive technologies to navigate.

### 5. Efficiency

*   **How it was applied:** The UI is designed to help users complete tasks quickly. The debounced search on the **Pokédex screen** allows users to find a Pokémon with minimal typing. The **Compare screen** streamlines the process of selecting and analyzing two Pokémon on a single view, avoiding unnecessary navigation.
*   **Example:** The `CachingService` plays a key role in efficiency. By caching API responses, navigating back to a Pokémon's detail page is instantaneous, removing the friction of waiting for data to load again.
