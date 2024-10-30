

document.addEventListener('DOMContentLoaded', function () {
    const summaryOutput = document.getElementById("summaryOutput");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: extractText,
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error("Fehler beim Ausführen des Skripts:", chrome.runtime.lastError.message);
            } else {
                console.log("Text erfolgreich extrahiert:", results);

                // Nachricht an background.js mit dem extrahierten Text
                chrome.runtime.sendMessage({ action: 'summarizeTextSections', data: { sections: results[0].result } }, (response) => {
                    if (response && response.summary) {
                        summaryOutput.innerHTML = `<p><strong>Zusammenfassung:</strong> ${response.summary}</p>`;
                    } else {
                        const errorMsg = response?.error || "Unbekannter Fehler";
                        summaryOutput.innerHTML = `<p>Fehler beim Zusammenfassen: ${errorMsg}</p>`;
                        console.error("Fehler bei der Zusammenfassung:", errorMsg);
                    }
                });
            }
        });
    });
});

// Funktion zum Extrahieren von Text auf der Seite
function extractText() {
    const pageText = document.body.innerText;
    const sections = pageText.split('\n\n');
    console.log("Extrahierte Textabschnitte:", sections);
    return sections;
}
