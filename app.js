const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;

const cookieName = "MoneySpent_v1";
const cookiePath = "/tracker/v1";
const categories = ["food", "gas", "fun"];

app.set("view engine", "hbs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Check that a date is real and uses YYYY-MM-DD.
function validDate(value) {
    if (typeof value !== "string") {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(value + "T00:00:00.000Z");

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date.toISOString().slice(0, 10) === value;
}

// Convert a valid dollar amount to integer cents.
function amountToCents(value) {
    if (typeof value !== "string" && typeof value !== "number") {
        return null;
    }

    const text = String(value);

    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
        return null;
    }

    const cents = Math.round(Number(text) * 100);

    if (!Number.isSafeInteger(cents) || cents <= 0) {
        return null;
    }

    return cents;
}

// Read the cookie and keep only valid saved entries.
function readEntries(req) {
    const saved = req.cookies[cookieName];
    const entries = [];

    if (!Array.isArray(saved)) {
        return entries;
    }

    let totalCents = 0;

    for (let i = 0; i < saved.length; i++) {
        const entry = saved[i];

        if (!entry || typeof entry !== "object") {
            continue;
        }

        const cents = amountToCents(entry.amount);

        if (
            validDate(entry.date) &&
            typeof entry.amount === "number" &&
            cents !== null &&
            categories.includes(entry.category) &&
            Number.isSafeInteger(totalCents + cents)
        ) {
            entries.push({
                date: entry.date,
                amount: cents / 100,
                category: entry.category
            });

            totalCents += cents;
        }
    }

    return entries.slice(-30);
}

// Format integer cents as a dollar amount.
function dollars(cents) {
    return "$" + (cents / 100).toFixed(2);
}

// Prepare all dashboard totals from the same saved entries.
function buildDashboard(entries) {
    const totals = { food: 0, gas: 0, fun: 0 };
    const daily = {};
    const dates = [];
    let totalCents = 0;

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const cents = Math.round(entry.amount * 100);

        totals[entry.category] += cents;
        totalCents += cents;

        if (!daily[entry.date]) {
            daily[entry.date] = { food: 0, gas: 0, fun: 0 };
            dates.push(entry.date);
        }

        daily[entry.date][entry.category] += cents;
    }

    dates.sort();

    return {
        empty: entries.length === 0,
        count: entries.length,
        total: dollars(totalCents),
        food: dollars(totals.food),
        gas: dollars(totals.gas),
        fun: dollars(totals.fun),
        chartData: JSON.stringify({
            dates: dates,
            daily: daily,
            totals: totals
        })
    };
}

// Show the original server-ready page.
app.get("/", function(req, res) {
    res.send("Show Me the Money server is ready.");
});

// Show the expense entry form.
app.get("/tracker/v1", function(req, res) {
    res.render("tracker", {
        date: new Date().toISOString().slice(0, 10)
    });
});

// Validate and save one expense, then open the dashboard.
app.post("/tracker/v1", function(req, res) {
    const date = req.body.date;
    const amount = req.body.amount;
    const category = req.body.category;
    const cents = amountToCents(amount);
    let error = "";

    if (!validDate(date)) {
        error = "Please enter a real date in YYYY-MM-DD format.";
    } else if (cents === null) {
        error = "Enter an amount greater than zero with no more than two decimal places.";
    } else if (!categories.includes(category)) {
        error = "Please choose Food, Gas, or Fun.";
    }

    if (error) {
        return res.status(400).render("tracker", {
            error: error,
            date: typeof date === "string" ? date : "",
            amount: typeof amount === "string" ? amount : "",
            foodSelected: category === "food",
            gasSelected: category === "gas",
            funSelected: category === "fun"
        });
    }

    let entries = readEntries(req);

    entries.push({
        date: date,
        amount: cents / 100,
        category: category
    });

    // "Most recent" means most recently submitted, not newest date.
    entries = entries.slice(-30);

    let totalCents = 0;

    for (let i = 0; i < entries.length; i++) {
        totalCents += Math.round(entries[i].amount * 100);
    }

    if (!Number.isSafeInteger(totalCents)) {
        return res.status(400).render("tracker", {
            error: "That amount is too large to calculate accurately.",
            date: date,
            amount: amount,
            foodSelected: category === "food",
            gasSelected: category === "gas",
            funSelected: category === "fun"
        });
    }

    res.cookie(cookieName, entries, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: cookiePath,
        httpOnly: true,
        sameSite: "lax"
    });

    res.redirect("/tracker/v1/dashboard");
});

