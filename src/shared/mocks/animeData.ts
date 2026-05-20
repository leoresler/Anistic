export type AnimeStatus = 'airing' | 'completed' | 'plan' | 'dropped' | 'movie';

export type Anime = {
  id: number;
  title: string;
  studio: string;
  year: number;
  episodes: number;
  score: number;
  status: AnimeStatus;
  genres: string[];
  accentColor: string;
};

export const animeData: Anime[] = [
  { id: 1, title: 'Crimson Orbit', studio: 'Studio Nagi', year: 2026, episodes: 12, score: 8.7, status: 'airing', genres: ['Sci-Fi', 'Action'], accentColor: '#7A4F35' },
  { id: 2, title: 'Paper Moon Requiem', studio: 'Glass Finch', year: 2025, episodes: 24, score: 9.1, status: 'completed', genres: ['Drama', 'Mystery'], accentColor: '#C59A67' },
  { id: 3, title: 'Quiet Harbor', studio: 'Low Tide', year: 2024, episodes: 10, score: 8.1, status: 'plan', genres: ['Slice of Life', 'Romance'], accentColor: '#A9784F' },
  { id: 4, title: 'Neon Koi', studio: 'Blue Current', year: 2026, episodes: 13, score: 8.3, status: 'airing', genres: ['Fantasy', 'Adventure'], accentColor: '#B86F3F' },
  { id: 5, title: 'Last Lantern', studio: 'Boreal Ink', year: 2023, episodes: 26, score: 7.9, status: 'completed', genres: ['Thriller', 'Supernatural'], accentColor: '#D6B47B' },
  { id: 6, title: 'Velvet Static', studio: 'Antenna Works', year: 2025, episodes: 8, score: 7.4, status: 'dropped', genres: ['Music', 'Drama'], accentColor: '#B78368' },
  { id: 7, title: 'Garden of Cinders', studio: 'Aster House', year: 2022, episodes: 1, score: 8.9, status: 'movie', genres: ['Fantasy', 'Drama'], accentColor: '#7A4F35' },
  { id: 8, title: 'Metro Bloom', studio: 'Trackline', year: 2026, episodes: 12, score: 8.4, status: 'airing', genres: ['Action', 'Urban'], accentColor: '#C59A67' },
  { id: 9, title: 'Snow Atlas', studio: 'North Frame', year: 2021, episodes: 22, score: 8.0, status: 'completed', genres: ['Adventure', 'Historical'], accentColor: '#A9784F' },
  { id: 10, title: 'Bloom Protocol', studio: 'Signal Pine', year: 2026, episodes: 11, score: 8.6, status: 'plan', genres: ['Sci-Fi', 'Psychological'], accentColor: '#B86F3F' },
  { id: 11, title: 'Auburn Tides', studio: 'Moss Loop', year: 2024, episodes: 16, score: 7.8, status: 'completed', genres: ['Romance', 'Drama'], accentColor: '#D6B47B' },
  { id: 12, title: 'Chrome Shrine', studio: 'Kitsune Volt', year: 2023, episodes: 14, score: 8.2, status: 'movie', genres: ['Action', 'Mecha'], accentColor: '#B78368' },
  { id: 13, title: 'Honey Eclipse', studio: 'Gilded Summer', year: 2025, episodes: 20, score: 7.7, status: 'dropped', genres: ['Comedy', 'School'], accentColor: '#7A4F35' },
  { id: 14, title: 'Ivory District', studio: 'Porcelain Fox', year: 2026, episodes: 12, score: 8.5, status: 'airing', genres: ['Mystery', 'Noir'], accentColor: '#C59A67' },
];

export const featuredAnime = animeData[0];
export const detailFallbackAnime = animeData[1];
export const relatedAnime = animeData.slice(2, 6);
export const myListAnime = animeData.slice(0, 8);
