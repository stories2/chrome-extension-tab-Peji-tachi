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

  const aTag = document.createElement("a");
  aTag.style.marginLeft = "10px";
  aTag.innerText = title;
  aTag.setAttribute("href", url);
  aTag.setAttribute("target", "_blank");
  li.appendChild(aTag);
  return li;
}

function appendTabsToTabList(tabs = []) {
  const tabListLayouts = getTabListLayoutsByScreenSize();
  let idx = 0;
  for (let i = tabs.length - 1; i >= 0; i--) {
    const tab = tabs[i];
    const lgLen = tabListLayouts.lg.length;
    const mdLen = tabListLayouts.md.length;
    const xsLen = tabListLayouts.xs.length;

    const li = createTabItem(tab);
    tabListLayouts.lg[idx % lgLen].appendChild(li);
    tabListLayouts.md[idx % mdLen].appendChild(li.cloneNode(true));
    tabListLayouts.xs[idx % xsLen].appendChild(li.cloneNode(true));
    idx++;
  }
}

function resetTabsFromTabList() {
  const tabListLayouts = getTabListLayoutsByScreenSize();
  tabListLayouts.lg.forEach((tabList) => tabList.replaceChildren());
  tabListLayouts.md.forEach((tabList) => tabList.replaceChildren());
  tabListLayouts.xs.forEach((tabList) => tabList.replaceChildren());
}

/**
 * @param {object} event {method: string, data: Array[{type:string, tab:object}]} object
 */
function serviceWorkerEventHandler(eventLog = []) {
  eventLog.forEach((event) => {
    console.log("event", event);
    switch (event.type) {
      case "openInNewTab":
        const { openerTabId, id } = event.tab;
        console.log("openInNewTab parent", tabDB[openerTabId]);
        linkChildTabAndParentTab(openerTabId, id);
        insertTabsToDB([event.tab]);
        break;
      case "openOrRestoredTab":
        updateTabsToDB([event.tab]);
        break;
      case "tabRemoved":
        updateTabStatus(event.tab.id, "removed");
        break;
      default:
        console.warn("undefined event type", event.type);
        break;
    }
  });
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function closeSingleTabAndIgnoreException(tabId) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.remove(tabId, () => {
        resolve(true);
      });
    } catch (err) {
      console.error("close tab failed", tabId, err.message);
      resolve(false);
    }
  });
}

function closeAllTabExceptCurrentTab(tabs = []) {
  return new Promise(async (resolve) => {
    const { id: currentTabId } = await getCurrentTab();
    const tabIdListToRemove = tabs
      .map((tab) => tab.id)
      .filter((id) => id != currentTabId);
    let closedTabCnt = 0;
    for (let i = 0; i < tabIdListToRemove.length; i++) {
      const closeRe = await closeSingleTabAndIgnoreException(
        tabIdListToRemove[i]
      );
      if (closeRe) closedTabCnt++;
    }
    resolve(closedTabCnt);
  });
}

function onSaveTabsBtnClicked(e) {
  if (!requestCleaningTabs) {
    requestCleaningTabs = true;
    channel4Broadcast.postMessage({
      method: "getEventLog",
    });
  } else console.warn("already cleaning tabs is processing");
}

async function loadSavedTabsAndRuntimeTabs() {
  const savedTabs = JSON.parse(localStorage.getItem("peji-tachi") || "[]");
  console.log("loaded tabs", savedTabs.length);
  const tabs = await getAllTabsFromAllWindows();
  console.log("runtime tabs", tabs.length);
  //   console.log("tabs", tabs);
  insertTabsToDB(savedTabs.concat(tabs));
  console.log(tabDB);
}

async function onLoadTabsBtnClicked(e) {
  resetTabsFromTabList();
  await loadSavedTabsAndRuntimeTabs();
  appendTabsToTabList(selectAllTabsFromDB());
}

let requestCleaningTabs = false;
const tabDB = {};
const channel4Broadcast = new BroadcastChannel("peji-tachi");
channel4Broadcast.onmessage = async (event) => {
  switch (event.data.method) {
    case "returnEventLog":
      console.log("event", event.data);
      serviceWorkerEventHandler(event.data.data);

      if (requestCleaningTabs) {
        const tabs = selectAllTabsFromDB();
        localStorage.setItem("peji-tachi", JSON.stringify(tabs));
        console.log("saved tabs", tabs.length);
        await closeAllTabExceptCurrentTab(tabs);
        requestCleaningTabs = false;
      }
      break;
  }
};

window.onload = async function () {
  channel4Broadcast.postMessage({
    method: "getEventLog",
  });
  document
    .getElementById("inputSearchBar")
    .addEventListener("change", onSearchInputChanges);

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
  });

  document
    .getElementById("SaveTabsBtn")
    .addEventListener("click", onSaveTabsBtnClicked);
  document
    .getElementById("LoadTabsBtn")
    .addEventListener("click", onLoadTabsBtnClicked);

  await loadSavedTabsAndRuntimeTabs();
  appendTabsToTabList(selectAllTabsFromDB());
};

function insertTabsToDB(tabs = []) {
  console.log("insert", tabs, Object.keys(tabDB).length);
  tabs.forEach(
    (tab) => (
      (tab["children"] = []),
      (tab["created_time"] = Date.now()),
      (tab["updated_time"] = Date.now()),
      (tabDB[tab.id] = tab)
    )
  );
  tabs.forEach((tab) => {
    try {
      const urlData = new URL(tab.url);
      tabDB[tab.id] = {
        hash: urlData["hash"],
        host: urlData["host"],
        hostname: urlData["hostname"],
        origin: urlData["origin"],
        password: urlData["password"],
        pathname: urlData["pathname"],
        port: urlData["port"],
        protocol: urlData["protocol"],
        search: urlData["search"],
        username: urlData["username"],
        ...tab,
      };
    } catch (err) {
      console.error("id:", tab.id, tab.url, err.message);
    }
  });
  console.log("insert", tabs, Object.keys(tabDB).length);
}

function updateTabsToDB(tabs = []) {
  tabs.forEach((tab) => {
    tabDB[tab.id] = {
      children: [],
      ...tab,
      ...(tabDB[tab.id] || {}),
      updated_time: Date.now(),
    };
  });
  tabs.forEach((tab) => {
    try {
      const urlData = new URL(tab.url);
      tabDB[tab.id] = {
        ...tabDB[tab.id],
        hash: urlData["hash"],
        host: urlData["host"],
        hostname: urlData["hostname"],
        origin: urlData["origin"],
        password: urlData["password"],
        pathname: urlData["pathname"],
        port: urlData["port"],
        protocol: urlData["protocol"],
        search: urlData["search"],
        username: urlData["username"],
      };
    } catch (err) {
      console.error("id:", tab.id, tab.url, err.message);
    }
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
