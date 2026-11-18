import { expect, test, type Page } from "@playwright/test";

// Season and layout choices live in the masthead's Display menu.
async function openDisplay(page: Page) {
  const toggle = page.locator(".display-menu > summary");
  await toggle.click();
  await expect(page.locator(".display-menu")).toHaveAttribute("open", "");
}

test("readers can slide between seasons and keep their choice on reload", async ({
  page,
}) => {
  await page.goto("/");
  await openDisplay(page);
  const slider = page.getByRole("slider", { name: "Season theme" });
  await expect(slider).toHaveValue("0");
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(page.locator("html")).toHaveAttribute("data-season", "spring");
  await expect(page.locator(".banner")).toHaveAttribute(
    "src",
    "/herald/banner.png",
  );
  await slider.press("End");
  await expect(page.locator("html")).toHaveAttribute("data-season", "winter");
  await expect(page.locator(".banner")).toHaveAttribute(
    "src",
    "/herald/themes/winter/banner.jpg",
  );
  await page.reload();
  await openDisplay(page);
  await expect(slider).toHaveValue("4");
  await expect(page.locator("html")).toHaveAttribute("data-season", "winter");
  const initialHtml = await page.request.get("/");
  expect(await initialHtml.text()).toContain('data-season="winter"');
  expect(initialHtml.headers()["cache-control"]).toContain("no-store");
  await page.getByRole("button", { name: "Summer", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-season", "summer");
  await page.getByRole("button", { name: "Autumn", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-season", "autumn");
  await page
    .getByRole("link", { name: "Edition archive", exact: true })
    .first()
    .click();
  await openDisplay(page);
  await expect(slider).toHaveValue("3");
  await page.getByRole("button", { name: "Auto", exact: true }).click();
  await page.reload();
  await openDisplay(page);
  await expect(slider).toHaveValue("0");
});

test("Auto rolls over at Korea midnight while manual themes remain selected", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-11-30T14:59:59Z") });
  await page.clock.pauseAt(new Date("2027-11-30T14:59:59Z"));
  await page.goto("/");
  await page.clock.runFor(1);
  await expect(page.locator("html")).toHaveAttribute("data-season", "autumn");
  await page.clock.runFor(1_000);
  await expect(page.locator("html")).toHaveAttribute("data-season", "winter");
  await openDisplay(page);
  await page.getByRole("button", { name: "Spring", exact: true }).click();
  await page.clock.fastForward(86_400_000);
  await expect(page.locator("html")).toHaveAttribute("data-season", "spring");
  await page.getByRole("button", { name: "Auto", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-season", "winter");
});

test("anonymous readers receive the front page and article metadata without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Front page" })).toBeVisible();
  await page
    .getByRole("link", {
      name: "The stories we carry beyond the classroom",
      exact: true,
    })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The stories we carry beyond the classroom",
  );
  await expect(
    page.getByText("A school is more than a collection of classrooms.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "The stories we carry beyond the classroom",
  );
  await expect(page.getByText("Not ready yet.")).toHaveCount(0);
  await context.close();
});

test("readers vote once per browser, see totals only afterwards, and can change their vote", async ({
  page,
}) => {
  await page.goto("/");
  const poll = page.locator("#poll-study-spot");
  await expect(
    poll.getByRole("heading", { name: "Where do you study best?" }),
  ).toBeVisible();
  await expect(poll.locator(".poll-results")).toHaveCount(0);
  await poll.getByRole("radio", { name: "Library" }).check();
  await poll.getByRole("button", { name: "Vote" }).click();
  await expect(poll.locator(".poll-results")).toBeVisible();
  await expect(poll.getByText("· Your vote")).toHaveCount(1);
  await expect(
    poll.locator(".poll-results li", { hasText: "Library" }),
  ).toContainText("Your vote");

  await poll.getByText("Change your vote").click();
  await poll.getByRole("radio", { name: "Classroom" }).check();
  await poll.getByRole("button", { name: "Change vote" }).click();
  await expect(
    poll.locator(".poll-results li", { hasText: "Classroom" }),
  ).toContainText("Your vote");

  await page.reload();
  await expect(
    page.locator("#poll-study-spot .poll-results li", { hasText: "Classroom" }),
  ).toContainText("Your vote");
});

test("closed polls show their totals to everyone and refuse votes", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const past = page.locator("#poll-club-fair");
  await past.getByText("Which club fair booth was best?").click();
  await expect(past.getByText("Closed")).toBeVisible();
  await expect(past.locator(".poll-results")).toBeVisible();
  await expect(past.getByRole("button", { name: "Vote" })).toHaveCount(0);
  await expect(page.getByText("Invalid files are skipped")).toHaveCount(0);

  const refused = await request.post("/?index", {
    form: { poll: "club-fair", choice: "Robotics" },
    headers: { Origin: new URL(page.url()).origin },
    maxRedirects: 0,
  });
  expect(refused.status()).toBe(409);
  const crossSite = await request.post("/?index", {
    form: { poll: "study-spot", choice: "Library" },
    headers: { Origin: "https://kmla.online" },
    maxRedirects: 0,
  });
  // React Router's own origin check (400) or the newspaper's (403) may refuse it first.
  expect([400, 403]).toContain(crossSite.status());
});

