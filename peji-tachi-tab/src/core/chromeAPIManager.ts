import { fakeTabsForTesting } from '@/data/fakeData'

export function getTabsByWindowsId(windowId: number): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    chrome.tabs.query(
      {
        windowId
      },
      (tabs: chrome.tabs.Tab[]) => {
        resolve(tabs)
      }
    )
  })
}

export function getAllTabsFromAllWindows(): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    let allTabs: chrome.tabs.Tab[] = []
    if (chrome.windows === undefined) {
      return resolve(fakeTabsForTesting)
    }
    chrome.windows.getAll(
      {
        windowTypes: ['normal']
      },
      async (windows) => {
        for (let i = 0; i < windows.length; i++)
          if (windows[i].id !== undefined)
            allTabs = allTabs.concat(await getTabsByWindowsId(windows[i].id!))

        resolve(allTabs)
      }
    )
  })
}
