import api from '../api'
import { Selection, mainMenu } from '../questions'
import RootStore from '../store'
import { stdout } from 'process'
import { LogGrouper, LogTagger } from '../streaming/tranformers'

const LogGrouping = new LogGrouper()

export const logsStream = async (answer: Selection) => {
  console.clear()
  const choices: string[] = answer.selection as string[]

  LogGrouping.pipe(stdout)

  if (choices.length > 0) {
    const tagStreams = choices.map((name: string) => {
      const LogTagging = new LogTagger(name)
      api.streamLog(name, RootStore.currentNamespace, LogTagging)
      return LogTagging
    })
    tagStreams.forEach((tagStream) => tagStream.pipe(LogGrouping))
  } else {
    mainMenu()
  }
}
