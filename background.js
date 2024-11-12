console.log("background.js wird geladen...");

chrome.runtime.onInstalled.addListener(() => {
    // API-Schlüssel beim Installieren setzen
    chrome.storage.local.set({ openai_api_key: "DEIN API KEY HIER" }); //API Key einfügen
});

// API-Zugriff durch chrome.runtime.onMessage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Nachricht erhalten im background.js:", message);

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
            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openai_api_key}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "Fasse den folgenden Text in genau fünf prägnanten Kernsätzen zusammen." +
                                " Stelle sicher, dass alle wichtigen Informationen in diesen Sätzen enthalten sind, und vermeide " +
                                "zusätzliche Details oder Erklärungen, die über den Kerninhalt hinausgehen." },
                        { role: "user", content: textToSummarize }
                    ],
                    temperature: 0.5,
                    max_tokens: 150
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log("API-Antwort:", data); // Ausgabe der vollständigen API-Antwort in der Konsole

                    // Überprüfen, ob die Antwort gültig ist
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        sendResponse({ summary: data.choices[0].message.content });
                    } else {
                        sendResponse({ error: "Ungültige API-Antwort" });
                    }
                })
                .catch(error => {
                    console.error("Fehler bei der OpenAI-API:", error);
                    sendResponse({ error: error.message });
                });


            return true; // Asynchrone Antwort
        });

        return true;
    }
});
