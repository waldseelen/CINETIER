/**
 * Environment Variables Validator
 * API anahtarlarını kontrol eder ve eksik olanları loglar
 */

interface EnvConfig {
    name: string;
    key: string;
    required: boolean;
    description: string;
}

const ENV_CONFIGS: EnvConfig[] = [
    {
        name: "Supabase URL",
        key: "NEXT_PUBLIC_SUPABASE_URL",
        required: true,
        description: "Supabase project URL - https://supabase.com"
    },
    {
        name: "Supabase Anon Key",
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        required: true,
        description: "Supabase anon/public key"
    },
    {
        name: "Supabase Service Role Key",
        key: "SUPABASE_SERVICE_ROLE_KEY",
        required: true,
        description: "Supabase service role key (admin)"
    },
    {
        name: "TMDB Access Token",
        key: "TMDB_ACCESS_TOKEN",
        required: false,
        description: "TMDB API access token - https://www.themoviedb.org/settings/api (Demo mode aktif)"
    },
    {
        name: "TMDB API Key",
        key: "TMDB_API_KEY",
        required: false,
        description: "TMDB API key (alternatif)"
    },
    {
        name: "Upstash Redis URL",
        key: "UPSTASH_REDIS_REST_URL",
        required: false,
        description: "Rate limiting için Upstash Redis - https://upstash.com (İsteğe bağlı)"
    },
    {
        name: "Upstash Redis Token",
        key: "UPSTASH_REDIS_REST_TOKEN",
        required: false,
        description: "Rate limiting için Upstash Redis token"
    },
    {
        name: "OMDB API Key",
        key: "OMDB_API_KEY",
        required: false,
        description: "OMDB API key - https://www.omdbapi.com/apikey.aspx (İsteğe bağlı)"
    }
];

export function validateEnvironment() {
    const missingRequired: string[] = [];
    const missingOptional: string[] = [];
    const warnings: string[] = [];

    console.log("\n🔍 Environment Variables Kontrolü:");
    console.log("═".repeat(60));

    ENV_CONFIGS.forEach(config => {
        const value = process.env[config.key];
        const hasValue = value && value !== "" && !value.includes("your_");

        if (!hasValue) {
            if (config.required) {
                missingRequired.push(config.name);
                console.error(`❌ ${config.name}: EKSİK (ZORUNLU)`);
                console.error(`   → ${config.description}`);
                console.error(`   → Değişken: ${config.key}\n`);
            } else {
                missingOptional.push(config.name);
                console.warn(`⚠️  ${config.name}: Eksik (İsteğe bağlı)`);
                console.warn(`   → ${config.description}`);
                console.warn(`   → Değişken: ${config.key}\n`);
            }
        } else {
            const maskedValue = value.substring(0, 8) + "..." + value.substring(value.length - 4);
            console.log(`✅ ${config.name}: ${maskedValue}`);
        }
    });

    console.log("═".repeat(60));

    // Supabase kontrolü
    const hasSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your_");

    if (!hasSupabase) {
        warnings.push("Supabase ayarları eksik - Veritabanı özellikleri çalışmayacak");
    }

    // TMDB kontrolü
    const hasTMDB =
        (process.env.TMDB_ACCESS_TOKEN && !process.env.TMDB_ACCESS_TOKEN.includes("your_")) ||
        (process.env.TMDB_API_KEY && !process.env.TMDB_API_KEY.includes("your_"));

    if (!hasTMDB) {
        warnings.push("TMDB API key eksik - Demo modda çalışıyor (sınırlı içerik)");
    }

    // Rate limiting kontrolü
    const hasRedis =
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN &&
        !process.env.UPSTASH_REDIS_REST_URL.includes("your_");

    if (!hasRedis) {
        warnings.push("Redis ayarları eksik - Rate limiting aktif değil");
    }

    if (warnings.length > 0) {
        console.log("\n📋 Uyarılar:");
        warnings.forEach(warning => console.warn(`   ⚠️  ${warning}`));
    }

    if (missingRequired.length > 0) {
        console.error("\n❌ HATA: Zorunlu environment değişkenleri eksik!");
        console.error("Lütfen .env dosyasını oluşturun ve gerekli değerleri ekleyin.\n");
        console.error("Örnek için .env.example dosyasına bakın.\n");
    }

    if (missingRequired.length === 0 && missingOptional.length === 0) {
        console.log("\n✅ Tüm environment değişkenleri ayarlanmış!\n");
    }

    console.log("═".repeat(60) + "\n");

    return {
        isValid: missingRequired.length === 0,
        missingRequired,
        missingOptional,
        warnings
    };
}
