import RootStore from '../store'
import { ILog } from '../store/index'
import { FgBlue, FgGreen, FgYellow, Reset } from '../colors'
import api from '../api'
import { IOperation } from './interface'
import { selector } from './prompts'

const LogMerger: IOperation = {
  execute: async () => {
    const start = new Date().getTime()
    RootStore.clearLogs()
    const question = await selector('pods', 'checkbox-plus')
    const selection = question.selection as string[]

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
  },
  label: 'Log Merger',
}

export default LogMerger
