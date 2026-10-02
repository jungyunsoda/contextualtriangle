(function () {
  var badge = document.createElement("span");
  badge.className = "wiki-badge";
  badge.textContent = "W";
  badge.hidden = true;
  document.body.appendChild(badge);

  var current = null;

  document.addEventListener("mouseover", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var link = target.closest('a[href*="wikipedia.org"]');
    if (!link || link === current) return;
    current = link;
    move(event);
    badge.hidden = false;
  });

  document.addEventListener("mousemove", function (event) {
    if (!current) return;
    move(event);
  });

  document.addEventListener("mouseout", function (event) {
    if (!current) return;
    if (current.contains(event.relatedTarget)) return;
    current = null;
    badge.hidden = true;
  });

  function move(event) {
    badge.style.left = event.clientX + "px";
    badge.style.top = event.clientY + "px";
  }
})();
