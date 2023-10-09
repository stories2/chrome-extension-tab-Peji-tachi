const pejiTachiBroadcastChaneelInstance = new BroadcastChannel('peji-tachi')

export const pejiTachiBroadcastChaneel = pejiTachiBroadcastChaneelInstance

pejiTachiBroadcastChaneel.onmessage = async (event: MessageEvent<any>) => {
  switch (event.data.method) {
    case 'returnEventLog':
      console.log('event', event.data)
      break
    case 'pong':
      console.log('pong')
      break
  }
}
