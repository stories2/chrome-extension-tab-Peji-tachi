function getTabsByWindowsId(windowId) {
  return new Promise((resolve) => {
    chrome.tabs.query(
      {
        windowId,
      },
      (tabs) => {
        resolve(tabs);
      }
    );
  });
}

function getAllTabsFromAllWindows() {
  return new Promise((resolve) => {
    let allTabs = [];
    chrome.windows.getAll(
      {
        windowTypes: ["normal"],
      },
      async (windows) => {
        for (let i = 0; i < windows.length; i++)
          allTabs = allTabs.concat(await getTabsByWindowsId(windows[i].id));

        resolve(allTabs);
      }
    );
  });
}

async function simpleQuery(inputTxt) {
  const tabs = await getAllTabsFromAllWindows();
  const filteredTabs = tabs.filter(
    (tab) =>
      (tab.title || "").includes(inputTxt) || (tab.url || "").includes(inputTxt)
  );
  appendTabsToTabList(filteredTabs);
}

async function onSearchInputChanges(e) {
  console.log(e.target.value);
  resetTabsFromTabList();
  await simpleQuery(e.target.value);
}

function getTabListLayoutsByScreenSize() {
  return {
    lg: document.querySelector("#lg_tab_list").querySelectorAll("ul"),
    md: document.querySelector("#md_tab_list").querySelectorAll("ul"),
    xs: document.querySelector("#xs_tab_list").querySelectorAll("ul"),
  };
}

/**
 * @param {object} tabInfo favIconUrl, title, url
 * @returns {Element} li element
 */
function createTabItem(tabInfo) {
  const { favIconUrl, title, url } = tabInfo;
  const img = document.createElement("img");
  img.setAttribute("src", favIconUrl);
  img.setAttribute("class", "tab-favicon-img");
  const li = document.createElement("li");
  li.setAttribute(
    "class",
    "list-group-item list-group-item-action tab-item-text"
  );
  li.appendChild(img);

  const span = document.createElement("span");
  span.style.marginLeft = "10px";
  span.innerText = title;
  li.appendChild(span);
  return li;
}

function appendTabsToTabList(tabs = []) {
  const tabListLayouts = getTabListLayoutsByScreenSize();
  tabs.forEach((tab, idx) => {
    const lgLen = tabListLayouts.lg.length;
    const mdLen = tabListLayouts.md.length;
    const xsLen = tabListLayouts.xs.length;

    const li = createTabItem(tab);
    tabListLayouts.lg[idx % lgLen].appendChild(li);
    tabListLayouts.md[idx % mdLen].appendChild(li.cloneNode(true));
    tabListLayouts.xs[idx % xsLen].appendChild(li.cloneNode(true));
  });
}

function resetTabsFromTabList() {
  const tabListLayouts = getTabListLayoutsByScreenSize();
  tabListLayouts.lg.forEach((tabList) => tabList.replaceChildren());
  tabListLayouts.md.forEach((tabList) => tabList.replaceChildren());
  tabListLayouts.xs.forEach((tabList) => tabList.replaceChildren());
}

window.onload = async function () {
  document
    .getElementById("inputSearchBar")
    .addEventListener("change", onSearchInputChanges);

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
  });
  const tabs = await getAllTabsFromAllWindows();
  console.log("tabs", tabs);
  appendTabsToTabList(tabs);
};
