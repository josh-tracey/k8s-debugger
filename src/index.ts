#!node
import { mainMenu } from './mainMenu'
import ContextSwitcher from './operations/contextSwitch'

const run = async () => {
  console.clear()
  await ContextSwitcher.execute()
  await mainMenu()
}

run()
