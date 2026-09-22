import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeFishSpecies,
  applySupabaseFishData,
  getFishDataSourceConfig,
  fetchFishFromSupabase,
  SupabaseFishRow,
} from './supabaseFishService';
import { FishCatalogData } from '../data/fishCatalog';

describe('Supabase Fish Service & Data Source Configuration', () => {
  describe('normalizeFishSpecies (Default to neonTetra requirement)', () => {
    it('should preserve valid species names', () => {
      expect(normalizeFishSpecies('orca')).toBe('orca');
      expect(normalizeFishSpecies('turtle')).toBe('turtle');
      expect(normalizeFishSpecies('shark')).toBe('shark');
      expect(normalizeFishSpecies('whale')).toBe('whale');
      expect(normalizeFishSpecies('dolphin')).toBe('dolphin');
      expect(normalizeFishSpecies('angelfish')).toBe('angelfish');
      expect(normalizeFishSpecies('guppy')).toBe('guppy');
      expect(normalizeFishSpecies('neonTetra')).toBe('neonTetra');
    });

    it('should default to neonTetra when species is empty, null, or undefined', () => {
      expect(normalizeFishSpecies(null)).toBe('neonTetra');
      expect(normalizeFishSpecies(undefined)).toBe('neonTetra');
      expect(normalizeFishSpecies('')).toBe('neonTetra');
      expect(normalizeFishSpecies('   ')).toBe('neonTetra');
    });

    it('should default to neonTetra when species is unknown or invalid', () => {
      expect(normalizeFishSpecies('alien_fish')).toBe('neonTetra');
      expect(normalizeFishSpecies('dragon')).toBe('neonTetra');
      expect(normalizeFishSpecies('xyz123')).toBe('neonTetra');
    });

    it('should recognize common Indonesian and English aliases', () => {
      expect(normalizeFishSpecies('hiu')).toBe('shark');
      expect(normalizeFishSpecies('paus')).toBe('whale');
      expect(normalizeFishSpecies('penyu')).toBe('turtle');
      expect(normalizeFishSpecies('pari')).toBe('mantaRay');
      expect(normalizeFishSpecies('buntal')).toBe('pufferfish');
      expect(normalizeFishSpecies('manfish')).toBe('angelfish');
      expect(normalizeFishSpecies('tetra')).toBe('neonTetra');
    });
  });

  describe('applySupabaseFishData', () => {
    let mockCatalog: FishCatalogData;

    beforeEach(() => {
      mockCatalog = {
        version: '1.0.0',
        species: [
          {
            id: 'neonTetra',
            name: 'Neon Tetra',
            scientificName: 'Paracheirodon innesi',
            category: 'Schooling',
            description: 'Test tetra',
            defaultNames: ['Tetra1', 'Tetra2'],
          },
          {
            id: 'orca',
            name: 'Paus Orca',
            scientificName: 'Orcinus orca',
            category: 'Oceanic Apex',
            description: 'Test orca',
            defaultNames: ['Pandu', 'Free Willy'],
          },
        ],
        namePool: ['Tetra1', 'Tetra2', 'Pandu', 'Free Willy'],
      };
    });

    it('should assign rows with explicit species to that species and namePool', () => {
      const rows: SupabaseFishRow[] = [
        { id: 1, name: 'Shamu', species: 'orca' },
      ];

      const result = applySupabaseFishData(rows, mockCatalog);
      expect(result.appliedCount).toBe(1);
      expect(result.bySpecies.orca).toBe(1);

      const orcaDef = mockCatalog.species.find((s) => s.id === 'orca');
      expect(orcaDef?.defaultNames).toContain('Shamu');
      expect(orcaDef?.defaultNames[0]).toBe('Shamu'); // prepended for priority
      expect(mockCatalog.namePool).toContain('Shamu');
    });

    it('should default to neonTetra when row has no species specified', () => {
      const rows: SupabaseFishRow[] = [
        { id: 2, name: 'Bintang' }, // no species
        { id: 3, name: 'Cahaya', species: null }, // null species
        { id: 4, name: 'Kilau', species: 'unknown_type' }, // invalid species
      ];

      const result = applySupabaseFishData(rows, mockCatalog);
      expect(result.appliedCount).toBe(3);
      expect(result.bySpecies.neonTetra).toBe(3);

      const tetraDef = mockCatalog.species.find((s) => s.id === 'neonTetra');
      expect(tetraDef?.defaultNames).toContain('Bintang');
      expect(tetraDef?.defaultNames).toContain('Cahaya');
      expect(tetraDef?.defaultNames).toContain('Kilau');
    });

    it('should ignore empty or invalid rows', () => {
      const rows: SupabaseFishRow[] = [
        { id: 5, name: '' },
        { id: 6, name: '   ' },
        // @ts-expect-error testing invalid type
        { id: 7, name: null },
      ];

      const result = applySupabaseFishData(rows, mockCatalog);
      expect(result.appliedCount).toBe(0);
    });
  });

  describe('getFishDataSourceConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should default to local if VITE_FISH_DATA_SOURCE is not set', () => {
      delete process.env.VITE_FISH_DATA_SOURCE;
      const config = getFishDataSourceConfig();
      expect(config.source).toBe('local');
    });

    it('should return supabase when VITE_FISH_DATA_SOURCE is supabase', () => {
      process.env.VITE_FISH_DATA_SOURCE = 'supabase';
      process.env.VITE_SUPABASE_URL = 'https://demo.supabase.co';
      process.env.VITE_SUPABASE_ANON_KEY = 'demo-anon-key';
      process.env.VITE_SUPABASE_FISH_TABLE = 'my_fishes';

      const config = getFishDataSourceConfig();
      expect(config.source).toBe('supabase');
      expect(config.supabaseUrl).toBe('https://demo.supabase.co');
      expect(config.supabaseAnonKey).toBe('demo-anon-key');
      expect(config.tableName).toBe('my_fishes');
    });
  });

  describe('fetchFishFromSupabase', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should successfully fetch and return array of fish records', async () => {
      const mockData = [
        { id: 1, name: 'Keiko', species: 'orca' },
        { id: 2, name: 'Glowy', species: 'neonTetra' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await fetchFishFromSupabase(
        'https://test.supabase.co',
        'test-key',
        'communal_fishes'
      );

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/rest/v1/communal_fishes?select=*',
        expect.objectContaining({
          headers: expect.objectContaining({
            apikey: 'test-key',
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('should throw descriptive error when Supabase responds with HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'relation communal_fishes does not exist',
      } as Response);

      await expect(
        fetchFishFromSupabase('https://test.supabase.co', 'test-key', 'communal_fishes')
      ).rejects.toThrow(/Supabase API error \(404 Not Found\)/);
    });
  });
});
