const dashboardData = JSON.parse(
    document.getElementById("dashboard-data").dataset.values
);

const categoryNames = ["food", "gas", "fun"];
const categoryLabels = ["Food", "Gas", "Fun"];
const categoryColors = ["#55d878", "#ff6565", "#40e0d0"];

// Format cents for category labels and other displays.
function formatCents(cents) {
    return "$" + (cents / 100).toFixed(2);
}

// Format dollar values on the line chart.
function formatAxisDollars(value) {
    return "$" + Number(value).toFixed(2);
}

// Show the exact daily dollar amount in a tooltip.
function dailyTooltip(context) {
    return context.dataset.label + ": $" +
        Number(context.parsed.y).toFixed(2);
}

// Show the category total in the pie chart tooltip.
function categoryTooltip(context) {
    return categoryLabels[context.dataIndex] + ": $" +
        Number(context.parsed).toFixed(2);
}

// Build the daily spending line chart.
function createDailyChart() {
    const datasets = [];

    for (let i = 0; i < categoryNames.length; i++) {
        const category = categoryNames[i];
        const values = [];

        for (let j = 0; j < dashboardData.dates.length; j++) {
            const date = dashboardData.dates[j];

            values.push(dashboardData.daily[date][category] / 100);
        }

        datasets.push({
            label: categoryLabels[i],
            data: values,
            borderColor: categoryColors[i],
            backgroundColor: categoryColors[i],
            borderWidth: 3,
            pointRadius: 4,
            tension: 0.15
        });
    }

    new Chart(document.getElementById("daily-chart"), {
        type: "line",
        data: {
            labels: dashboardData.dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: "white" }
                },
                tooltip: {
                    callbacks: { label: dailyTooltip }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Date",
                        color: "white"
                    },
                    ticks: { color: "white" },
                    grid: { color: "rgba(255,255,255,0.12)" }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Dollars spent",
                        color: "white"
                    },
                    ticks: {
                        color: "white",
                        callback: formatAxisDollars
                    },
                    grid: { color: "rgba(255,255,255,0.12)" }
                }
            }
        }
    });
}

// Build the category spending pie chart.
function createCategoryChart() {
    const values = [];
    const labels = [];

    for (let i = 0; i < categoryNames.length; i++) {
        const cents = dashboardData.totals[categoryNames[i]];

        values.push(cents / 100);
        labels.push(categoryLabels[i] + " — " + formatCents(cents));
    }

    new Chart(document.getElementById("category-chart"), {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: categoryColors,
                borderColor: "#442068",
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "white" }
                },
                tooltip: {
                    callbacks: { label: categoryTooltip }
                }
            }
        }
    });
}

createDailyChart();
createCategoryChart();