require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3001;

// Text transformation functions
function transformProfessional(text) {
    return text
        .replace(/(\w+)/g, word => {
            if (word.length > 3) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            return word;
        })
        .replace(/(!|\?)+/g, '.');
}

function transformCasual(text) {
    return text
        .replace(/\./g, '...')
        .replace(/!+/g, '!')
        .toLowerCase();
}

function transformFormal(text) {
    return text
        .split('. ')
        .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
        .join('. ');
}

function transformCreative(text) {
    return text
        .split(' ')
        .map((word, i) => i % 2 === 0 ? word.toUpperCase() : word.toLowerCase())
        .join(' ');
}

function transformConcise(text) {
    return text
        .replace(/\b(very|really|quite|basically|actually|literally)\b\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function transformDetailed(text) {
    return text
        .split('. ')
        .map(sentence => sentence + ' Indeed.')
        .join('. ');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Text rewriting endpoint
app.post('/rewrite', async (req, res) => {
    try {
        const { text, style } = req.body;
        let rewrittenText = text;

        switch (style) {
            case 'professional':
                rewrittenText = transformProfessional(text);
                break;
            case 'casual':
                rewrittenText = transformCasual(text);
                break;
            case 'formal':
                rewrittenText = transformFormal(text);
                break;
            case 'creative':
                rewrittenText = transformCreative(text);
                break;
            case 'concise':
                rewrittenText = transformConcise(text);
                break;
            case 'detailed':
                rewrittenText = transformDetailed(text);
                break;
        }
        
        res.json({ rewrittenText });
    } catch (error) {
        console.error('Error rewriting text:', error);
        res.status(500).json({ error: 'Failed to rewrite text' });
    }
});

// Hugging Face rewrite endpoint
app.post('/api/rewrite', async (req, res) => {
    try {
        const { text, style } = req.body;
        
        // Validate input
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/google/flan-t5-base',
            {
                inputs: `Rewrite this text in ${style || 'a better'} style: ${text}`,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const rewrittenText = response.data[0]?.generated_text || text;
        res.json({ rewrittenText });
    } catch (error) {
        console.error('Error in rewrite:', error.message);
        res.status(500).json({ error: 'Failed to rewrite text', details: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Text Rewriting Service is running on http://localhost:${port}`);
}); 