import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChainLink, EvolutionDetail } from '../../models/pokemon.models';

interface ParsedEvolutionStage {
    from: { name: string, id: string };
    to: { name: string, id: string, details: string }[];
}

@Component({
  selector: 'app-evolution-chain',
  imports: [CommonModule, RouterLink],
  templateUrl: './evolution-chain.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class EvolutionChainComponent {
    store = inject(PokemonStore);

    @ViewChild('dropdownContainer') dropdownContainerRef?: ElementRef<HTMLDivElement>;
    
    selectedPokemonName = signal<string | null>(null);
    query = signal('');
    isDropdownOpen = signal(false);

    filteredPokemon = computed(() => {
        const q = this.query().toLowerCase();
        if (!q) return this.store.pokemonList();
        return this.store.pokemonList().filter(p => p.name.toLowerCase().includes(q));
    });

    onClickOutside(event: Event): void {
        const target = event.target as Node;
        if (this.isDropdownOpen() && this.dropdownContainerRef && !this.dropdownContainerRef.nativeElement.contains(target)) {
            this.isDropdownOpen.set(false);
        }
    }

    onQueryChange(event: Event): void {
        this.query.set((event.target as HTMLInputElement).value);
    }
    
    toggleDropdown(): void {
        this.isDropdownOpen.update(v => !v);
    }

    selectPokemon(pokemonName: string): void {
        this.selectedPokemonName.set(pokemonName);
        this.query.set(pokemonName);
        this.isDropdownOpen.set(false);
        this.store.loadEvolutionChain(pokemonName);
    }

    getPokemonId(url: string): string {
        const parts = url.split('/');
        return parts[parts.length - 2];
    }

    parsedEvolutionChain = computed(() => {
        const chain = this.store.evolutionChain();
        if (!chain) return [];

        const evolutionStages: ParsedEvolutionStage[] = [];
        let currentLink: ChainLink | undefined = chain.chain;

        while (currentLink && currentLink.evolves_to.length > 0) {
            const fromPokemon = {
                name: currentLink.species.name,
                id: this.getPokemonId(currentLink.species.url),
            };

            const toPokemons = currentLink.evolves_to.map(nextLink => ({
                name: nextLink.species.name,
                id: this.getPokemonId(nextLink.species.url),
                details: this.formatEvolutionDetails(nextLink.evolution_details[0])
            }));

            evolutionStages.push({ from: fromPokemon, to: toPokemons });
            
            // For simplicity in this visualization, we follow the first path for linear chains.
            // Branching logic is handled by the `toPokemons` array having multiple items.
            currentLink = currentLink.evolves_to[0];
        }

        return evolutionStages;
    });

    basePokemon = computed(() => {
        const chain = this.store.evolutionChain()?.chain;
        if (!chain) return null;
        return {
            name: chain.species.name,
            id: this.getPokemonId(chain.species.url),
        };
    });

    formatEvolutionDetails(details: EvolutionDetail): string {
        if (!details) return 'Unknown method';

        const trigger = details.trigger.name.replace('-', ' ');
        let condition = '';

        if (details.min_level) {
            condition = `at level ${details.min_level}`;
        } else if (details.item) {
            condition = `using ${details.item.name.replace('-', ' ')}`;
        } else if (details.held_item) {
            condition = `while holding ${details.held_item.name.replace('-', ' ')}`;
        } else if (details.min_happiness) {
            condition = `with high happiness`;
        } else if (details.known_move) {
            condition = `while knowing ${details.known_move.name.replace('-', ' ')}`;
        } else if (details.location) {
            condition = `at ${details.location.name.replace('-', ' ')}`;
        } else if (details.time_of_day) {
            condition = `during the ${details.time_of_day}`;
        }

        return `${trigger} ${condition}`.trim();
    }
    
    onImageError(event: Event) {
        (event.target as HTMLImageElement).src = "data:image/svg+xml,%3csvg width='128' height='128' viewBox='0 0 128' 128' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='128' height='128' fill='%231e293b'/%3e%3cline x1='32' y1='32' x2='96' y2='96' stroke='%23475569' stroke-width='4'/%3e%3cline x1='96' y1='32' x2='32' y2='96' stroke='%23475569' stroke-width='4'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='-1em'%3eImage%3c/text%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='1em'%3eUnavailable%3c/text%3e%3c/svg%3e";
    }
}
