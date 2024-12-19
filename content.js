// Content Script
const pageText = document.body.innerText;

// Text in Abschnitte unterteilen (z.B. nach Absätzen)
const sections = pageText.split('\n\n'); // Absätze als Trennkriterium

// JSON erstellen
const textData = {
    sections: sections
};

// Textabschnitte in der Konsole ausgeben
//console.log("Extrahierte Textabschnitte:", sections);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'summarizeTextSections') {
        const pageText = document.body.innerText;
        const sections = pageText.split('\n\n');

        console.log("Extrahierte Textabschnitte (Content-Script):", sections);

        sendResponse({ sections }); // Sende die Abschnitte zurück
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'displaySummary') {
        console.log("API-Zusammenfassung (Content-Script):", message.summary);
    }
});



// JSON an den Background-Skript senden
//chrome.runtime.sendMessage({ action: 'summarizeTextSections', data: textData });
