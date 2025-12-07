import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());
app.use(express.static("public"));

let browser;
const tabs = {}; // { tabId: { page, url, history: [], historyIndex } }

async function launchBrowser() {
  if (!browser) browser = await puppeteer.launch({ headless: true });
}
launchBrowser();

// New tab
app.get("/new-tab", async (req, res) => {
  await launchBrowser();
  const page = await browser.newPage();
  const tabId = Date.now().toString();
  tabs[tabId] = { page, url: null, history: [], historyIndex: -1 };
  res.json({ tabId });
});

// Navigate tab
app.get("/navigate", async (req, res) => {
  const { tabId, url } = req.query;
  if (!tabs[tabId]) return res.status(404).send("Tab not found");
  const tab = tabs[tabId];
  try {
    await tab.page.goto(url, { waitUntil: "networkidle2" });
    tab.url = url;

    // Update history
    if(tab.historyIndex === -1 || tab.history[tab.historyIndex] !== url){
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length -1;
    }

    const content = await tab.page.content();
    const title = await tab.page.title();
    let favicon = null;
    try {
      const f = await tab.page.$("link[rel~='icon']");
      if(f) favicon = await tab.page.evaluate(el => el.href, f);
    } catch(e){}

    res.json({ html: content, title, favicon });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to load page");
  }
});

// Back / forward
app.get("/go-back", async (req, res) => {
  const { tabId } = req.query;
  if (!tabs[tabId]) return res.status(404).send("Tab not found");
  const tab = tabs[tabId];
  if(tab.historyIndex > 0){
    tab.historyIndex--;
    await tab.page.goto(tab.history[tab.historyIndex], { waitUntil: "networkidle2" });
    res.send("ok");
  } else res.status(400).send("Cannot go back");
});

app.get("/go-forward", async (req, res) => {
  const { tabId } = req.query;
  if (!tabs[tabId]) return res.status(404).send("Tab not found");
  const tab = tabs[tabId];
  if(tab.historyIndex < tab.history.length -1){
    tab.historyIndex++;
    await tab.page.goto(tab.history[tab.historyIndex], { waitUntil: "networkidle2" });
    res.send("ok");
  } else res.status(400).send("Cannot go forward");
});

// Close tab
app.get("/close-tab", async (req, res) => {
  const { tabId } = req.query;
  if (!tabs[tabId]) return res.status(404).send("Tab not found");
  await tabs[tabId].page.close();
  delete tabs[tabId];
  res.send("Closed");
});

// List tabs
app.get("/tabs", (req, res) => {
  res.json(Object.keys(tabs));
});

app.listen(3000, () => console.log("🚀 Puppeteer tabbed browser running on http://localhost:3000"));
