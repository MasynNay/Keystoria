"""Offline Chromium layout verification of real UI templates.

These screenshots use representative server state and do not exercise live
WebSocket sessions. This is useful where browser navigation is restricted.

Install Playwright's Python package and Chromium, then run this script.
Use CHROMIUM_PATH to select a system-installed browser if desired.
"""
from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "docs" / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)


def main() -> None:
    with tempfile.TemporaryDirectory() as fixture_dir:
        env = {**os.environ, "PANIC_FIXTURE_DIR": fixture_dir}
        subprocess.run(["node", str(ROOT / "tests" / "render_fixture.mjs")],
                       check=True, env=env, cwd=ROOT)
        with sync_playwright() as playwright:
            options = {"headless": True, "args": ["--no-sandbox"]}
            if os.getenv("CHROMIUM_PATH"):
                options["executable_path"] = os.getenv("CHROMIUM_PATH")
            browser = playwright.chromium.launch(**options)
            for name, width, height in [
                ("landing", 1440, 900), ("game", 1440, 900),
                ("briefing", 1440, 900), ("countdown", 1440, 900), ("training", 1440, 900),
                ("landing", 390, 844), ("game", 390, 844),
                ("briefing", 390, 844), ("countdown", 390, 844), ("training", 390, 844),
            ]:
                page = browser.new_page(viewport={"width": width, "height": height})
                page.set_content(Path(fixture_dir, f"{name}.html").read_text(), wait_until="domcontentloaded")
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), (
                    f"Horizontal overflow in {name} at {width}px"
                )
                if name == "game":
                    assert page.locator(".world-console").is_visible()
                    assert page.locator(".tactic-actions button").count() == 2
                if name == "briefing":
                    assert page.locator(".briefing-stations").is_visible()
                if name == "training":
                    assert page.locator("#lesson-input").is_visible()
                    assert page.locator(".reference-panel").is_visible()
                if name == "countdown":
                    assert page.locator("#deployment-count").is_visible()
                filename = f"{name}-v04.png" if width == 1440 else f"mobile-{name}-v04.png"
                page.screenshot(path=str(SHOTS / filename), full_page=True, animations="disabled")
                print(f"PASS {width}px: {name} layout, no horizontal overflow")
                page.close()
            browser.close()


if __name__ == "__main__":
    main()
