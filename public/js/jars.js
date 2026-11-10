const jarCategories = ["fun", "gas", "food"];
const jarLabels = ["Fun", "Gas", "Food"];
const noteValueCents = 2000;
const noteHeight = 22;
const noteGap = 5;
const jarWidth = 150;
const jarTop = 65;

let jarHeight = 230;
let jarCanvasWidth = 720;

// Create the canvas and make enough space for the banknotes.
function setup() {
    let largestNoteCount = 0;

    for (let i = 0; i < jarCategories.length; i++) {
        const cents = dashboardData.totals[jarCategories[i]];
        const count = Math.ceil(cents / noteValueCents);

        if (count > largestNoteCount) {
            largestNoteCount = count;
        }
    }

    /*
       Keep very large totals from creating an enormous canvas.
       The drawing explains any additional notes with a count.
    */
    const visibleRows = Math.min(largestNoteCount, 100);

    jarHeight = Math.max(
        230,
        visibleRows * (noteHeight + noteGap) + 45
    );

    jarCanvasWidth = Math.max(
        600,
        Math.min(900, document.getElementById("jars-container").clientWidth)
    );

    const canvas = createCanvas(
        jarCanvasWidth,
        jarTop + jarHeight + 105
    );

    canvas.parent("jars-container");
    canvas.attribute(
        "aria-label",
        "Three spending jars for Fun, Gas, and Food. " +
        "Category totals also appear above the jars."
    );

    textFont("Georgia");
    noLoop();
}

// Draw all three labeled spending jars.
function draw() {
    clear();

    for (let i = 0; i < jarCategories.length; i++) {
        const centerX = (jarCanvasWidth / 3) * (i + 0.5);
        const cents = dashboardData.totals[jarCategories[i]];

        drawJar(centerX, jarLabels[i], cents);
    }
}

// Draw a jar, its banknotes, and its exact category total.
function drawJar(centerX, label, cents) {
    const left = centerX - jarWidth / 2;
    const bottom = jarTop + jarHeight;
    const fullNotes = Math.floor(cents / noteValueCents);
    const remainder = cents % noteValueCents;
    const totalNotes = Math.ceil(cents / noteValueCents);
    const visibleNotes = Math.min(totalNotes, 100);

    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(26);
    text(label, centerX, 28);

    stroke(235, 225, 255);
    strokeWeight(3);
    fill(255, 255, 255, 18);
    rect(left, jarTop, jarWidth, jarHeight, 18);

    fill(210, 195, 230);
    rect(left - 5, jarTop - 12, jarWidth + 10, 20, 6);

    for (let i = 0; i < visibleNotes; i++) {
        let fraction = 1;

        if (i === totalNotes - 1 && remainder > 0) {
            fraction = remainder / noteValueCents;
        }

        const y = bottom - 18 - noteHeight -
            i * (noteHeight + noteGap);

        drawBanknote(left + 13, y, jarWidth - 26, fraction);
    }

    noStroke();
    fill(255);
    textSize(23);
    text(formatCents(cents), centerX, bottom + 28);

    if (totalNotes > 100) {
        textSize(15);
        text(
            fullNotes + " full notes + " + formatCents(remainder),
            centerX,
            bottom + 57
        );
        text("First 100 notes pictured", centerX, bottom + 78);
    }
}

// Draw a full $20 banknote or a proportional remaining banknote.
function drawBanknote(x, y, width, fraction) {
    const visibleWidth = width * fraction;

    stroke("#163d25");
    strokeWeight(1);
    fill("#6bd68a");
    rect(x, y, visibleWidth, noteHeight, 3);

    if (fraction === 1) {
        noStroke();
        fill("#163d25");
        textAlign(CENTER, CENTER);
        textSize(14);
        text("$20", x + width / 2, y + noteHeight / 2);
    }
}