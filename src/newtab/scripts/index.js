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

function simpleQuery(inputTxt) {
  const tabs = selectAllTabsFromDB();
  const filteredTabs = tabs.filter(
    (tab) =>
      (tab.title || "").includes(inputTxt) || (tab.url || "").includes(inputTxt)
  );
  appendTabsToTabList(filteredTabs);
}

function onSearchInputChanges(e) {
  console.log(e.target.value);
  resetTabsFromTabList();
  simpleQuery(e.target.value);
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

const tabDB = {};

window.onload = async function () {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("changeInfo status", changeInfo.status, changeInfo, tab);
    if (changeInfo.status === "loading") {
      const { openerTabId, title, url, id } = tab;
      if (typeof openerTabId !== "undefined") {
        console.log(
          "open in new tab. parent:",
          openerTabId,
          " id:",
          id,
          title,
          url
        );
        linkChildTabAndParentTab(openerTabId, id);
        insertTabsToDB([tab]);
        console.log("parent:", tabDB[openerTabId]);
        console.log("child:", tabDB[id]);
      } else {
        updateTabsToDB([tab]);
        console.log("opened|restored tab url updated. id:", id, title, url);
        console.log("tab db:", tabDB[id]);
      }
    }
  });
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // console.log(tabId, removeInfo);
    updateTabStatus(tabId, "removed");
    console.log("rm tab:", tabDB[tabId]);
  });
  document
    .getElementById("inputSearchBar")
    .addEventListener("change", onSearchInputChanges);

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
  });
  const tabs = await getAllTabsFromAllWindows();
  //   console.log("tabs", tabs);
  insertTabsToDB(tabs);
  console.log(tabDB);
  appendTabsToTabList(selectAllTabsFromDB());
};

function insertTabsToDB(tabs = []) {
  tabs.forEach((tab) => ((tab["children"] = []), (tabDB[tab.id] = tab)));
}

function updateTabsToDB(tabs = []) {
  tabs.forEach((tab) => {
    tabDB[tab.id] = {
      children: [],
      ...tab,
      ...(tabDB[tab.id] || {}),
    };
  });
}

/**
 * @param {number} tabId
 * @param {string} status complete|loading|removed|unloaded
 */
function updateTabStatus(tabId, status = "complete") {
  tabDB[tabId].status = status;
}

function linkChildTabAndParentTab(parentTabId, childTabId) {
  if (!tabDB[parentTabId]["children"].includes(childTabId))
    tabDB[parentTabId]["children"].push(childTabId);
  else console.warn(parentTabId, "<->", childTabId, " already linked");
}

function selectAllTabsFromDB() {
  return Object.keys(tabDB).map((tabId) => tabDB[tabId]);
}