// Build the dashboard using only the current cookie entries.
app.get("/tracker/v1/dashboard", function(req, res) {
    const entries = readEntries(req);

    res.render("dashboard", buildDashboard(entries));
});

// Delete the tracker cookie and return to an empty dashboard.
app.post("/tracker/v1/clear", function(req, res) {
    res.clearCookie(cookieName, {
        path: cookiePath,
        httpOnly: true,
        sameSite: "lax"
    });

    res.redirect("/tracker/v1/dashboard");
});




// ---------- VERSION 2 ----------

const v2CookieName = "MoneySpent_v2";
const v2CookiePath = "/tracker/v2";

// Return today's date using the UTC calendar.
function v2Today() {
    return new Date().toISOString().slice(0, 10);
}

// Return the current month using the UTC calendar.
function v2CurrentMonth() {
    return v2Today().slice(0, 7);
}

// Check that a month uses YYYY-MM and is a real calendar month.
function v2ValidMonth(value) {
    if (typeof value !== "string") {
        return false;
    }

    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// Create an empty version 2 storage object.
function v2EmptyData() {
    return {
        version: 2,
        entries: [],
        months: []
    };
}

// Find a saved monthly record.
function v2FindMonth(data, month) {
    for (let i = 0; i < data.months.length; i++) {
        if (data.months[i].month === month) {
            return data.months[i];
        }
    }

    return null;
}

// Read and validate the complete v2 cookie without trusting its contents.
function v2Read(req) {
    const saved = req.cookies[v2CookieName];

    if (saved === undefined) {
        return {
            data: v2EmptyData(),
            notice: ""
        };
    }

    let valid = Boolean(
        saved &&
        saved.version === 2 &&
        Array.isArray(saved.entries) &&
        Array.isArray(saved.months)
    );

    if (valid && saved.entries.length > 30) {
        valid = false;
    }

    const data = v2EmptyData();
    let combinedSpending = 0;
    let combinedSavings = 0;

    if (valid) {
        for (let i = 0; i < saved.months.length; i++) {
            const record = saved.months[i];

            if (
                !record ||
                !v2ValidMonth(record.month) ||
                record.month > v2CurrentMonth() ||
                v2FindMonth(data, record.month) ||
                !Number.isSafeInteger(record.budget) ||
                record.budget <= 0 ||
                !Number.isSafeInteger(record.spent) ||
                record.spent < 0
            ) {
                valid = false;
                break;
            }

            combinedSpending += record.spent;
            combinedSavings += Math.max(
                record.budget - record.spent,
                0
            );

            if (
                !Number.isSafeInteger(combinedSpending) ||
                !Number.isSafeInteger(combinedSavings)
            ) {
                valid = false;
                break;
            }

            data.months.push({
                month: record.month,
                budget: record.budget,
                spent: record.spent
            });
        }
    }

    const detailedTotals = {};

    if (valid) {
        for (let i = 0; i < saved.entries.length; i++) {
            const entry = saved.entries[i];
            const cents = entry ? amountToCents(entry.amount) : null;

            if (
                !entry ||
                !validDate(entry.date) ||
                entry.date > v2Today() ||
                typeof entry.amount !== "number" ||
                cents === null ||
                !categories.includes(entry.category)
            ) {
                valid = false;
                break;
            }

            const month = entry.date.slice(0, 7);
            const record = v2FindMonth(data, month);

            if (!record) {
                valid = false;
                break;
            }

            if (!detailedTotals[month]) {
                detailedTotals[month] = 0;
            }

            detailedTotals[month] += cents;

            if (
                !Number.isSafeInteger(detailedTotals[month]) ||
                detailedTotals[month] > record.spent
            ) {
                valid = false;
                break;
            }

            data.entries.push({
                date: entry.date,
                amount: cents / 100,
                category: entry.category
            });
        }
    }

    if (!valid) {
        return {
            data: v2EmptyData(),
            notice:
                "The saved v2 data could not be read safely. " +
                "It has been ignored. Savings cannot be verified. " +
                "Clear all data to reset this tracker."
        };
    }

    return {
        data: data,
        notice: ""
    };
}

// Check storage size and arithmetic before saving the complete object.
function v2Save(res, data) {
    let totalSpending = 0;
    let totalPossibleSavings = 0;

    for (let i = 0; i < data.months.length; i++) {
        const record = data.months[i];

        totalSpending += record.spent;
        totalPossibleSavings += Math.max(
            record.budget - record.spent,
            0
        );

        if (
            !Number.isSafeInteger(totalSpending) ||
            !Number.isSafeInteger(totalPossibleSavings)
        ) {
            return "Those amounts are too large to calculate accurately.";
        }
    }

    const encoded = encodeURIComponent(
        "j:" + JSON.stringify(data)
    );

    const size = Buffer.byteLength(
        v2CookieName + "=" + encoded,
        "utf8"
    );

    if (size > 3800) {
        return (
            "Your tracker cookie is full. Nothing was saved. " +
            "Save any records you need before clearing the tracker."
        );
    }

    res.cookie(v2CookieName, data, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: v2CookiePath,
        httpOnly: true,
        sameSite: "lax"
    });

    return "";
}

