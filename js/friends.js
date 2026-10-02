(function () {
  var listEl = document.getElementById("friends-list");
  var form = document.getElementById("friends-form");
  var edit = document.getElementById("friends-edit");
  var cancel = document.getElementById("friends-cancel");
  var statusEl = document.getElementById("friends-status");
  if (!listEl || !form || !edit) return;

  var tokenKey = "friends-tokens";
  var editingId = null;
  var shown = [];
  var linked = {};

  function tokens() {
    try {
      var stored = JSON.parse(localStorage.getItem(tokenKey) || "{}");
      return stored && typeof stored === "object" ? stored : {};
    } catch (e) {
      return {};
    }
  }

  function remember(id, token) {
    var all = tokens();
    all[id] = token;
    localStorage.setItem(tokenKey, JSON.stringify(all));
  }

  function forget(id) {
    var all = tokens();
    delete all[id];
    localStorage.setItem(tokenKey, JSON.stringify(all));
  }

  function owns(id) {
    return Boolean(tokens()[id]);
  }

  function setStatus(message) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
  }

  function request(body) {
    return call("/api/friends", body).catch(function () {
      return call("/.netlify/functions/friends", body);
    });
  }

  function call(url, body) {
    return fetch(url, {
      method: body ? "POST" : "GET",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = null;
          }
        }
        if (!data || !response.ok) {
          if (!body) return { friends: [] };
          throw new Error((data && data.error) || "Could not save.");
        }
        return data;
      });
    });
  }

  function keyOf(value) {
    return String(value).replace(/_/g, " ").trim().toLowerCase();
  }

  function lookup(items) {
    var titles = [];
    items.forEach(function (item) {
      (item.keywords || []).forEach(function (word) {
        if (titles.indexOf(word) === -1) titles.push(word);
      });
    });
    if (!titles.length) return Promise.resolve({});
    var endpoint =
      "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&titles=" +
      encodeURIComponent(titles.join("|"));
    return fetch(endpoint)
      .then(function (response) {
        return response.text();
      })
      .then(function (text) {
        var data = text ? JSON.parse(text) : {};
        return mapPages(titles, data.query || {});
      })
      .catch(function () {
        return {};
      });
  }

  function mapPages(titles, query) {
    var alias = {};
    (query.normalized || []).forEach(function (item) {
      alias[keyOf(item.from)] = item.to;
    });
    (query.redirects || []).forEach(function (item) {
      alias[keyOf(item.from)] = item.to;
    });
    var pages = {};
    Object.keys(query.pages || {}).forEach(function (id) {
      pages[keyOf(query.pages[id].title)] = query.pages[id];
    });

    function resolve(name) {
      var current = name;
      var seen = {};
      while (alias[keyOf(current)] && !seen[keyOf(current)]) {
        seen[keyOf(current)] = true;
        current = alias[keyOf(current)];
      }
      return pages[keyOf(current)] || null;
    }

    var found = {};
    titles.forEach(function (title) {
      var page = resolve(title);
      found[title] = page && page.missing === undefined ? page.title : null;
    });
    return found;
  }

  function wikiHref(title) {
    return (
      "https://en.wikipedia.org/wiki/" +
      encodeURIComponent(title.replace(/ /g, "_"))
    );
  }

  function render(items, pages) {
    if (items !== undefined) shown = items;
    if (pages !== undefined) linked = pages;
    items = shown;
    pages = linked;
    listEl.textContent = "";
    if (!items.length) return;
    items.forEach(function (item) {
      var row = document.createElement("li");
      var name = document.createElement("span");
      name.className = "friends__name";
      name.textContent = item.name;
      row.appendChild(name);

      var keywords = item.keywords || [];
      if (keywords.length) {
        row.appendChild(document.createTextNode(" "));
        keywords.forEach(function (word, wordIndex) {
          if (wordIndex) row.appendChild(document.createTextNode(", "));
          var title = pages && pages[word];
          if (title) {
            var link = document.createElement("a");
            link.href = wikiHref(title);
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = word;
            row.appendChild(link);
          } else {
            row.appendChild(document.createTextNode(word));
          }
        });
      }

      if (!form.hidden && owns(item.id)) {
        var change = document.createElement("button");
        change.type = "button";
        change.className = "friends__remove";
        change.textContent = "[edit]";
        change.addEventListener("click", function () {
          openForm(item);
        });
        row.appendChild(change);

        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "friends__remove";
        remove.textContent = "[remove]";
        remove.addEventListener("click", function () {
          var token = tokens()[item.id];
          request({ action: "remove", id: item.id, token: token })
            .then(function () {
              forget(item.id);
              if (editingId === item.id) closeForm();
              return refresh();
            })
            .catch(function (error) {
              setStatus(error.message);
            });
        });
        row.appendChild(remove);
      }

      listEl.appendChild(row);
    });
  }

  function refresh() {
    return request()
      .then(function (data) {
        var friends = (data && data.friends) || [];
        setStatus("");
        render(friends, {});
        return lookup(friends).then(function (pages) {
          render(friends, pages);
        });
      })
      .catch(function () {
        render([], {});
        setStatus("");
      });
  }

  function openForm(item) {
    form.hidden = false;
    edit.setAttribute("aria-expanded", "true");
    render();
    var submit = form.querySelector("button[type=submit]");
    if (item) {
      editingId = item.id;
      form.elements.name.value = item.name;
      form.elements.keywords.value = (item.keywords || []).join(", ");
      if (submit) submit.textContent = "[save]";
      if (cancel) cancel.hidden = false;
    } else {
      editingId = null;
      form.reset();
      if (submit) submit.textContent = "[add]";
      if (cancel) cancel.hidden = true;
    }
    form.elements.name.focus();
  }

  function closeForm() {
    editingId = null;
    form.reset();
    form.hidden = true;
    edit.setAttribute("aria-expanded", "false");
    var submit = form.querySelector("button[type=submit]");
    if (submit) submit.textContent = "[add]";
    if (cancel) cancel.hidden = true;
    render();
  }

  edit.addEventListener("click", function () {
    if (form.hidden) openForm(null);
    else closeForm();
  });

  if (cancel) {
    cancel.addEventListener("click", function () {
      closeForm();
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var body = {
      action: editingId ? "update" : "add",
      name: form.elements.name.value,
      keywords: form.elements.keywords.value,
    };
    if (editingId) {
      body.id = editingId;
      body.token = tokens()[editingId];
    }
    request(body)
      .then(function (data) {
        if (data && data.token && data.friend) remember(data.friend.id, data.token);
        closeForm();
        return refresh();
      })
      .catch(function (error) {
        setStatus(error.message);
      });
  });

  refresh();
})();
