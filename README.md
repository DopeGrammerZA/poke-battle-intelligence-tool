# PokéAPI Battle Intelligence

An advanced, production-quality data exploration tool for Pokémon built with Angular. This application allows users to browse, search, and compare Pokémon, leveraging an intelligence engine to calculate battle readiness and predict match outcomes.

This project was built as a demonstration of expert-level Angular development, UI/UX design, and state management practices.

## Features

-   **Pokédex:** A comprehensive list of Pokémon with a fast, debounced search and two distinct, keyboard-navigable view modes (grid and list).
-   **Detailed View:** In-depth statistics for each Pokémon, including base stats, abilities, and a calculated "Battle Readiness Score".
-   **Comparison Engine:** A side-by-side comparison tool to analyze two Pokémon.
-   **Winner Prediction:** A sophisticated algorithm that simulates a battle to predict the winner, providing a clear explanation for the outcome.
-   **Type Explorer:** An interface to explore Pokémon by their elemental type and discover the "Apex" (strongest) Pokémon within each category.
-   **Evolution Explorer:** A visual tool to explore the complete evolution chain of any Pokémon, including branching evolutions.
-   **Item Dex:** A complete browser for all in-game items. Features include searching, filtering by category (e.g., "Pokéballs", "Healing Items"), and sorting by name or cost.
-   **Ability Dex:** A searchable, paginated list of all Pokémon abilities. The detail view explains each ability's effect and shows all Pokémon that can have it, distinguishing between regular and hidden abilities.

## Tech Stack

-   **Framework:** Angular 21+ (Standalone Components, Signals, `inject()`)
-   **Styling:** Tailwind CSS for a utility-first, responsive "Cyber-Safari" theme.
-   **State Management:** Custom Signal-based stores (`PokemonStore`, `ItemStore`, `AbilityStore`), inspired by NgRx SignalStore, for reactive and predictable state management.
-   **Data Fetching:** Angular's `HttpClient` with RxJS.
-   **Build/Environment:** Zoneless Angular application bootstrapped for a modern, performant user experience.

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 21+ (install globally: `npm install -g @angular/cli`)
- Git

### Installation and Running the Application

```bash
# Clone the repository
git clone https://github.com/DopeGrammerZA/poke-battle-intelligence-tool.git

# Install dependencies
npm install

# Start the development server
ng serve
```

The application will be available at `http://localhost:4200`

**Available Scripts**:
- `ng serve` - Start development server with hot reload (default port: 4200)
- `ng serve --open` - Start server and automatically open browser
- `ng build` - Build for production
- `ng test` - Run unit tests with Karma
- `ng lint` - Lint TypeScript code
- `npm start` - Alias for `ng serve`

### Build for Production

```bash
# Build optimized production bundle
ng build --configuration production

# Output will be in the dist/ directory
# Serve the production build locally to test
npx http-server dist/pokeapi-battle-intelligence -p 8080
```

### Environment Configuration

The application uses Angular's environment files:
- `src/environments/environment.ts` - Development configuration
- `src/environments/environment.prod.ts` - Production configuration

No additional environment setup is required as the app uses the public PokéAPI.

---

## Architecture Decisions

### State Management (Custom Signal Store)

For this application, I chose a custom signal-based store (`pokemon.store.ts`) over a library like NgRx SignalStore.

-   **Why Signals?** Angular Signals provide a fine-grained, glitch-free reactivity model that is perfect for modern, performant applications. They simplify state management within components and across the application, reducing the need for complex selectors and memoization.
-   **Why a Custom Store?** While `@ngrx/signals` is an excellent library, building a custom store for this project demonstrates a deep understanding of Angular's core reactive primitives. It keeps dependencies minimal while providing all necessary features: centralized state, readonly public signals (selectors), and methods for state mutation (actions). This lightweight, transparent, and tailored approach was also applied to the `ItemStore` and `AbilityStore` for managing the state of their respective features.

### Caching Service

A `CachingService` (`caching.service.ts`) was implemented using `sessionStorage` with a Time-to-Live (TTL) for each entry.

-   **Purpose:** To minimize redundant API calls to `pokeapi.co`, improving performance and user experience. `sessionStorage` ensures that the cache persists through page reloads within the same browser tab.
-   **Mechanism:** Before any API call, the service checks for a valid (non-expired) entry in the cache. If found, it returns the cached data as an `Observable`; otherwise, it proceeds with the HTTP request and caches the result upon success.
-   **TTL Strategy:** Cached entries expire after 30 minutes, balancing freshness with performance.

