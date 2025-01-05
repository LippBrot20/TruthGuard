import asyncio
import websockets
import urllib.request
from bs4 import BeautifulSoup
import wikipedia
from urllib.parse import quote

import nltk
from nltk.corpus import stopwords
import string
from unidecode import unidecode

nltk.download('stopwords')


class DataCleaner:
    def __init__(self):
        # Deutsche Stopwörter laden
        self.german_stopwords = set(stopwords.words('german'))

        # Stopwort "nicht" und andere spezifizierte Wörter entfernen
        for word in ["nicht", "kein", "keine", "keiner"]:
            if word in self.german_stopwords:
                self.german_stopwords.remove(word)

        # Umlaute in den Stopwörtern ersetzen
        self.german_stopwords = {self.replace_umlauts(word) for word in self.german_stopwords}

    def replace_umlauts(self, word):
        umlaut_mapping = {
            'ä': 'ae', 'Ä': 'Ae',
            'ö': 'oe', 'Ö': 'Oe',
            'ü': 'ue', 'Ü': 'Ue',
            'ß': 'ss'
        }
        for umlaut, replacement in umlaut_mapping.items():
            word = word.replace(umlaut, replacement)
        return word

    def clean_text(self, text):
        # Sonderzeichen entfernen und Umlaute umwandeln
        text = self.replace_umlauts(text)
        text = unidecode(text)

        # Punktuation entfernen
        text = text.translate(str.maketrans('', '', string.punctuation))

        # Text in Wörter splitten
        words = text.split()

        # Stopwörter entfernen
        filtered_words = [word for word in words if self.replace_umlauts(word.lower()) not in self.german_stopwords]

        # Bereinigten Text zurückgeben
        return ' '.join(filtered_words)

class WebScraper:
    def __init__(self, base_url):
        self.base_url = base_url
        self.allowed_domains = {
            'wikipedia.org'
        }
        self.visited_urls = set()
        self.request_delay = 1

    def parse_html(self, html):
        soup = BeautifulSoup(html, 'html.parser')

        footer = soup.find('footer')
        header = soup.find('head')
        if footer:
            footer.decompose()
        if header:
            header.decompose()

        text = soup.get_text(separator=' ', strip=True)
        clean_text = ' '.join(text.split())

        return clean_text

    def get_page_content(self, url):
        try:
            print(f"Reading URL: {url}")
            encoded_url = quote(url, safe=":/")
            with urllib.request.urlopen(encoded_url) as fin:
                html = fin.read().decode("utf-8")

                text = self.parse_html(html)

                return text
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    def get_wikipedia_urls(self, query, max_results=4):
        wikipedia.set_lang("de")

        try:
            search_results = wikipedia.search(query, results=max_results)

            urls = [f"https://de.wikipedia.org/wiki/{result.replace(' ', '_')}" for result in search_results]
            return urls
        except Exception as e:
            print(f"Wikipedia Fehler: {e}")
            return []

    def save_to_file(self, filename, data):
        with open(filename, 'a', encoding='utf-8') as f:
            f.write(data + '\n')


async def handler(websocket):
    scraper = WebScraper(base_url="https://de.wikipedia.org")
    cleaner = DataCleaner()

    async for message in websocket:
        print(f"Nachricht erhalten: {message}")
        # search_url = ("https://de.wikipedia.org/w/index.php?search="
        #               f"{'+'.join(message.split())}&title=Spezial%3ASuche&profile=advanced&fulltext=1")

        with open("scraped_content.txt", 'w') as file:
            file.truncate(0)  # Löscht den gesamten Inhalt der Datei

        clean_message = cleaner.clean_text(message)
        print(f"Clean Message: {clean_message}")

        urls = scraper.get_wikipedia_urls(clean_message)

        for u in urls:
            scraper.save_to_file("scraped_content.txt", scraper.get_page_content(u))

        response = f"Scraping completed for query: {message}. Content saved to scraped_content.txt"
        await websocket.send(response)


async def main():
    server = await websockets.serve(handler, "localhost", 6789)
    print("WebSocket-Server läuft auf ws://localhost:6789")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
