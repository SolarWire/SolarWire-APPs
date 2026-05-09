from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1400, "height": 900})
    
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    
    page.screenshot(path='/tmp/solarwire_initial.png', full_page=True)
    print("Screenshot saved to /tmp/solarwire_initial.png")
    
    print("Page title:", page.title())
    print("Page URL:", page.url)
    
    content = page.content()
    if "SolarWire" in content or "solarwire" in content.lower():
        print("SolarWire app loaded successfully")
    else:
        print("SolarWire app may not have loaded correctly")
    
    browser.close()
