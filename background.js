console.log("background.js wird geladen...");

chrome.runtime.onInstalled.addListener(() => {
    // API-Schlüssel beim Installieren setzen
    chrome.storage.local.set({ openai_api_key: "" }); //API Key einfügen
});

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

            // Prompt aus Datei laden
            fetch(chrome.runtime.getURL("prompt.txt"))
                .then(response => response.text())
                .then(prompt => {
                    // API-Aufruf mit fetch
                    fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${openai_api_key}`
                        },
                        body: JSON.stringify({
                            model: "gpt-4",
                            messages: [
                                { role: "system", content: prompt },
                                { role: "user", content: textToSummarize }
                            ],
                            temperature: 0.5,
                            max_tokens: 1000
                        })
                    })
                        .then(response => response.json())
                        .then(data => {
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                chrome.scripting.executeScript(
                                    { target: { tabId: tabs[0].id }, files: ["content.js"] },
                                    () => {
                                        chrome.tabs.sendMessage(tabs[0].id, { action: "displaySummary", summary: data.choices[0].message.content });
                                    }
                                );
                            });

                            console.log("API-Antwort vollständig:", JSON.stringify(data, null, 2)); // Ausgabe der vollständigen API-Antwort in der Konsole

                            // Überprüfen, ob die Antwort gültig ist
                            if (data.choices && data.choices[0] && data.choices[0].message) {
                                sendResponse({ summary: data.choices[0].message.content.trim() });
                            } else {
                                sendResponse({ error: "Ungültige API-Antwort" });
                            }
                        })
                        .catch(error => {
                            console.error("Fehler bei der OpenAI-API:", error);
                            sendResponse({ error: error.message });
                        });
                })
                .catch(error => {
                    console.error("Fehler beim Laden des Prompts:", error);
                    sendResponse({ error: "Prompt konnte nicht geladen werden." });
                });

            return true;
        });

        return true;
    }
});