test("voting works without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/?layout=magazine");
  const poll = page.locator("#poll-study-spot");
  await poll.getByRole("radio", { name: "Dorm room" }).check();
  await poll.getByRole("button", { name: "Vote" }).click();
  await expect(page).toHaveURL(/layout=magazine/);
  await expect(
    page.locator("#poll-study-spot .poll-results li", { hasText: "Dorm room" }),
  ).toContainText("Your vote");
  await context.close();
});

test("sections and both layouts remain readable on a narrow screen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openDisplay(page);
  const panel = await page.locator(".display-panel").boundingBox();
  expect(panel?.x).toBeGreaterThanOrEqual(0);
  expect((panel?.x ?? 0) + (panel?.width ?? 0)).toBeLessThanOrEqual(390);
  await page.getByRole("link", { name: "Magazine", exact: true }).click();
  await expect(page).toHaveURL(/layout=magazine/);
  await expect(page.locator(".front-stories")).toHaveClass(/magazine/);
  await openDisplay(page);
  await expect(
    page.getByRole("link", { name: "Magazine", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", {
      name: "The stories we carry beyond the classroom",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Editorial", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "In praise of getting lost between the pages",
    }),
  ).toBeVisible();
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.getByRole("link", { name: "misc", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No stories in this section yet." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("the Display menu closes on Escape or an outside click and offers layout only on the front page", async ({
  page,
}) => {
  await page.goto("/?section=Editorial");
  const menu = page.locator(".display-menu");
  const toggle = menu.locator("summary");
  await expect(page.getByRole("slider", { name: "Season theme" })).toBeHidden();
  await openDisplay(page);
  await expect(page.getByRole("group", { name: "Layout" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Magazine", exact: true }),
  ).toHaveAttribute("href", "/?section=Editorial&layout=magazine");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(toggle).toBeFocused();
  await openDisplay(page);
  await page.locator(".motto").click();
  await expect(menu).not.toHaveAttribute("open", "");
  await page.goto("/editions");
  await openDisplay(page);
  await expect(
    page.getByRole("slider", { name: "Season theme" }),
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "Layout" })).toHaveCount(0);
});

test("without JavaScript the Display menu still switches layout on the front page", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.locator(".display-menu > summary").click();
  await expect(page.locator(".season-control")).toBeHidden();
  await page.getByRole("link", { name: "Magazine", exact: true }).click();
  await expect(page.locator(".front-stories")).toHaveClass(/magazine/);
  await page.goto("/editions");
  await expect(page.locator(".display-menu")).toBeHidden();
  await context.close();
});

test("unknown articles and editions return an actual 404", async ({ page }) => {
  for (const path of ["/articles/not-a-story", "/editions/not-an-edition"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  }
});

test("the compact shelf opens all 24 permanent editions and a full-height reader", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator(".past-editions li")).toHaveCount(4);
  await page.getByRole("link", { name: "View all editions" }).click();
  await expect(
    page.getByRole("heading", { name: "Edition archive", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".archive-card")).toHaveCount(24);
  await page
    .getByRole("link", { name: "70th edition Life in the Screen", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Life in the Screen" }),
  ).toBeVisible();
  const viewer = page.locator('iframe[title="70th edition PDF"]');
  await expect(viewer).toBeVisible();
  const bounds = await viewer.boundingBox();
  expect(bounds?.height).toBeGreaterThan(500);
  await expect(
    page.getByRole("link", { name: "Download PDF" }),
  ).toHaveAttribute("download", "");
  const pdf = await request.get("/herald/70th-edition.pdf", {
    headers: { Range: "bytes=0-4" },
  });
  expect(pdf.status()).toBe(206);
  expect((await pdf.body()).toString()).toBe("%PDF-");
});