### Resilience Strategy

Instead of a global `HttpInterceptor`, resilience is handled directly within the `PokemonService` using the RxJS `retry` operator.

-   **Approach:** This provides more granular control. We can apply specific retry logic (like exponential backoff for `429 Too Many Requests` or `5xx` server errors) only to the API calls that need it, without affecting other potential HTTP calls in the application.
-   **Error Handling:** The service catches errors and provides user-friendly error messages, allowing graceful degradation when the API is unavailable.
-   **Rate Limiting:** The retry logic includes a delay mechanism to avoid hammering the API during outages.

## Data Transformations

The core "intelligence" of the app lies in its data transformation and analysis services.

### Battle Readiness Score

The `calculateBattleReadinessScore` method in `battle-logic.service.ts` converts raw Pokémon stats into a single, understandable metric (0-100). The formula is a weighted average designed to provide a holistic view of a Pokémon's combat potential:

`Score = (BaseStats * 0.4) + (TypeAdvantage * 0.3) + (SpeedBonus * 0.2) + (LegendaryBonus * 0.1)`

-   **Base Stats (40%):** The foundation of a Pokémon's power. Higher total base stats (HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed) contribute significantly to the score.
-   **Type Advantage (30%):** A heuristic that rewards Pokémon with more super-effective matchups. Pokémon with dual types that cover more weaknesses score higher.
-   **Speed Bonus (20%):** A crucial factor, as attacking first is a significant advantage. Pokémon with speed above 100 receive additional points.
-   **Legendary Bonus (10%):** A small boost to reflect the innate power of legendary and mythical Pokémon.

**Example Calculation:**
- Charizard (Fire/Flying): Base Stats = 534, Speed = 100, Dual-type coverage = good → Score: 78/100
- Mewtwo (Psychic, Legendary): Base Stats = 680, Speed = 130, Legendary = true → Score: 95/100

### Winner Prediction

The `predictWinner` method simulates a 10-round battle. It uses an 18x18 **Type Effectiveness Matrix** to calculate damage multipliers. Speed determines the attack order in each round, and the Pokémon with more remaining HP after 10 rounds (or after one faints) is declared the winner. The service also generates a plain-language explanation for its prediction.

**Prediction Algorithm:**
1. Calculate base damage using Attack and Defense stats
2. Apply type effectiveness multiplier (0.25x to 4x based on type matchups)
3. Determine attack order by speed
4. Simulate 10 rounds of combat
5. Declare winner based on remaining HP
6. Generate explanation highlighting key factors (type advantage, speed, stat differences)

**Limitations:** The prediction is a simplified simulation that doesn't account for abilities, specific moves, status effects, or critical hits.

---

## Testing Strategy

### Unit Tests (2 Tests Included)

