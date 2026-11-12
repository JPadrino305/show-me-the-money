## Test log for v1

| What I tested | What happened | What I want instead |
|---------------|---------------|---------------------|
| Added expenses | The dashboard showed the saved expense count, charts, category totals, and Total Spent correctly. | Preserve this behavior in v2. |
| Same date and category | Food expenses of $25.50 and $14.50 on the same date combined into a $40.00 daily total while remaining two saved entries. | Preserve daily grouping by date and category. |
| Cleared expenses | The dashboard returned to zero entries, $0.00 total, empty charts, and empty jars. | Preserve clearing and also clear the new budget and savings data in v2. |
| Submitted a zero-dollar expense with browser validation bypassed | The server displayed a readable error. Existing entries and the $50.25 total remained unchanged. | Preserve server-side validation without changing saved data on an invalid submission. |
| Submitted empty date and category fields | Browser validation bubbles appeared. Server-side rejection of these fields was not independently verified. | Require server-side validation as well as browser checks. |
| Inspected the cookie | MoneySpent_v1 existed with HttpOnly true, SameSite Lax, and creation and expiration timestamps 30 days apart. The complete path was truncated in the screenshot. | Use a separate v2 cookie with an explicit path and a 30-day expiration. |
| Submitted 31 expenses | One $99 expense followed by thirty $1 expenses resulted in 30 saved entries and $30.00 total. The oldest entry was removed. | Preserve the latest-30-entry limit for charts and jars, but keep separate monthly totals for budgeting. |
| Reviewed the dashboard's spending displays | Charts and jars showed spending, but there was no monthly budget comparison or remaining-budget warning. | Add a monthly budget meter below the jars with remaining-budget and overspending information. |
| Reviewed savings information | V1 did not record unspent budget from completed months. | Add recorded savings based on completed months, with an explanation that history lasts only while the cookie is retained. |

# Prompt Script v2

## Goal

Build version 2 of my personal spending tracker:
“$HOW ME THE MONEY!”

Preserve the working v1 application.

V2 must retain the entry form, two Chart.js charts, Total Spent,
and three p5.js spending jars. Add monthly budgeting, an animated
budget meter, low-budget warnings, and cookie-limited savings history.

## Existing application and constraints

- The project already uses Express, hbs, and cookie-parser.
- Add v2 routes in app.js below the v1 routes and before app.listen.
- Preserve all existing routes, including GET / and all v1 routes.
- Do not rewrite v1 templates or v1 browser JavaScript.
- Do not modify the saved v1 prompt.
- Do not install new npm packages.
- Use Handlebars, plain HTML, CSS, browser JavaScript, Chart.js,
  and p5.js.
- Load Chart.js and p5.js from CDNs.
- Do not add React or another frontend framework.
- Use straightforward functions, loops, and if statements.
- Comment every function.
- Use separate v2 templates and browser files so v1 remains unchanged.
- Do not commit automatically. Explain the changes and let me test first.

## V2 routes

- GET /tracker/v2
  Render the monthly budget section and expense form.

- POST /tracker/v2/budget
  Validate and save a monthly budget without adding an expense.
  Redirect to the dashboard for that month after success.

- POST /tracker/v2
  Validate and save an expense.
  Update its monthly spending total.
  Keep only the latest 30 detailed entries.
  Redirect to the dashboard for the expense's month after success.

- GET /tracker/v2/dashboard
  Render both charts, category totals, Total Spent, jars,
  the selected month's budget meter, and recorded savings.

- POST /tracker/v2/clear
  Delete the v2 cookie using res.clearCookie.
  Redirect to the empty v2 dashboard.

Each v2 page must link to the other v2 page.

Do not redirect v2 navigation to v1.

## Cookie storage

Use MoneySpent_v2, separate from MoneySpent_v1.

Store one versioned object containing:
- entries: the latest 30 detailed expenses.
- months: monthly budgets and monthly spending totals.

A detailed expense has:
{ date: "2026-11-04", amount: 25.50, category: "food" }

A monthly record contains:
- month in YYYY-MM format.
- budget in integer cents, or null if not set.
- spent in integer cents.

Use req.cookies to read the cookie and res.cookie to save it.

Do not use localStorage, sessionStorage, or document.cookie.

Set:
- maxAge to 30 days.
- path to /tracker/v2.
- httpOnly to true.
- sameSite to lax.

Use matching path options when clearing.

Successful expense or budget saves renew the 30-day lifetime.

A dashboard visit must not renew the cookie merely because
the user viewed the page.

