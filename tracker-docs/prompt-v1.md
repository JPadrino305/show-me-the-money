# Prompt Script v1

## Goal
A spending tracker called “$HOW ME THE MONEY!” for recording personal expenses by date and category. Users can see daily spending, category totals, and total spending across the entries currently saved in their cookie.


## Where it lives
- It's part of an existing Express.js app that already uses cookie-parser
- Routes go in my main Express file (app.js) with my other routes
- Do NOT change my other routes or add new npm packages

## Data
One entry:
{ date: "2026-11-04", amount: 25.50, category: "food" }

- date: string in YYYY-MM-DD format
- amount: number in dollars, greater than zero, with up to two decimal places
- category: string; allowed values are "fun", "food", or "gas"
- Store an array of entries in MoneySpent_v1.
- The cookie expires after 30 days.
- Keep only the most recent 30 entries.

## Routes (Express + cookie-parser)
- GET /tracker/v1 renders the entry form.
- POST /tracker/v1 reads the existing MoneySpent_v1 cookie
  with req.cookies, adds the submitted entry, keeps the most
  recent 30 entries, and saves the array with res.cookie.
- After saving, redirect to /tracker/v1/dashboard.
- GET /tracker/v1/dashboard reads MoneySpent_v1 with
  req.cookies and uses those entries for both charts,
  Total Spent, and the p5.js sketch.
- Provide a server-side clearing handler that deletes
  MoneySpent_v1 with res.clearCookie, then returns the user
  to the empty dashboard.
Form fields: date, amount in dollars, and category dropdown.
Submission button: “Add expense.”
Link: “View dashboard.”
After a successful submission: redirect to /tracker/v1/dashboard.
Dashboard order: line chart at the top; pie chart and total-spent display beneath; navigation and clear button; three jars underneath.
Empty state: zero total, empty jars, and a readable message explaining that no expenses have been added.
Clearing: remove MoneySpent_v1 and reload the dashboard so the visuals empty out.
-Each page links to the other

## Chart 1 (Chart.js)
Type: line chart with three lines.
Title: Spending by Day.
X-axis: dates in chronological order.
Y-axis: dollars spent, starting at zero.
Each line shows the daily total for one category.
Add together expenses with the same date and category.
Food = green, Fun = turquoise, Gas = red.
Include a category legend.

## Chart 2 (Chart.js)
Type: pie chart.
Title: Spending by Category.
Each slice represents the total dollars spent in Food, Gas, or Fun.
Use the same category colors as the line chart.
Show readable category labels and dollar totals.
Display Total Spent separately, calculated from the saved entries.

## p5.js sketch
Draw three jars labeled Fun, Gas, and Food.
One full green banknote represents $20 spent.
Represent a remaining amount below $20 with a partial banknote.
Show the exact category total beneath each jar.
More spending adds more banknotes.
With no expenses, the jars are empty.
Include the caption “Money spent, not saved.”
Keep the sketch inside the dashboard layout.


## Rules / constraints
-Use the existing Express and Handlebars setup, with plain
HTML, CSS, and browser JavaScript for the interface.
Do not add React, another front end framework, or new npm packages.
Use straightforward functions, loops, and if statements
that a beginner can follow.
- Store data in cookies using cookie-parser on the server
  (NOT localStorage, NOT document.cookie)
- Load Chart.js and p5.js from a CDN
- Comment every function
- Include a "Clear all data" button
Validate the date, amount, and category on the server.
Reject invalid entries without saving them and show a
readable error message.
Use a local background image that I will provide;
do not search for or download an image automatically.

App name: $HOW ME THE MONEY!
Photo of scene from Jerry Mcguire of Tom Cruise yelling on the phone.
White headings and text.
Green amount field and Add expense button.
Purple chart panel and Clear all data button.
Instrument Serif (google fonts).



# Version 1 Testing

App: $HOW ME THE MONEY!

## Passed tests

### Expense submission and populated dashboard
- Added expenses using the entry form.
- The dashboard displayed category totals, daily spending,
  Total Spent, and the p5.js jars.
- The displayed category totals agreed with Total Spent.

### Same-date and same-category grouping
Submitted:
- Food: $25.50 on 2026-11-04.
- Food: $14.50 on 2026-11-04.
- Fun: $10.25 on 2026-11-05.

Results:
- Three saved expenses.
- Food daily total: $40.00 on 2026-11-04.
- Food category total: $40.00.
- Fun category total: $10.25.
- Total Spent: $50.25.
- Food jar showed two full banknotes.
- Fun jar showed a partial banknote.

### Clearing and empty-state display
- Used Clear all data.
- Dashboard showed zero saved expenses and $0.00 total.
- A readable no-expenses message appeared.
- The charts contained no spending data.
- All three jars were empty.

### Server-side zero-amount rejection
- Temporarily bypassed browser form validation.
- Submitted an amount of zero.
- The server returned a readable error above the form.
- Existing saved entries and the $50.25 total remained unchanged.

### Cookie inspection
- Found MoneySpent_v1 in Firefox Storage Inspector.
- HttpOnly was true.
- SameSite was Lax.
- Creation and expiration timestamps were 30 days apart.
- The full cookie path was not visible in the screenshot.

### Most recent 30 entries
- Started with an empty dashboard.
- Submitted one $99 Food expense followed by thirty $1 Food expenses.
- Dashboard showed 30 saved expenses and $30.00 total.
- This matched removal of the oldest $99 entry.
- Food jar showed one full $20 note and a half-width note.

## Partially verified or not yet tested

- Missing date and category produced browser validation bubbles.
  Server-side date and category rejection was not independently verified.
- Impossible dates and unsupported category values were not tested.
- Negative amounts and amounts with more than two decimal places
  were not independently tested.
- Malformed-cookie recovery was not tested.
- The full cookie path still needs inspection.
- Mobile layout still needs review.

## Known implementation limitation

- Each jar draws at most 100 banknotes.
- For larger totals, the sketch reports the full note count.
- This differs from literally drawing every $20 banknote.