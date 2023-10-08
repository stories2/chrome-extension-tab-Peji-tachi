window.onload = function () {
  document.getElementById("openManagerTab").addEventListener("click", () => {
    chrome.tabs.create({ url: "newtab/newtab.html" });
  });
};
