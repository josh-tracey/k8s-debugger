#!node
import { mainMenu, contextSwitcher } from './questions'
// import { showPodDetails } from './api/k8s/resources'

const run = async () => {
  console.clear()
  await contextSwitcher()
  await mainMenu()
}

run()

// showPodDetails('default', 'core-kernel-5ff4566b67-8tkkf').then((pod) =>
//   console.log(JSON.stringify(pod, null, " "))
// )
