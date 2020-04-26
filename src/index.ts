#!/usr/local/bin/node
import { mainMenu, contextSwitcher } from './questions'

const run = async () => {
  console.clear()
  await contextSwitcher()
  await mainMenu()
}

run()
