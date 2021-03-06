#!node
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { mainMenu } from './mainMenu'
// import { showPodDetails } from './api/k8s/resources'
import ContextSwitcher from './operations/contextSwitch'
import NamespaceSwitcher from './operations/namespaceSwitcher'

const run = async () => {
  console.clear()
  await ContextSwitcher.execute()
  await NamespaceSwitcher.execute()
  await mainMenu()
}

createConnection().then(run)
