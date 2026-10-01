#### Script for automated testing, edge cases, error handling, and performance

import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

import pytest
from playwright.sync_api import Page, expect


PROJECT_ROOT = Path(__file__).resolve().parent

@pytest.fixture(scope="session")
def app_url():
    # Pick an available port so the app's server doesn't conflict with another one.
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]

    url = f"http://127.0.0.1:{port}/"
    server = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "http.server",
            str(port),
            "--bind",
            "127.0.0.1",
        ],
        cwd=PROJECT_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            if server.poll() is not None:
                raise RuntimeError("The local test server stopped unexpectedly.")

            try:
                with urlopen(url, timeout=1):
                    break
            except (OSError, URLError):
                time.sleep(0.1)
        else:
            raise RuntimeError("The local test server did not start in time.")

        yield url
    finally:
        if server.poll() is None:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()


@pytest.fixture
def clean_page(page: Page, app_url: str) -> Page:
    # Clear saved Found checkboxes, then reload so the app starts with clean state.
    page.goto(app_url)
    page.evaluate("localStorage.clear()")
    page.reload()
    return page


def open_species_page(page: Page) -> None:
    page.locator(".season-wedge").first.click(force=True)
    page.locator(".ilua-node").first.click(force=True)
    page.locator(".category-card").first.click(force=True)
    expect(page.locator("#found-filter")).to_be_visible()


def test_season_wheel_loads_six_seasons(clean_page: Page) -> None:
    expect(clean_page.locator(".season-wedge")).to_have_count(6)


def test_navigation_reaches_species_list(clean_page: Page) -> None:
    open_species_page(clean_page)

    expect(clean_page.locator(".selection-summary")).to_be_visible()
    expect(clean_page.locator("#found-filter")).to_have_value("all")
    expect(clean_page.locator(".species-card").first).to_be_visible()


def test_species_are_sorted_alphabetically(clean_page: Page) -> None:
    open_species_page(clean_page)

    names = clean_page.locator(".species-body h3").all_text_contents()
    assert names == sorted(names, key=str.casefold)


def test_found_filter_shows_empty_message_when_none_are_found(
    clean_page: Page,
) -> None:
    open_species_page(clean_page)
    clean_page.locator("#found-filter").select_option("found")

    expect(clean_page.locator(".empty-state")).to_contain_text(
        "No species marked Found"
    )


def test_not_found_filter_only_shows_unchecked_species(
    clean_page: Page,
) -> None:
    open_species_page(clean_page)
    clean_page.locator("#found-filter").select_option("not-found")

    assert clean_page.locator(".species-card").count() > 0
    expect(clean_page.locator(".found-toggle input:checked")).to_have_count(0)


def test_checking_species_removes_it_from_not_found_filter(
    clean_page: Page,
) -> None:
    open_species_page(clean_page)
    clean_page.locator("#found-filter").select_option("not-found")

    first_name = clean_page.locator(".species-body h3").first.inner_text()
    clean_page.locator(".found-toggle input").first.check()

    clean_page.locator("#found-filter").select_option("found")
    expect(
        clean_page.locator(".species-body h3", has_text=first_name)
    ).to_be_visible()


def test_found_checkbox_persists_after_reload(
    clean_page: Page,
) -> None:
    open_species_page(clean_page)

    first_name = clean_page.locator(".species-body h3").first.inner_text()
    clean_page.locator(".found-toggle input").first.check()
    clean_page.reload()

    open_species_page(clean_page)
    clean_page.locator("#found-filter").select_option("found")
    expect(
        clean_page.locator(".species-body h3", has_text=first_name)
    ).to_be_visible()


def test_malformed_saved_state_does_not_break_startup(
    clean_page: Page,
) -> None:
    clean_page.evaluate(
        "localStorage.setItem('noongarPlantFinderChecked', '{invalid json')"
    )
    clean_page.reload()

    expect(clean_page.locator(".season-wedge")).to_have_count(6)


def test_csv_network_failure_shows_load_error(
    clean_page: Page,
    app_url: str,
) -> None:
    clean_page.route(
        "**/season_data_master.csv",
        lambda route: route.abort(),
    )
    clean_page.goto(app_url)

    expect(clean_page.get_by_text("Data could not be loaded.")).to_be_visible()


def test_back_and_home_navigation_work(clean_page: Page) -> None:
    open_species_page(clean_page)

    clean_page.get_by_role("button", name="Go back").click(force=True)
    expect(clean_page.locator(".category-card")).to_have_count(3)

    clean_page.get_by_role("button", name="Home").click(force=True)
    expect(clean_page.locator(".season-wedge")).to_have_count(6)


def test_main_navigation_has_no_uncaught_javascript_errors(
    clean_page: Page,
) -> None:
    errors = []
    clean_page.on("pageerror", lambda error: errors.append(str(error)))

    open_species_page(clean_page)

    assert errors == []