Treat the cookie as untrusted:
- Validate its structure and values.
- Handle malformed data without crashing.
- Show a readable notice if unusable tracker data must be ignored.
- Do not present incomplete monthly totals as verified savings.

Keep the stored object compact.
Before saving, check the encoded cookie size with a conservative
limit that leaves room for its name and attributes.
If it would exceed that limit, reject the new save with a readable
storage-full message and preserve the previous cookie.
Do not silently delete monthly totals or savings history to make room.

Explain that this is a cookie-based class project, not permanent
or tamper-proof financial storage.

## Date and money rules

- Expense dates must be real dates in YYYY-MM-DD format.
- Budget months must use YYYY-MM format.
- Amounts and budgets must be greater than zero with up to
  two decimal places.
- Categories must be exactly food, gas, or fun.
- Validate all submitted fields on the server.
- Reject empty, nonnumeric, invalid, or unsafe monetary values.
- Calculate money using integer cents.
- Store detailed expense amounts as numbers in dollars.
- Check that additions remain within safe integer limits.
- Invalid submissions must not modify the cookie.
- Show readable errors and preserve valid submitted fields.

Use UTC consistently to determine the current calendar month.
State this month convention in the interface help text.

Do not accept future-month budgets or future-dated expenses.
Allow past expenses because users may enter them late.

## Expense form

Fields:
- Date.
- Amount in dollars.
- Category dropdown: Food, Gas, Fun.

Button: “Add expense.”
Link: “View dashboard.”

## Monthly budget section on the entry page

Place a separate monthly budget form above the expense form.

Fields:
- Month input.
- Budget amount in dollars.

Button: “Save monthly budget.”

Show the saved budget for the chosen month when available.

Saving a budget must not add an expense.

Require a saved budget for an expense's month before accepting
that expense. If missing, explain that the user must save that
month's budget first.

Allow updating an existing month's budget.
Keep its spending total unchanged when updating the budget.

Do not infer a monthly budget from an expense amount.

## Monthly accounting

Assign an expense to the month of its entered date.

Every successful expense submission must:
1. Add the detailed entry.
2. Add its amount once to that month's spending total.
3. Keep only the latest 30 detailed entries.

“Latest” means most recently submitted, not newest expense date.

Do not reduce a monthly spending total when its detailed entry
falls outside the latest 30 entries.

Refreshing or opening the dashboard must not add spending again.

The monthly total is separate from the latest-30-entry charts.
Label that difference clearly.

Do not add expense editing or individual expense deletion in v2.

## Dashboard order

1. App heading and saved-entry count.
2. Line chart: Spending by Day.
3. Pie chart and Total Spent underneath.
4. Navigation and Clear all data button.
5. Three p5.js jars.
6. Monthly budget panel with animated meter.
7. Recorded savings section.

## Chart 1: Spending by Day

Use a Chart.js line chart with three category lines.

- Use only the latest 30 detailed entries.
- Sort dates chronologically.
- Sum entries sharing a date and category.
- Food: green.
- Fun: turquoise.
- Gas: red.
- Y-axis starts at zero and displays dollars.
- Include a category legend and dollar-value tooltips.

## Chart 2: Spending by Category

Use a Chart.js pie chart.

- Use only the latest 30 detailed entries.
- Show Food, Gas, and Fun category totals.
- Match the line-chart colors.
- Include readable labels and dollar totals.

Display Total Spent separately.

Label it “Total Spent — latest 30 entries” so it cannot be
mistaken for the selected month's complete spending total.

## p5.js spending jars

Draw three jars labeled Fun, Gas, and Food.

- Use only the latest 30 detailed entries.
- One full green banknote represents $20 spent.
- Use a proportional-width note for a remainder below $20.
- Show exact category totals beneath the jars.
- Empty categories have empty jars.
- Include “Money spent, not saved.”
- Keep the sketch inside the dashboard.

If retaining the 100-visible-banknote safeguard from v1:
- Clearly state how many notes are omitted.
- Still show the exact category total.
- Do not imply that all banknotes are pictured.

## Monthly budget panel

Place the panel directly below the jars.

Provide a month selector using saved monthly records.
Default to the current month.

Show:
- Selected month.
- Monthly budget.
- Complete recorded spending for that month.
- Remaining budget, or amount over budget.
- Percentage of budget used.

This panel uses monthly spending totals, not just the latest
30 detailed entries.

