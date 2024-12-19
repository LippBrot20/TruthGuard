document.addEventListener('DOMContentLoaded', function () {
    const analyzeButton = document.getElementById("analyzeText");
    const summaryOutput = document.getElementById("summaryOutput");

    analyzeButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Extrahiere Text aus der aktiven Seite
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: extractText,
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error("Fehler beim Extrahieren:", chrome.runtime.lastError.message);
                    summaryOutput.textContent = "Fehler beim Extrahieren des Textes.";
                } else {
                    const extractedSections = results[0].result;
                    console.log("Extrahierte Abschnitte:", extractedSections);

                    // Sende die extrahierten Abschnitte an die API
                    chrome.runtime.sendMessage(
                        { action: 'summarizeTextSections', data: { sections: extractedSections } },
                        (response) => {
                            if (response && response.summary) {
                                summaryOutput.textContent = response.summary;

                                // Ausgabe der API-Antwort in der Browser-Konsole
                                console.log("Zusammenfassung (API-Antwort):", response.summary);
                            } else {
                                const errorMsg = response?.error || "keine API Antwort bekommen";
                                summaryOutput.textContent = `Fehler: ${errorMsg}`;
                                console.error("Fehler bei der Zusammenfassung:", errorMsg);
                            }
                        }
                    );
                }
            });
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
