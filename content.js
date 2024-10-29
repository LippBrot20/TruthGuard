// Content Script
const pageText = document.body.innerText;

// Text in Abschnitte unterteilen (z.B. nach Absätzen)
const sections = pageText.split('\n\n'); // Absätze als Trennkriterium

// JSON erstellen
const textData = {
    sections: sections
};

// Textabschnitte in der Konsole ausgeben
console.log("Extrahierte Textabschnitte:", sections);

// JSON an den Background-Skript senden
chrome.runtime.sendMessage({ action: 'saveText', data: textData });
