export interface BasicTabModel {
  active: boolean
  audible: boolean
  autoDiscardable: boolean
  children: number[]
  created_time: number
  discarded: boolean
  favIconUrl?: string
  groupId: number
  hash: string
  height: number
  highlighted: boolean
  host: string
  hostname: string
  id: number //tab id
  index: number
  origin: string
  password: string
  pathname: string
  pinned: boolean
  port: string
  protocol: string // https: / chrome-extension:
  search: string
  selected: boolean
  status: string
  title: string
  updated_time: number
  url: string
  username: string
  width: number
  windowId: number
}
