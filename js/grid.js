(function () {
  var overlay = document.createElement("div");
  overlay.className = "grid-overlay";
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");

  var inner = document.createElement("div");
  inner.className = "grid grid-overlay__inner";
  for (var i = 0; i < 12; i++) {
    inner.appendChild(document.createElement("span"));
  }
  overlay.appendChild(inner);
  document.body.appendChild(overlay);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "g" || event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    overlay.hidden = !overlay.hidden;
  });
})();