// Prepare the entry page, including saved monthly budgets and errors.
function v2RenderForm(res, data, notice, fields, error, status) {
    const month = fields.month || v2CurrentMonth();
    const record = v2FindMonth(data, month);
    const budgetRows = [];

    for (let i = 0; i < data.months.length; i++) {
        budgetRows.push({
            month: data.months[i].month,
            budget: dollars(data.months[i].budget)
        });
    }

    res.status(status || 200).render("tracker-v2", {
        notice: notice,
        error: error,
        today: v2Today(),
        currentMonth: v2CurrentMonth(),
        month: month,
        budget: fields.budget || "",
        savedBudget: record ? dollars(record.budget) : "",
        budgets: budgetRows,
        date: fields.date || v2Today(),
        amount: fields.amount || "",
        foodSelected: fields.category === "food",
        gasSelected: fields.category === "gas",
        funSelected: fields.category === "fun"
    });
}

// Build the selected month's meter and completed-month savings display.
function v2BudgetView(data, month) {
    const record = v2FindMonth(data, month);
    const monthOptions = [];
    const savingsRows = [];
    let totalSavings = 0;
    let hasCurrentOption = false;

    for (let i = 0; i < data.months.length; i++) {
        const item = data.months[i];

        monthOptions.push({
            month: item.month,
            selected: item.month === month
        });

        if (item.month === v2CurrentMonth()) {
            hasCurrentOption = true;
        }

        if (item.month < v2CurrentMonth()) {
            const savings = Math.max(item.budget - item.spent, 0);
            const over = Math.max(item.spent - item.budget, 0);

            totalSavings += savings;

            savingsRows.push({
                month: item.month,
                budget: dollars(item.budget),
                spent: dollars(item.spent),
                savings: dollars(savings),
                over: dollars(over)
            });
        }
    }

    if (!hasCurrentOption) {
        monthOptions.push({
            month: v2CurrentMonth(),
            selected: month === v2CurrentMonth()
        });
    }

    let percent = 0;
    let status = "Set a monthly budget to see your budget meter.";
    let warning = "";
    let remaining = "";
    let over = "";

    if (record) {
        percent = record.spent / record.budget * 100;

        if (record.spent < record.budget) {
            const remainingCents = record.budget - record.spent;

            remaining = dollars(remainingCents);
            status = remaining + " remaining.";

            if (percent >= 75) {
                const remainingPercent =
                    remainingCents / record.budget * 100;

                let percentText;

                if (remainingPercent < 0.1) {
                    percentText = "less than 0.1";
                } else {
                    percentText = String(
                        Number(remainingPercent.toFixed(1))
                    );
                }

                warning =
                    "You have " + percentText +
                    "% of your budget left to spend. Be careful.";
            }
        } else if (record.spent === record.budget) {
            status = "Budget reached.";
            warning = "Budget reached. You have no budget left to spend.";
        } else {
            over = dollars(record.spent - record.budget);
            status = "Budget exceeded by " + over + ".";
            warning = status;
        }
    }

    return {
        selectedMonth: month,
        monthOptions: monthOptions,
        hasBudget: Boolean(record),
        budget: record ? dollars(record.budget) : "",
        monthlySpent: record ? dollars(record.spent) : "",
        remaining: remaining,
        over: over,
        percentUsed: percent.toFixed(1),
        budgetStatus: status,
        warning: warning,
        budgetAnimationData: JSON.stringify({
            percent: percent,
            warning: warning,
            danger: Boolean(record && record.spent >= record.budget)
        }),
        savingsRows: savingsRows,
        hasSavingsHistory: savingsRows.length > 0,
        recordedSavings: dollars(totalSavings)
    };
}

