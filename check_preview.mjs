import puppeteer from "puppeteer";

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));
    page.on("requestfailed", (request) => {
      console.log(
        "REQUEST FAILED:",
        request.url(),
        request.failure()?.errorText || "Unknown error",
      );
    });

    console.log("Navigating to preview server...");
    await page.goto("http://localhost:4173/", {
      waitUntil: "networkidle2",
      timeout: 10000,
    });

    // Check if the root element is empty
    const rootHtml = await page.evaluate(
      () => document.getElementById("root")?.innerHTML || "ROOT_NOT_FOUND",
    );
    console.log("Root element length:", rootHtml.length);
    if (rootHtml.length < 50) {
      console.log("Root HTML:", rootHtml);
    }

    await browser.close();
  } catch (err) {
    console.error("Script error:", err);
  }
})();
