#!node
import 'reflect-metadata'
import { mainMenu } from './mainMenu'
import ContextSwitcher from './operations/contextSwitch'
import NamespaceSwitcher from './operations/namespaceSwitcher'

const run = async () => {
  console.clear()
  await ContextSwitcher.execute()
  await NamespaceSwitcher.execute()
  await mainMenu()
}

run()
