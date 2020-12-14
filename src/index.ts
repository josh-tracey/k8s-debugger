#!node
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { mainMenu } from './mainMenu'
// import { showPodDetails } from './api/k8s/resources'
import ContextSwitcher from './operations/contextSwitch'

const run = async () => {
  console.clear()
  await ContextSwitcher.execute()
  await mainMenu()
}

createConnection()
  .then((connection) => {
    run()
  })
  .catch((error) => console.log(error))
