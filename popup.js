document.getElementById("actionButton").addEventListener("click", function() {
    alert("Button wurde geklickt!");
});

document.addEventListener('DOMContentLoaded', function () {
    const extractButton = document.getElementById('extractText');
    if (extractButton) {
        extractButton.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractText // Funktion wird auf der aktiven Seite ausgeführt
                });
            });
        });
    } else {
        console.error("Button mit der ID 'extractText' nicht gefunden!");
    }
});

function extractText() {
    const pageText = document.body.innerText;
    const sections = pageText.split('\n\n');
    console.log("Extrahierte Textabschnitte:", sections);
}
