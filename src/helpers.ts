import { V1ContainerState } from '@kubernetes/client-node'
import { FgGreen, FgLightGreen, FgRed, Reset } from './colors'

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const colorStatus = (status?: string) => {
  if (status === 'Running') {
    return `${FgLightGreen}${status}${Reset}`
  } else if (status === 'Succeeded') {
    return `${FgGreen}${status}${Reset}`
  } else if (
    status === 'Failed' ||
    status === 'Terminating' ||
    status === 'Terminated'
  ) {
    return `${FgRed}${status}${Reset}`
  }
  return status || 'Unknown'
}

export const findState = (state: V1ContainerState) => {
  if (state.running) {
    return 'Running'
  } else if (state.terminated) {
    return 'Terminating'
  } else if (state.waiting) {
    return 'Waiting'
  } else {
    return 'Unknown'
  }
}
