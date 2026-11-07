"""Optional end-to-end Chromium smoke test against a running local server.

This checks real browser WebSockets rather than the mocked transport in
browser_offline.py. It may not run in locked-down CI environments that block
Chromium navigation to localhost. Start server separately, then run:

    PORT=8765 python -m server.app
    PANIC_TEST_URL=http://127.0.0.1:8765 python tests/browser_smoke.py
"""
from __future__ import annotations

import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
URL = os.getenv("PANIC_TEST_URL", "http://127.0.0.1:8765")
OUT = ROOT / "docs" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)


def main() -> None:
    with sync_playwright() as playwright:
        opts = {"headless": True, "args": ["--no-sandbox"]}
        if os.getenv("CHROMIUM_PATH"):
            opts["executable_path"] = os.environ["CHROMIUM_PATH"]
        browser = playwright.chromium.launch(**opts)
        errors: list[str] = []
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto(URL, wait_until="domcontentloaded")
        expect(page.locator("#hero-title")).to_contain_text("TYPE FAST")
        expect(page.locator(".mission-card")).to_have_count(6)
        expect(page.locator(".academy-card")).to_have_count(3)

        # A real server-controlled single-player round starts in the briefing.
        page.locator('[data-action="choose-mission"][data-mission="station"]').click()
        page.locator('[data-action="solo"]').first.click()
        expect(page.locator(".lobby-heading")).to_be_visible(timeout=10000)
        page.locator('[data-action="difficulty"][data-difficulty="story"]').click()
        page.locator('[data-action="start"]').click()
        expect(page.locator(".briefing-page")).to_be_visible(timeout=6000)
        expect(page.locator(".briefing-stations")).to_contain_text("YOUR ROLE")
        page.screenshot(path=str(OUT / "briefing-live-v04.png"), full_page=True)
        page.locator('[data-action="ready"]').click()
        expect(page.locator("#deployment-count")).to_be_visible(timeout=5000)
        page.screenshot(path=str(OUT / "countdown-live-v04.png"), full_page=True)
        expect(page.locator("#task-input")).to_be_enabled(timeout=10000)
        page.locator('[data-action="guide"]').click()
        expect(page.locator("#modal-title")).to_contain_text("KNOW YOUR ROLE")
        page.locator('[data-action="close-modal"]').last.click()

        # Complete the first three objectives; ECHO automatically defends.
        for i in range(3):
            expect(page.locator("#task-input")).to_be_enabled(timeout=8000)
            text = page.locator("#target-text").inner_text()
            page.locator("#task-input").fill(text)
            expect(page.locator("#progress-caption")).to_contain_text(f"{i+1:02d} /", timeout=5000)
            page.wait_for_timeout(250)
        expect(page.locator("#tactic-panel")).to_be_visible(timeout=6000)
        expect(page.locator("#tactic-actions button")).to_have_count(2)
        page.locator("#tactic-actions button").first.click()
        expect(page.locator(".tactic-wait")).to_contain_text("defender")
        expect(page.locator("#task-input")).to_be_enabled(timeout=15000)

        for _ in range(2):
            text = page.locator("#target-text").inner_text()
            page.locator("#task-input").fill(text)
            page.wait_for_timeout(270)
        expect(page.locator(".switch-screen")).to_be_visible(timeout=7000)
        expect(page.locator(".switch-screen")).to_contain_text("DEFENDER")
        expect(page.locator(".typing-zone")).to_be_visible(timeout=10000)
        assert not errors, f"Browser JavaScript exceptions: {errors}"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        page.close()

        # Check the self-paced terminal on a mobile-sized browser.
        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.on("pageerror", lambda exc: errors.append(str(exc)))
        mobile.goto(URL, wait_until="domcontentloaded")
        mobile.locator('[data-action="learn"][data-os="linux"]').click()
        expect(mobile.locator("#lesson-input")).to_be_visible()
        mobile.locator("#lesson-input").fill("pwd")
        mobile.locator("#lesson-input").press("Enter")
        expect(mobile.locator("#training-feedback")).to_contain_text("COMMAND RECOGNIZED")
        mobile.screenshot(path=str(OUT / "mobile-academy-live-v04.png"), full_page=True)
        assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        assert not errors, f"Browser JavaScript exceptions: {errors}"
        browser.close()
    print("PASS: real local browser WebSocket, briefing/readiness/countdown, tactics, role swap, mobile Academy")


if __name__ == "__main__":
    main()
