(function () {
  // Lightweight, small-range scroll snapping for section subtitles.
  // Only snaps when the user has stopped scrolling and a heading is within
  // SNAP_RANGE pixels of the infobox title.
  var SNAP_RANGE = 140;

  var headings = Array.prototype.slice.call(
    document.querySelectorAll(".content h2")
  );
  if (!headings.length) return;

  var infobox = document.querySelector(".infobox");
  var timer = null;
  var isSnapping = false;

  function targetOffset() {
    if (!infobox) return 24;
    var top = parseFloat(getComputedStyle(infobox).top);
    return isNaN(top) ? 24 : top;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (isSnapping) return;
      clearTimeout(timer);
      timer = setTimeout(maybeSnap, 120);
    },
    { passive: true }
  );

  function maybeSnap() {
    var offset = targetOffset();
    var best = null;
    var bestDistance = Infinity;

    for (var i = 0; i < headings.length; i += 1) {
      var top = headings[i].getBoundingClientRect().top;
      var distance = Math.abs(top - offset);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = headings[i];
      }
    }

    if (!best || bestDistance > SNAP_RANGE || bestDistance < 2) return;

    isSnapping = true;
    var y = window.scrollY + best.getBoundingClientRect().top - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setTimeout(function () {
      isSnapping = false;
    }, 500);
  }
})();
