require('dotenv').config();
const axios = require('axios');

async function testHuggingFaceAPI() {
    try {
        console.log('Testing Hugging Face API connection...');
        
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/google/flan-t5-base',
            {
                inputs: 'Rewrite this text in a professional style: hello there',
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Success! API Response:', response.data);
    } catch (error) {
        console.error('Error testing Hugging Face API:', error.message);
        if (error.response) {
            console.error('API Error Details:', error.response.data);
        }
    }
}

testHuggingFaceAPI(); 