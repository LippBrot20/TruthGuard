document.addEventListener('DOMContentLoaded', function () {
    const analyzeButton = document.getElementById("analyzeText");
    const summaryOutput = document.getElementById("summaryOutput");
    const closeButton = document.getElementById("closePopup");

    analyzeButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: extractSelectedText,
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error("Fehler beim Extrahieren:", chrome.runtime.lastError.message);
                    summaryOutput.textContent = "Fehler beim Extrahieren des Textes.";
                } else {
                    const selectedText = results[0].result;
                    console.log("Extrahierter markierter Text:", selectedText);

                    if (!selectedText || selectedText.trim() === "") {
                        summaryOutput.textContent = "Bitte markiere Text, um ihn zu analysieren.";
                        return;
                    }

                    chrome.runtime.sendMessage(
                        { action: 'summarizeText', data: { text: selectedText } },
                        (response) => {
                            if (response && response.summary) {
                                summaryOutput.textContent = response.summary;
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

    closeButton.addEventListener("click", function () {
        window.close();
    });
});

function extractSelectedText() {
    const selectedText = window.getSelection().toString();
    console.log("Markierter Text:", selectedText);
    return selectedText;
}
