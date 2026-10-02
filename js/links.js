(function () {
  // Colour convention:
  //   blue  — a real, pre-existing Wikipedia page (external link to wikipedia.org)
  //   red   — one of Yunso's own wiki pages (local .html link)
  // Pages listed here exist and can be opened. Every other local .html link is
  // still red, but does not navigate until that page is written.
  var writtenPages = [
    "index.html",
    "talk.html",
    "mind-in-motion.html",
    "stone.html",
    "dream-journal.html",
    "latent-chair.html",
    "ai-nushu.html",
    "cumulus.html",
    "self-and-ego.html",
    "trivial-things.html",
  ];

  var links = document.querySelectorAll('a[href*=".html"]');

  links.forEach(function (link) {
    var href = link.getAttribute("href");
    var file = href.split("/").pop().split("#")[0].split("?")[0];
    link.classList.add("is-own");
    if (writtenPages.indexOf(file) === -1) {
      markAsUnwritten(link);
    }
  });

  function markAsUnwritten(link) {
    link.setAttribute("role", "link");
    link.setAttribute("aria-disabled", "true");
    link.removeAttribute("href");
    link.addEventListener("click", function (event) {
      event.preventDefault();
    });
  }
})();
