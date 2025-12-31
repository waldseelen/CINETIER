/**
 * Environment Checker Script
 * Kullanım: node scripts/check-env.js
 */

// ES Module import için wrapper
async function checkEnv() {
    try {
        const { validateEnvironment } = await import('../lib/env-validator.js');
        const result = validateEnvironment();

        if (!result.isValid) {
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Environment kontrolü başarısız:', error.message);
        process.exit(1);
    }
}

checkEnv();
