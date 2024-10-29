chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveText') {
        const jsonData = JSON.stringify(request.data, null, 2);

        // JSON-Datei speichern (alternativ in einem Storage-Objekt oder in der Konsole anzeigen)
        console.log("Text sections saved: ", jsonData);
        // Weitere Verarbeitung wie Speichern in der lokalen Datei oder Storage API
    }
});
