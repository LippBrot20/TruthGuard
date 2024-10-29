// openai.js
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function summarizeText(text) {
    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003", // You can use other models depending on your requirements
            prompt: `Summarize the following text into key points:\n\n${text}`,
            temperature: 0.5,
            max_tokens: 150,
        });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("Error with OpenAI API:", error);
        throw error;
    }
}

module.exports = { summarizeText };
