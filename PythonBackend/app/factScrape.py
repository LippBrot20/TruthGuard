import asyncio
import websockets
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import time

class WebScraper:
    def __init__(self, base_url):
        self.base_url = base_url
        self.allowed_domains = {
            'wikipedia.org'
        }
        self.visited_urls = set()
        self.text_content = []
        self.request_delay = 1

    def get_page_content(self, url):
        try:
            print(f"Loading URL: {url}")
            response = requests.get(url)
            response.raise_for_status()
            time.sleep(self.request_delay)
            return response.text
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    def extract_links(self, soup, current_url):
        links = set()
        for anchor in soup.find_all('a', href=True):
            href = anchor['href']
            absolute_url = urljoin(current_url, href)

            if urlparse(absolute_url).netloc.endswith("wikipedia.org"):
                links.add(absolute_url)
        return list(links)[:4]  # Limit to the first 4 subpages

    def extract_text(self, soup):
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()

        text = soup.get_text()
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = ' '.join(lines)
        sentences = re.split('[.!?]+(?=(?:[A-Z][^.]|$))', text)
        return [s.strip() for s in sentences if s.strip() and len(s.split()) > 3]

    def scrape_page(self, url):
        if url in self.visited_urls:
            return

        print(f"Scraping: {url}")
        self.visited_urls.add(url)
        content = self.get_page_content(url)

        if not content:
            return

        soup = BeautifulSoup(content, 'html.parser')
        sentences = self.extract_text(soup)
        self.text_content.extend(sentences)

        links = self.extract_links(soup, url)
        for link in links:
            if link not in self.visited_urls:
                self.scrape_page(link)

    def save_to_file(self, filename):
        with open(filename, 'w', encoding='utf-8') as f:
            for sentence in self.text_content:
                f.write(sentence + '\n')

async def handler(websocket):
    scraper = WebScraper(base_url="https://de.wikipedia.org")

    async for message in websocket:
        print(f"Nachricht erhalten: {message}")
        search_url = ("https://de.wikipedia.org/w/index.php?search="
                      f"{'+'.join(message.split())}&title=Spezial%3ASuche&profile=advanced&fulltext=1")

        scraper.text_content = []  # Reset content for a new scrape
        scraper.scrape_page(search_url)
        scraper.save_to_file("scraped_content.txt")

        response = f"Scraping completed for query: {message}. Content saved to scraped_content.txt"
        await websocket.send(response)

async def main():
    server = await websockets.serve(handler, "localhost", 6789)
    print("WebSocket-Server läuft auf ws://localhost:6789")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())