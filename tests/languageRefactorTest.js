const axios = require('axios');

const API_URL = 'http://localhost:3000/api'; // Adjust port if needed

async function testLanguageRefactor() {
    try {
        console.log('--- Testing Language Refactor ---');

        // 1. Test Get Available Languages
        console.log('\n1. Testing GET /auth/available-languages...');
        try {
            const response = await axios.get(`${API_URL}/auth/available-languages`);
            if (response.data.success && Array.isArray(response.data.languages)) {
                console.log('✅ Success: Retrieved languages list.');
                console.log(`   Count: ${response.data.languages.length}`);
                console.log(`   First item: ${JSON.stringify(response.data.languages[0])}`);
            } else {
                console.error('❌ Failed: Invalid response structure.');
            }
        } catch (error) {
            console.error('❌ Failed to get languages:', error.message);
        }

        // Note: To test authenticated routes (completeProfile, createMoment), we would need a valid token.
        // For this quick verification, we are primarily checking the new public endpoint and code integrity.
        // The validation logic in controllers was reviewed during implementation.

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

testLanguageRefactor();
