console.log("background.js wird geladen...");

chrome.runtime.onInstalled.addListener(() => {
    // API-Schlüssel beim Installieren setzen
    chrome.storage.local.set({ openai_api_key: "YOUR_API_KEY" }); //API Key einfügen
});

// API-Zugriff durch chrome.runtime.onMessage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'summarizeTextSections') {
        // Laden des API-Schlüssels aus dem Speicher
        chrome.storage.local.get("openai_api_key", ({ openai_api_key }) => {
            if (!openai_api_key) {
                console.error("API-Schlüssel nicht gefunden.");
                sendResponse({ error: "API-Schlüssel fehlt." });
                return;
            }

            const textToSummarize = message.data.sections.join('\n\n');

            // API-Aufruf mit fetch
            fetch("https://api.openai.com/v1/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openai_api_key}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    prompt: `Fasse den folgenden Text in Kernaussagen zusammen:\n\n${textToSummarize}`,
                    temperature: 0.5,
                    max_tokens: 150
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log("API-Antwort:", data);
                    sendResponse({ summary: data });
                })
                .catch(error => {
                    console.error("Fehler bei der OpenAI-API:", error);
                    sendResponse({ error: error.message });
                });

            return true; // Asynchrone Antwort
        });
    }
});