If no budget exists for the selected month:
- Show “Set a monthly budget to see your budget meter.”
- Link to the budget form.
- Do not divide by zero or show a misleading percentage.

## Budget meter

Draw a long horizontal rectangle.

Filled width represents:
monthly spending / monthly budget.

Clamp visual width between 0% and 100%.

Show the actual percentage even when it exceeds 100%.

Use a left-to-right gradient:
turquoise, green, yellow, orange, red.

Reveal the gradient as the bar fills, so low spending shows
the cool-colored part and high spending reaches red.

At or above 100%:
- Keep the bar fully filled.
- Use a clear red danger treatment.
- Show “Budget reached” at exactly 100%.
- Show the exact amount over budget above 100%.

Include text so meaning does not depend only on color.

## Scroll animation

Use browser JavaScript to detect when the budget panel
enters the viewport.

Animate the fill from zero to its calculated width.

- Play once per dashboard page load.
- Do not restart repeatedly while scrolling.
- Keep the numeric totals accurate throughout the animation.
- Respect reduced-motion preferences by showing the final state
  without animation.
- Animate again for a newly selected month after its dashboard loads.

## Budget warning popup

When the budget panel enters view and spending is at least
75% but less than 100% of the monthly budget, show a dismissible
on-page warning popup.

At exactly 25% remaining, display:
“You have 25% of your budget left to spend. Be careful.”

Below that, display the actual percentage remaining.
Use sensible rounding and avoid showing 0% while money remains.

At exactly 100%, show a budget-reached warning.
Above 100%, show a budget-exceeded warning with the dollar overage.

- Show the popup at most once per page load.
- Provide an accessible Close button.
- Keep a persistent status message in the budget panel.
- Do not use repeated browser alert boxes.

## Recorded savings

During an unfinished month, call the unspent amount
“Remaining budget,” not savings.

A month is completed when its YYYY-MM value is earlier
than the current UTC calendar month.

For completed months with a saved budget:
recorded savings = max(budget - monthly spending, 0).

Show:
- Total recorded savings across retained completed months.
- A readable per-month list with budget, spending, and savings.
- Overspending separately when spending exceeds the budget.

Determine completed-month savings on the first visit after
the month ends. No background scheduler is required.

Derive savings from the retained monthly records.
Do not repeatedly add the same month's savings on each visit.

If a late expense or budget update changes a completed month,
recalculate its savings rather than adding a duplicate record.

Exclude unfinished months from total recorded savings.

Use the label “Recorded savings” and explain that it means
unspent budget based on entered expenses, not verified bank savings.

## Cookie-limited history

Clearly explain:
- Cookies expire 30 days after the last successful save.
- Calendar months and the cookie's 30-day lifetime are different.
- Savings history is available only while the cookie is retained.
- Clearing cookies or clearing tracker data removes that history.
- Closing the page does not run a background month-end calculation.
- Only spending entered into this tracker is included.

## Clearing

“Clear all data” must delete MoneySpent_v2 only.

Remove:
- Detailed expenses.
- Monthly budgets.
- Monthly spending totals.
- Recorded savings history.

Preserve MoneySpent_v1.

Return to the empty v2 dashboard with:
- $0.00 latest-entry total.
- Empty charts and jars.
- No-budget guidance.
- $0.00 recorded savings.
- A readable empty-state message.

## Appearance

App name: $HOW ME THE MONEY!

- Keep the existing local background photo.
- Inspect the existing CSS and use the actual image filename.
- Do not search for or download another image.
- White headings and text.
- Instrument Serif from Google Fonts.
- Green amount fields and primary save/add buttons.
- Purple chart panels and Clear all data button.
- Match the existing desktop visual style.
- Keep the budget meter and savings panel inside the dashboard layout.

## Output and testing

Provide the code and exact file locations.

Preserve v1 and explain which new v2 files and routes were added.

Include test instructions for:
- Saving a budget.
- Adding expenses.
- Refreshing without duplicating spending.
- Same-date category grouping.
- The latest-30-entry limit.
- Monthly totals remaining accurate after older details are removed.
- Meter states below 75%, at 75%, at 100%, and above 100%.
- Scroll animation and warning dismissal.
- Completed-month savings and late-entry recalculation.
- Empty, alphabetic, zero, negative, and over-precision amounts.
- Invalid dates and unsupported categories.
- Clearing v2 without clearing v1.

Do not claim a test passed unless it was actually performed.

Do not commit automatically.
After implementation and testing, I will commit the changes.

Any small manual edits made after generating v2 must be
listed individually in README.md.