**1. Battle Readiness Score Calculation (Transformation Test)**
```typescript
describe('BattleLogicService - Battle Readiness', () => {
  it('should calculate correct score for legendary Pokémon', () => {
    const mewtwo = {
      stats: { hp: 106, attack: 110, defense: 90, 
               spAttack: 154, spDefense: 90, speed: 130 },
      types: ['psychic'],
      isLegendary: true
    };
    const score = service.calculateBattleReadinessScore(mewtwo);
    expect(score).toBeGreaterThan(90); // Legendary with high stats
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

**2. API Failure Handling Test (Failure Scenario)**
```typescript
describe('PokemonService - Error Handling', () => {
  it('should handle API timeout and retry', fakeAsync(() => {
    const errorResponse = new HttpErrorResponse({ 
      status: 504, 
      statusText: 'Gateway Timeout' 
    });
    
    spyOn(httpClient, 'get').and.returnValue(throwError(() => errorResponse));
    
    service.getPokemonDetails(1).subscribe({
      error: (error) => {
        expect(error.message).toContain('timeout');
      }
    });
    
    tick(3000); // Wait for retry logic
  }));
});
```

### Integration Test (1 Test Included)

**Compare Feature UI Test**
```typescript
describe('Compare Component - Integration', () => {
  it('should display winner prediction when both Pokémon are selected', async () => {
    const fixture = TestBed.createComponent(CompareComponent);
    const component = fixture.componentInstance;
    
    // Select first Pokémon
    component.selectPokemon1({ id: 6, name: 'charizard' });
    fixture.detectChanges();
    
    // Select second Pokémon
    component.selectPokemon2({ id: 150, name: 'mewtwo' });
    fixture.detectChanges();
    
    await fixture.whenStable();
    
    const predictionCard = fixture.nativeElement.querySelector('.prediction-result');
    expect(predictionCard).toBeTruthy();
    expect(predictionCard.textContent).toContain('Winner');
  });
});
```

---

## Known Limitations

-   **Item Detail Page:** The item detail page currently has issues displaying data correctly and is slated for a fix.
-   **Apex Pokémon Search:** For performance reasons, the "Find Apex Pokémon" feature in the Type Explorer only analyzes the first 50 Pokémon of a given type. A full analysis would require fetching details for every Pokémon, which could be slow.
-   **Battle Simulation:** The winner prediction is a simplified simulation. It doesn't account for abilities, specific moves, status effects, or critical hits.
-   **Data Scope:** The app currently filters to show Pokémon with an ID below 10000 to focus on core species and avoid alternate forms that may have inconsistent API data.
-   **Offline Support:** No service worker implemented; the app requires internet connectivity.
-   **Browser Compatibility:** Optimized for modern browsers (Chrome, Firefox, Edge, Safari); IE11 not supported.

## What I Would Add With More Time

-   **Full Pokédex:** Implement more robust server-side pagination to support all 1000+ Pokémon efficiently.
-   **Advanced Battle Simulation:** Incorporate Pokémon moves and abilities into the prediction engine for more accurate results.
-   **Team Builder:** Allow users to build a team of six Pokémon and get an overall team "synergy" score based on type coverage and stat distribution.
-   **User Accounts:** Persist user-created teams and favorite Pokémon using backend storage (Firebase or similar).
-   **Progressive Web App:** Add service worker for offline support and app-like experience.
-   **Advanced Analytics:** Track most-compared Pokémon, popular types, and provide insights into community preferences.
-   **Move Database:** Integrate Pokémon moves into the detail view with filtering by type and power.
-   **Damage Calculator:** Build a precise damage calculator that accounts for EVs, IVs, nature, and held items.

---

## Design Principles Applied

### 1. Clarity

*   **How it was applied:** The UI prioritizes a clear information hierarchy. Key data points, like the Battle Readiness Score, are given prominence with large typography and visual aids (progress bars). Complex data, like base stats, are broken down with labels and color-coding to be easily scannable.
*   **Concrete Example:** The **Pokémon Detail screen** places the most important information (name, image, types, score) in visually distinct, high-contrast cards at the top, reducing cognitive load for the user. Base stats are displayed as horizontal progress bars with numerical values, making it immediately clear which stats are strengths vs. weaknesses. The Battle Readiness Score is shown as a large circular gauge with color-coding (red < 50, yellow 50-75, green > 75), eliminating ambiguity.

### 2. Consistency

*   **How it was applied:** A consistent design language is used throughout the app. Components like Pokémon cards, buttons, and input fields share the same "Cyber-Safari" aesthetic (glassmorphism, neon accents). Navigation patterns and layouts are reused across different screens. All type badges use the same color scheme across every view.
*   **Concrete Example:** The grid-based layout for displaying Pokémon is used on both the **Pokédex screen** and the **Type Explorer screen**, creating a familiar browsing experience. Every Pokémon card follows the same structure: image at top, name below, types as badges, and stats at bottom. This consistency means users learn the pattern once and can scan hundreds of cards efficiently.

### 3. Feedback

*   **How it was applied:** The system provides immediate feedback for user actions and system states. Loading states, success confirmations, and error messages are displayed contextually. Hover states and transitions make interactions feel responsive.
*   **Concrete Example:** When data is being fetched, animated loading skeletons (shimmer effect) are displayed on the **Pokédex screen** to manage user expectations and reduce perceived wait time. On the **Compare screen**, Pokémon cards update instantly after a search with a smooth fade-in animation, and the "Battle Prediction" card appears only when both Pokémon are selected. If an API call fails, a toast notification appears at the top of the screen with a "Retry" button, clearly communicating the system's state and offering recovery.

### 4. Accessibility

*   **How it was applied:** The application was built with accessibility in mind from the ground up. All interactive elements (links, buttons, inputs) have descriptive `aria-label` attributes for screen readers. The color palette was chosen to ensure WCAG AA contrast ratios (4.5:1 for normal text). The application is fully navigable using only a keyboard, with visible focus indicators and logical tab order.
*   **Concrete Example:** In the main navigation header, each link has a descriptive `aria-label` like "View Pokémon list" or "Compare Pokémon", making it easy for users with screen readers to navigate. The search input has `aria-describedby` linking to helper text. Type badges have `role="img"` with `aria-label="Fire type"`. The comparison table uses proper semantic HTML (`<table>`, `<th>`, `<td>`) with `scope` attributes for screen reader compatibility.

### 5. Efficiency

*   **How it was applied:** The UI is designed to help users complete tasks quickly with minimal friction. The debounced search (300ms delay) allows users to find a Pokémon with minimal typing. Keyboard shortcuts (/ for search focus, Escape to clear) enable power users. Data caching eliminates redundant API calls.
*   **Concrete Example:** The **Compare screen** streamlines the process of selecting and analyzing two Pokémon on a single view, avoiding unnecessary navigation between pages. Users can search and select both Pokémon without leaving the screen, and the prediction appears automatically. The `CachingService` plays a key role in efficiency—navigating back to a Pokémon's detail page is instantaneous (no loading spinner), removing the friction of waiting for data to reload. Type badges are clickable shortcuts that filter the Pokédex instantly.

---

## Performance Optimizations

### Implemented
- **OnPush Change Detection:** All components use `ChangeDetectionStrategy.OnPush` to minimize dirty checking
- **Lazy Loading:** Routes are lazy-loaded with Angular's `loadComponent()` syntax
- **Virtual Scrolling:** Pokédex list uses `@angular/cdk/scrolling` for rendering only visible items
- **Debounced Search:** Search input debounced at 300ms to reduce API calls
- **Image Lazy Loading:** Native `loading="lazy"` attribute on all Pokémon images
- **TrackBy Functions:** All `*ngFor` directives use `trackBy` to optimize rendering

### Caching Strategy
- **Session Storage:** 30-minute TTL for API responses
- **In-Memory Cache:** Frequently accessed data (type list, ability list) cached in service
- **Strategy Rationale:** Pokémon data is relatively static, making aggressive caching safe. `sessionStorage` survives page reloads within the same tab, improving UX during browsing sessions.

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── pokemon.service.ts        # API calls to PokéAPI
│   │   │   ├── caching.service.ts        # TTL-based cache
│   │   │   └── battle-logic.service.ts   # Score & prediction algorithms
│   │   └── interceptors/
│   │       └── error.interceptor.ts      # Global error handling
│   ├── features/
│   │   ├── pokedex/
│   │   │   ├── pokedex.component.ts      # List/grid view with search
│   │   │   └── pokemon-detail.component.ts
│   │   ├── compare/
│   │   │   └── compare.component.ts      # Side-by-side comparison
│   │   ├── type-explorer/
│   │   │   └── type-explorer.component.ts
│   │   ├── items/
│   │   │   └── item-dex.component.ts
│   │   └── abilities/
│   │       └── ability-dex.component.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── pokemon-card.component.ts
│   │   │   ├── type-badge.component.ts
│   │   │   └── loading-skeleton.component.ts
│   │   └── pipes/
│   │       └── stat-color.pipe.ts
│   ├── store/
│   │   ├── pokemon.store.ts              # Signal-based state
│   │   ├── item.store.ts
│   │   └── ability.store.ts
│   └── app.component.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles/
    └── styles.scss                       # Global Tailwind config
```

---

## API Integration Details

### PokéAPI Endpoints Used
- `GET /pokemon?limit=10000` - Fetch Pokémon list
- `GET /pokemon/{id}` - Fetch Pokémon details
- `GET /pokemon-species/{id}` - Fetch evolution chain info
- `GET /type/{name}` - Fetch type relationships
- `GET /item/{id}` - Fetch item details
- `GET /ability/{id}` - Fetch ability details

### Rate Limiting Handling
PokéAPI has a rate limit of ~100 requests per minute per IP. The application handles this through:
- Caching to minimize redundant requests
- Exponential backoff retry logic (3 attempts with 2s, 4s, 8s delays)
- User feedback when rate limit is hit with "Please wait" message

### Malformed Data Handling
- Missing sprites: Fallback to placeholder image
- Incomplete stats: Default to 0 with visual indicator
- Missing types: Show as "Unknown" type
- Evolution chains with circular references: Detect and break loops

---

## License

This project is built for technical assessment purposes. Not intended for production use.

## Developer

Built by Kagiso Masebe as an individual extension task demonstrating Angular expertise, state management, and production-quality frontend development.

---

**Assessment Completion Date**: [Date]  
**Development Time**: ~16 hours  
**Lines of Code**: ~2,800
