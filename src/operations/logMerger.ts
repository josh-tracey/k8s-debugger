import RootStore from '../store'
import { Selection, mainMenu } from '../questions'
import { ILog } from '../store/index'
import { FgBlue, FgGreen, FgYellow, Reset } from '../colors'
import api from '../api'

export const logsConsole = async (answer: Selection) => {
  const start = new Date().getTime()
  RootStore.clearLogs()
  const selection = answer.selection as string[]

  await Promise.all(
    selection.map(async (name: string) => {
      const logs = await api.getLogs(name, RootStore.currentNamespace)
      return logs?.map(async (matchedLine: RegExpExecArray | null) => {
        if (matchedLine) {
          RootStore.addLog({
            podName: name,
            timestamp: new Date(matchedLine[1]),
            log: matchedLine[2],
          })
        }
      })
    })
  )
  RootStore.sortLogs()
  const end = new Date().getTime() - start
  let prevLogRecord: ILog | null = null
  RootStore.currentLogs.forEach((log: ILog) => {
    if (prevLogRecord) {
      if (prevLogRecord.podName !== log.podName)
        console.log(
          `\n${FgYellow}[${log.podName}] ${FgGreen} ${
            log.timestamp
          }${Reset}\n${FgBlue}${log.timestamp.getHours()}:${log.timestamp.getMinutes()}:${log.timestamp.getSeconds()}.${log.timestamp.getMilliseconds()}${Reset}`,
          log.log
        )
      else {
        console.log(
          `${FgBlue}${log.timestamp.getHours()}:${log.timestamp.getMinutes()}:${log.timestamp.getSeconds()}.${log.timestamp.getMilliseconds()}${Reset}`,
          log.log
        )
      }
    } else {
      console.log(
        `${FgBlue}${log.timestamp.getHours()}:${log.timestamp.getMinutes()}:${log.timestamp.getSeconds()}.${log.timestamp.getMilliseconds()}${Reset}`,
        log.log
      )
    }
    prevLogRecord = log
  })
  console.info('Merge time: %ds', end / 1000.0)
  mainMenu()
}
