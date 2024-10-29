let savedTextSections = [];
const { Configuration, OpenAIApi } = require("openai");

// Speicher den API-Schlüssel bei der Installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ "openai_api_key": "" }, () => {
        console.log("API-Schlüssel wurde in chrome.storage.local gespeichert.");
    });
});

chrome.storage.local.get("openai_api_key", ({ openai_api_key }) => {
    if (!openai_api_key) {
        console.error("API-Schlüssel nicht gefunden");
        return;
    }

    const configuration = new Configuration({
        apiKey: openai_api_key,
    });
    const openai = new OpenAIApi(configuration);

    // Chrome message listener für Anfragen
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'saveText') {
            savedTextSections = message.data;
            console.log("Textabschnitte im Background Script gespeichert:", savedTextSections);
        } else if (message.action === 'getTextSections') {
            sendResponse({ sections: savedTextSections });
        } else if (message.action === 'summarizeTextSections') {
            summarizeTextSections(savedTextSections, openai)
                .then(summary => sendResponse({ summary }))
                .catch(error => {
                    console.error("Error summarizing text sections:", error);
                    sendResponse({ error: "Fehler beim Zusammenfassen" });
                });
            return true; // Zeigt an, dass die Antwort asynchron gesendet wird
        }
    });

    async function summarizeTextSections(sections, openai) {
        const textToSummarize = sections.join('\n\n');
        try {
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Fasse den folgenden Text in Kernaussagen zusammen:\n\n${textToSummarize}`,
                temperature: 0.5,
                max_tokens: 150,
            });
            return response.data.choices[0].text.trim();
        } catch (error) {
            console.error("OpenAI API Fehler:", error);
            throw error;
        }
    }
});
