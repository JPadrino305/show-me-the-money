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

// Start the Express server.
app.listen(port, function() {
    console.log("Server running at http://localhost:" + port);
});