// https://developer.chrome.com/docs/extensions/mv3/service_workers/basics/

const eventLog = [];

const channel4Broadcast = new BroadcastChannel("peji-tachi");
channel4Broadcast.onmessage = (event) => {
  switch (event.data.method) {
    case "resetEventLog":
      eventLog.length = 0;
      break;
    case "getEventLog":
      channel4Broadcast.postMessage({
        method: "returnEventLog",
        data: eventLog,
      });
      eventLog.length = 0;
      break;
  }
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("changeInfo status", changeInfo.status, changeInfo, tab);
  if (changeInfo.status === "loading") {
    const { openerTabId, title, url, id } = tab;
    if (typeof openerTabId !== "undefined") {
      eventLog.push({
        type: "openInNewTab",
        tab,
      });
    } else {
      eventLog.push({
        type: "openOrRestoredTab",
        tab,
      });
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  eventLog.push({
    type: "tabRemoved",
    tab: {
      id: tabId,
    },
  });
});

chrome.runtime.onInstalled.addListener(async (object) => {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: "newtab/newtab.html" });
  }
});
