document.addEventListener('DOMContentLoaded', function () {
    const extractButton = document.getElementById('extractText');
    const summarizeButton = document.getElementById('summarizeText');
    const outputElement = document.getElementById("output");
    const summaryOutput = document.getElementById("summaryOutput");

    // Anfrage zum Abrufen der gespeicherten Abschnitte
    chrome.runtime.sendMessage({ action: 'getTextSections' }, (response) => {
        if (response && response.sections) {
            outputElement.innerHTML = response.sections
                .map(section => `<p>${section}</p>`)
                .join("");
        } else {
            outputElement.innerHTML = "<p>Keine Textabschnitte gefunden.</p>";
        }
    });

    if (extractButton) {
        extractButton.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractText,
                }, (results) => {
                    if (chrome.runtime.lastError) {
                        console.error("Fehler beim Ausführen des Skripts:", chrome.runtime.lastError.message);
                    } else {
                        console.log("Text erfolgreich extrahiert:", results);
                    }
                });
            });
        });
    } else {
        console.error("Button mit der ID 'extractText' nicht gefunden!");
    }

    if (summarizeButton) {
        summarizeButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'summarizeTextSections' }, (response) => {
                if (response && response.summary) {
                    summaryOutput.innerHTML = `<p><strong>Zusammenfassung:</strong> ${response.summary}</p>`;
                } else {
                    summaryOutput.innerHTML = "<p>Fehler beim Zusammenfassen.</p>";
                    console.error("Fehler bei der Zusammenfassung:", response.error);
                }
            });
            return true; // Wichtig für asynchrone Verarbeitung
        });
    } else {
        console.error("Button mit der ID 'summarizeText' nicht gefunden!");
    }
});

// Funktion zum Extrahieren von Text auf der Seite
function extractText() {
    const pageText = document.body.innerText;
    const sections = pageText.split('\n\n');
    console.log("Extrahierte Textabschnitte:", sections);

    // Sende die extrahierten Abschnitte an das Background-Skript
    chrome.runtime.sendMessage({ action: 'saveText', data: sections });
}
