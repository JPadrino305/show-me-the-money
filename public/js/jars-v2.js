Keep all the chart code unchanged in dashboard-v2.js. The new dashboard uses the same chart element IDs and data format.
Update the large-total label in jars-v2.js

In the new copy only, find:

javascript
      if (totalNotes > 100) {
        textSize(15);

        text(
            (totalNotes - 100) + " additional notes not pictured",
            centerX,
            bottom + 57
        );

        text(
            fullNotes + " full notes; remainder " +
            formatCents(remainder),
            centerX,
            bottom + 78
        );
    }