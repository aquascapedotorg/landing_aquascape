import { FishParticle } from '../types';

export interface AquascapeCanvasProvider {
  dropFood?: (x?: number, y?: number) => void;
  spawnBaby?: () => void;
  getFishList?: () => FishParticle[];
  renameFish?: (id: number, newName: string) => void;
}

class AquascapeEventManager {
  private providers: { id: string; provider: AquascapeCanvasProvider }[] = [];

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
    return this.providers[this.providers.length - 1].provider;
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

  public renameFish(id: number, newName: string): void {
    const active = this.getActiveProvider();
    if (active?.renameFish) {
      active.renameFish(id, newName);
    }
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
  }
}

export const aquascapeEvents = new AquascapeEventManager();
aquascapeEvents.syncToWindow();
