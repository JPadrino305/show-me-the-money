

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