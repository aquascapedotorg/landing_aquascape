import { FishParticle, FishSpeciesType } from '../types';

export interface CommunalFishInput {
  id?: string | number;
  name: string;
  species: FishSpeciesType;
}

export interface AquascapeCanvasProvider {
  dropFood?: (x?: number, y?: number) => void;
  spawnBaby?: () => void;
  getFishList?: () => FishParticle[];
  renameFish?: (id: number, newName: string) => void;
  syncCommunalFish?: (fishes: CommunalFishInput[]) => void;
  spawnFish?: (species: FishSpeciesType, name?: string) => FishParticle | undefined;
}

class AquascapeEventManager {
  private providers: { id: string; provider: AquascapeCanvasProvider }[] = [];
  private rosterListeners: (() => void)[] = [];
  private catalogListeners: (() => void)[] = [];
  private streakListeners: (() => void)[] = [];
  private toastListeners: ((message: string, species?: FishSpeciesType) => void)[] = [];

  /**
   * Registers a canvas provider. The most recently registered provider becomes active.
   * Returns an unregister cleanup function.
   */
  public registerProvider(id: string, provider: AquascapeCanvasProvider): () => void {
    // Remove if already present with same id
    this.providers = this.providers.filter((p) => p.id !== id);
    this.providers.push({ id, provider });
    this.syncToWindow();

    return () => {
      this.unregisterProvider(id);
    };
  }

  public unregisterProvider(id: string): void {
    this.providers = this.providers.filter((p) => p.id !== id);
  }

  public getActiveProvider(): AquascapeCanvasProvider | undefined {
    if (this.providers.length === 0) return undefined;
    // Zen canvas always takes precedence over Hero canvas when active/mounted
    const zen = this.providers.find((p) => p.id.startsWith('zen'));
    if (zen) return zen.provider;
    return this.providers[this.providers.length - 1].provider;
  }

  /**
   * Subscribes to fish roster change events (e.g. density/species sync).
   */
  public onFishRosterChanged(listener: () => void): () => void {
    this.rosterListeners.push(listener);
    return () => {
      this.rosterListeners = this.rosterListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notifies all subscribers that the fish school or roster has updated.
   */
  public notifyFishRosterChanged(): void {
    this.rosterListeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in fish roster listener:', err);
      }
    });
  }

  public dropFood(x?: number, y?: number): void {
    const active = this.getActiveProvider();
    if (active?.dropFood) {
      active.dropFood(x, y);
    }
  }

  public spawnBaby(): void {
    const active = this.getActiveProvider();
    if (active?.spawnBaby) {
      active.spawnBaby();
    }
  }

  public getFishList(): FishParticle[] {
    const active = this.getActiveProvider();
    if (active?.getFishList) {
      return active.getFishList();
    }
    return [];
  }

  /**
   * Retrieves live fish list from ANY registered provider that currently has fish.
   * Useful when a new canvas (like Zen modal) mounts and needs to inherit existing live fish.
   */
  public getExistingFishList(): FishParticle[] {
    for (const p of this.providers) {
      if (p.provider.getFishList) {
        const list = p.provider.getFishList();
        if (list && list.length > 0) {
          return list;
        }
      }
    }
    return [];
  }

  public renameFish(id: number, newName: string): void {
    const active = this.getActiveProvider();
    if (active?.renameFish) {
      active.renameFish(id, newName);
    }
  }

  public syncCommunalFish(fishes: CommunalFishInput[]): void {
    this.providers.forEach((p) => {
      if (p.provider.syncCommunalFish) {
        try {
          p.provider.syncCommunalFish(fishes);
        } catch (err) {
          console.error('Error syncing communal fish on provider:', err);
        }
      }
    });
  }

  public spawnFish(species: FishSpeciesType, name?: string): FishParticle | undefined {
    let result: FishParticle | undefined;
    this.providers.forEach((p) => {
      if (p.provider.spawnFish) {
        try {
          const spawned = p.provider.spawnFish(species, name);
          if (spawned) result = spawned;
        } catch (err) {
          console.error('Error spawning fish on provider:', err);
        }
      }
    });
    return result;
  }

  public onCatalogLoaded(listener: () => void): () => void {
    this.catalogListeners.push(listener);
    return () => {
      this.catalogListeners = this.catalogListeners.filter((l) => l !== listener);
    };
  }

  public notifyCatalogLoaded(): void {
    this.catalogListeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in catalog loaded listener:', err);
      }
    });
  }

  public onStreakUpdated(listener: () => void): () => void {
    this.streakListeners.push(listener);
    return () => {
      this.streakListeners = this.streakListeners.filter((l) => l !== listener);
    };
  }

  public notifyStreakUpdated(): void {
    this.streakListeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in streak updated listener:', err);
      }
    });
  }

  public onNewFishToast(listener: (message: string, species?: FishSpeciesType) => void): () => void {
    this.toastListeners.push(listener);
    return () => {
      this.toastListeners = this.toastListeners.filter((l) => l !== listener);
    };
  }

  public notifyNewFishToast(message: string, species?: FishSpeciesType): void {
    this.toastListeners.forEach((l) => {
      try {
        l(message, species);
      } catch (err) {
        console.error('Error in new fish toast listener:', err);
      }
    });
  }

  /**
   * Binds safe delegate handlers to window / global scope so legacy or external callers
   * never encounter undefined or deleted handlers.
   */
  public syncToWindow(): void {
    const target = typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
      ? (globalThis as unknown as Window)
      : undefined;

    if (!target) return;

    target.__aquascapeDropFood = (x?: number, y?: number) => this.dropFood(x, y);
    target.__aquascapeSpawnBaby = () => this.spawnBaby();
    target.__aquascapeGetFishList = () => this.getFishList();
    target.__aquascapeRenameFish = (id: number, newName: string) => this.renameFish(id, newName);
  }

  public clearAll(): void {
    this.providers = [];
    this.rosterListeners = [];
  }
}

export const aquascapeEvents = new AquascapeEventManager();
aquascapeEvents.syncToWindow();
