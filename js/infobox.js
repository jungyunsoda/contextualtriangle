(function () {
  var pageTitle = document.querySelector(".page__title");
  var infoboxTitle = document.querySelector(".infobox__title");
  if (!pageTitle || !infoboxTitle) return;

  var infobox = infoboxTitle.closest(".infobox");
  var ticking = false;

  function update() {
    ticking = false;
    var stickyTop = infobox ? parseFloat(getComputedStyle(infobox).top) : 24;
    if (isNaN(stickyTop)) stickyTop = 24;
    var titleBottom = pageTitle.getBoundingClientRect().bottom;
    // Hidden while the page title is still on screen. Once it scrolls
    // past the sticky line, the infobox title stays with the infobox.
    infoboxTitle.classList.toggle("is-hidden", titleBottom > stickyTop);
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
})();
