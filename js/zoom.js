(function () {
  var key = "presenter";

  function saved() {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function store(on) {
    try {
      sessionStorage.setItem(key, on ? "1" : "0");
    } catch (e) {}
  }

  if (saved()) document.documentElement.classList.add("is-large");

  function sync(button, on) {
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.textContent = on ? "\u2212" : "+";
    button.setAttribute(
      "aria-label",
      on ? "Leave presenter mode" : "Presenter mode"
    );
  }

  function ready() {
    var button = document.getElementById("zoom-toggle");
    if (!button) return;
    sync(button, document.documentElement.classList.contains("is-large"));
    button.addEventListener("click", function () {
      var pressed = document.documentElement.classList.toggle("is-large");
      store(pressed);
      sync(button, pressed);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
