import asyncio
import websockets
import requests
import urllib.request
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import time
import wikipedia

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
        if footer:
            footer.decompose()

        # Extrahiere den gesamten sichtbaren Text
        text = soup.get_text(separator=' ', strip=True)

        # Entferne überflüssige Leerzeichen und Zeilenumbrüche
        clean_text = ' '.join(text.split())

        return clean_text

    def get_page_content(self, url):
        try:
            print(f"Reading URL: {url}")
            with urllib.request.urlopen(url) as fin:
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

    def scrape_page(self, url):
        with open("scraped_content.txt", 'w') as file:
            file.truncate(0)  # Löscht den gesamten Inhalt der Datei

        urls = self.get_wikipedia_urls("Websockets")
        scraped_data = ""

        for u in urls:
            self.save_to_file("scraped_content.txt", self.get_page_content(u))

    def save_to_file(self, filename, data):
        with open(filename, 'a', encoding='utf-8') as f:
            f.write(data + '\n')


async def handler(websocket):
    scraper = WebScraper(base_url="https://de.wikipedia.org")

    async for message in websocket:
        print(f"Nachricht erhalten: {message}")
        search_url = ("https://de.wikipedia.org/w/index.php?search="
                      f"{'+'.join(message.split())}&title=Spezial%3ASuche&profile=advanced&fulltext=1")

        scraper.scrape_page(search_url)

        response = f"Scraping completed for query: {message}. Content saved to scraped_content.txt"
        await websocket.send(response)


async def main():
    server = await websockets.serve(handler, "localhost", 6789)
    print("WebSocket-Server läuft auf ws://localhost:6789")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
