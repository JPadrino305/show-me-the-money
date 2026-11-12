let budgetMeterStarted = false;
let budgetWarningShown = false;
let budgetSettings = null;
let budgetPanelObserver = null;

// Show the warning once without interrupting the user's keyboard focus.
function showBudgetWarning() {
    if (
        budgetWarningShown ||
        !budgetSettings ||
        !budgetSettings.warning
    ) {
        return;
    }

    const popup = document.getElementById("budget-popup");
    const message = document.getElementById("budget-popup-message");

    if (!popup || !message) {
        return;
    }

    budgetWarningShown = true;
    message.textContent = budgetSettings.warning;
    popup.hidden = false;
}

// Dismiss the popup and preserve a useful keyboard focus position.
function closeBudgetWarning() {
    const popup = document.getElementById("budget-popup");
    const closeButton = document.getElementById("budget-popup-close");
    const panel = document.getElementById("budget-panel");

    if (!popup) {
        return;
    }

    const focusWasInside = popup.contains(document.activeElement);

    popup.hidden = true;

    if (focusWasInside && panel) {
        panel.setAttribute("tabindex", "-1");
        panel.focus({ preventScroll: true });
    }
}

// Close a visible warning when the user presses Escape.
function handleBudgetEscape(event) {
    if (event.key === "Escape") {
        closeBudgetWarning();
    }
}

// Reveal the correct proportion of the meter and show any warning.
function startBudgetMeter() {
    if (budgetMeterStarted || !budgetSettings) {
        return;
    }

    budgetMeterStarted = true;

    const meter = document.getElementById("budget-meter");
    const fill = document.getElementById("budget-meter-fill");

    const percentage = Math.max(
        0,
        Math.min(100, budgetSettings.percent)
    );

    if (budgetSettings.danger) {
        meter.classList.add("is-danger");
    }

    fill.style.clipPath =
        "inset(0 " + (100 - percentage) + "% 0 0)";

    showBudgetWarning();

    if (budgetPanelObserver) {
        budgetPanelObserver.disconnect();
    }
}

// Start the animation when the budget panel enters the viewport.
function handleBudgetIntersection(entries) {
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
            startBudgetMeter();
            break;
        }
    }
}

// Prepare the meter, scroll observer, and popup controls.
function initializeBudgetMeter() {
    const dataElement = document.getElementById(
        "budget-animation-data"
    );

    const panel = document.getElementById("budget-panel");
    const meter = document.getElementById("budget-meter");
    const fill = document.getElementById("budget-meter-fill");
    const closeButton = document.getElementById("budget-popup-close");

    // A month without a budget has no meter to initialize.
    if (!dataElement || !panel || !meter || !fill) {
        return;
    }

    try {
        budgetSettings = JSON.parse(dataElement.dataset.values);
    } catch (error) {
        return;
    }

    if (
        typeof budgetSettings.percent !== "number" ||
        !Number.isFinite(budgetSettings.percent)
    ) {
        return;
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeBudgetWarning);
    }

    document.addEventListener("keydown", handleBudgetEscape);

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
        const percentage = Math.max(
            0,
            Math.min(100, budgetSettings.percent)
        );

        fill.style.transition = "none";
        fill.style.clipPath =
            "inset(0 " + (100 - percentage) + "% 0 0)";

        if (budgetSettings.danger) {
            meter.classList.add("is-danger");
        }
    }

    if ("IntersectionObserver" in window) {
        budgetPanelObserver = new IntersectionObserver(
            handleBudgetIntersection,
            { threshold: 0 }
        );

        budgetPanelObserver.observe(panel);
    } else {
        requestAnimationFrame(startBudgetMeter);
    }
}

initializeBudgetMeter();