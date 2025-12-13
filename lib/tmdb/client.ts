const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Image sizes
export const POSTER_SIZES = {
    small: "w185",
    medium: "w342",
    large: "w500",
    original: "original",
} as const;

export const BACKDROP_SIZES = {
    small: "w300",
    medium: "w780",
    large: "w1280",
    original: "original",
} as const;

export type PosterSize = keyof typeof POSTER_SIZES;
export type BackdropSize = keyof typeof BACKDROP_SIZES;

// Helper to build image URLs
export function getPosterUrl(path: string | null, size: PosterSize = "medium"): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${POSTER_SIZES[size]}${path}`;
}

export function getBackdropUrl(path: string | null, size: BackdropSize = "large"): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${BACKDROP_SIZES[size]}${path}`;
}

// TMDB API client
class TMDBClient {
    private apiKey: string;
    private accessToken: string;

    constructor() {
        this.apiKey = process.env.TMDB_API_KEY || "";
        this.accessToken = process.env.TMDB_ACCESS_TOKEN || "";
    }

    private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${TMDB_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
                ...options?.headers,
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Search
    async searchMulti(query: string, page = 1) {
        return this.fetch<TMDBSearchResponse>(
            `/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`
        );
    }

    async searchMovies(query: string, page = 1) {
        return this.fetch<TMDBMovieSearchResponse>(
            `/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`
        );
    }

    async searchTV(query: string, page = 1) {
        return this.fetch<TMDBTVSearchResponse>(
            `/search/tv?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`
        );
    }

    // Details
    async getMovie(id: number) {
        return this.fetch<TMDBMovieDetails>(
            `/movie/${id}?language=tr-TR&append_to_response=credits,videos,keywords,recommendations`
        );
    }

    async getTV(id: number) {
        return this.fetch<TMDBTVDetails>(
            `/tv/${id}?language=tr-TR&append_to_response=credits,videos,keywords,recommendations`
        );
    }

    // Trending
    async getTrendingMovies(timeWindow: "day" | "week" = "week", page = 1) {
        return this.fetch<TMDBMovieSearchResponse>(
            `/trending/movie/${timeWindow}?page=${page}&language=tr-TR`
        );
    }

    async getTrendingTV(timeWindow: "day" | "week" = "week", page = 1) {
        return this.fetch<TMDBTVSearchResponse>(
            `/trending/tv/${timeWindow}?page=${page}&language=tr-TR`
        );
    }

    async getTrendingAll(timeWindow: "day" | "week" = "week", page = 1) {
        return this.fetch<TMDBSearchResponse>(
            `/trending/all/${timeWindow}?page=${page}&language=tr-TR`
        );
    }

    // Discover
    async discoverMovies(params: DiscoverParams = {}) {
        const searchParams = new URLSearchParams({
            language: "tr-TR",
            page: String(params.page || 1),
            sort_by: params.sortBy || "popularity.desc",
        });

        if (params.genres) searchParams.set("with_genres", params.genres.join(","));
        if (params.year) searchParams.set("primary_release_year", String(params.year));

        return this.fetch<TMDBMovieSearchResponse>(`/discover/movie?${searchParams}`);
    }

    async discoverTV(params: DiscoverParams = {}) {
        const searchParams = new URLSearchParams({
            language: "tr-TR",
            page: String(params.page || 1),
            sort_by: params.sortBy || "popularity.desc",
        });

        if (params.genres) searchParams.set("with_genres", params.genres.join(","));
        if (params.year) searchParams.set("first_air_date_year", String(params.year));

        return this.fetch<TMDBTVSearchResponse>(`/discover/tv?${searchParams}`);
    }

    // Genres
    async getMovieGenres() {
        return this.fetch<{ genres: TMDBGenre[] }>(`/genre/movie/list?language=tr-TR`);
    }

    async getTVGenres() {
        return this.fetch<{ genres: TMDBGenre[] }>(`/genre/tv/list?language=tr-TR`);
    }
}

// Types
export interface TMDBGenre {
    id: number;
    name: string;
}

export interface TMDBMovie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    media_type?: "movie";
}

export interface TMDBTV {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    origin_country: string[];
    media_type?: "tv";
}

export interface TMDBPerson {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
    media_type: "person";
}

export interface TMDBSearchResponse {
    page: number;
    total_pages: number;
    total_results: number;
    results: (TMDBMovie | TMDBTV | TMDBPerson)[];
}

export interface TMDBMovieSearchResponse {
    page: number;
    total_pages: number;
    total_results: number;
    results: TMDBMovie[];
}

export interface TMDBTVSearchResponse {
    page: number;
    total_pages: number;
    total_results: number;
    results: TMDBTV[];
}

export interface TMDBMovieDetails extends TMDBMovie {
    genres: TMDBGenre[];
    runtime: number;
    budget: number;
    revenue: number;
    tagline: string;
    status: string;
    imdb_id: string;
    credits: {
        cast: TMDBCast[];
        crew: TMDBCrew[];
    };
    videos: { results: TMDBVideo[] };
    keywords: { keywords: TMDBKeyword[] };
    recommendations: TMDBMovieSearchResponse;
}

export interface TMDBTVDetails extends TMDBTV {
    genres: TMDBGenre[];
    episode_run_time: number[];
    number_of_episodes: number;
    number_of_seasons: number;
    status: string;
    tagline: string;
    credits: {
        cast: TMDBCast[];
        crew: TMDBCrew[];
    };
    videos: { results: TMDBVideo[] };
    keywords: { results: TMDBKeyword[] };
    recommendations: TMDBTVSearchResponse;
}

export interface TMDBCast {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface TMDBCrew {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface TMDBVideo {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
}

export interface TMDBKeyword {
    id: number;
    name: string;
}

interface DiscoverParams {
    page?: number;
    sortBy?: string;
    genres?: number[];
    year?: number;
}

// Export singleton
export const tmdb = new TMDBClient();