// Show the v2 budget and expense forms.
app.get("/tracker/v2", function(req, res) {
    const result = v2Read(req);
    let month = req.query.month;

    if (!v2ValidMonth(month) || month > v2CurrentMonth()) {
        month = v2CurrentMonth();
    }

    v2RenderForm(
        res,
        result.data,
        result.notice,
        { month: month },
        "",
        200
    );
});

// Validate and save a monthly budget without adding an expense.
app.post("/tracker/v2/budget", function(req, res) {
    const result = v2Read(req);
    const month = req.body.month;
    const budget = req.body.budget;
    const cents = amountToCents(budget);
    const fields = {
        month: typeof month === "string" ? month : "",
        budget: typeof budget === "string" ? budget : ""
    };

    let error = result.notice;

    if (!error && (
        !v2ValidMonth(month) ||
        month > v2CurrentMonth()
    )) {
        error = "Choose a valid month that is not in the future.";
    }

    if (!error && cents === null) {
        error =
            "Enter a budget greater than zero with no more " +
            "than two decimal places.";
    }

    if (!error) {
        const record = v2FindMonth(result.data, month);

        if (record) {
            record.budget = cents;
        } else {
            result.data.months.push({
                month: month,
                budget: cents,
                spent: 0
            });
        }

        error = v2Save(res, result.data);
    }

    if (error) {
        return v2RenderForm(
            res, result.data, result.notice, fields, error, 400
        );
    }

    res.redirect(
        "/tracker/v2/dashboard?month=" + encodeURIComponent(month)
    );
});

// Validate an expense and update its monthly total exactly once.
app.post("/tracker/v2", function(req, res) {
    const result = v2Read(req);
    const date = req.body.date;
    const amount = req.body.amount;
    const category = req.body.category;
    const cents = amountToCents(amount);

    const fields = {
        date: typeof date === "string" ? date : "",
        amount: typeof amount === "string" ? amount : "",
        category: typeof category === "string" ? category : ""
    };

    let error = result.notice;
    let month = "";
    let record = null;

    if (!error && (!validDate(date) || date > v2Today())) {
        error = "Enter a real date that is not in the future.";
    }

    if (!error && cents === null) {
        error =
            "Enter an amount greater than zero with no more " +
            "than two decimal places.";
    }

    if (!error && !categories.includes(category)) {
        error = "Please choose Food, Gas, or Fun.";
    }

    if (!error) {
        month = date.slice(0, 7);
        fields.month = month;
        record = v2FindMonth(result.data, month);

        if (!record) {
            error =
                "Save a monthly budget for " + month +
                " before adding an expense for that month.";
        }
    }

    if (!error && !Number.isSafeInteger(record.spent + cents)) {
        error = "That amount is too large to calculate accurately.";
    }

    if (!error) {
        record.spent += cents;

        result.data.entries.push({
            date: date,
            amount: cents / 100,
            category: category
        });

        result.data.entries = result.data.entries.slice(-30);

        error = v2Save(res, result.data);
    }

    if (error) {
        return v2RenderForm(
            res, result.data, result.notice, fields, error, 400
        );
    }

    res.redirect(
        "/tracker/v2/dashboard?month=" + encodeURIComponent(month)
    );
});

// Render charts from recent entries and budgeting from monthly records.
app.get("/tracker/v2/dashboard", function(req, res) {
    const result = v2Read(req);
    let month = req.query.month;

    if (!v2ValidMonth(month) || month > v2CurrentMonth()) {
        month = v2CurrentMonth();
    }

    if (
        month !== v2CurrentMonth() &&
        !v2FindMonth(result.data, month)
    ) {
        month = v2CurrentMonth();
    }

    const view = buildDashboard(result.data.entries);
    const budgetView = v2BudgetView(result.data, month);

    Object.assign(view, budgetView);
    view.notice = result.notice;

    res.render("dashboard-v2", view);
});

// Clear only v2 data while preserving the v1 cookie.
app.post("/tracker/v2/clear", function(req, res) {
    res.clearCookie(v2CookieName, {
        path: v2CookiePath,
        httpOnly: true,
        sameSite: "lax"
    });

    res.redirect("/tracker/v2/dashboard");
});



// Start the Express server.
app.listen(port, function() {
    console.log("Server running at http://localhost:" + port);
});