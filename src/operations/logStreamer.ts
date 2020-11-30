import api from '../api'
import { mainMenu } from '../mainMenu'
import RootStore from '../store'
import { stdout } from 'process'
import { LogGrouper, LogTagger } from '../streaming/tranformers'
import { IOperation } from './interface'
import { selector } from './prompts'

const LogGrouping = new LogGrouper()

const LogStreamer: IOperation = {
  execute: async () => {
    console.clear()
    const choices: string[] = (await selector('pods', 'checkbox-plus'))
      .selection as string[]

    LogGrouping.pipe(stdout)

    if (choices.length > 0) {
      const tagStreams = choices.map((name: string) => {
        const LogTagging = new LogTagger(name)
        api.streamLog(name, RootStore.currentNamespace, LogTagging)
        return LogTagging
      })
      tagStreams.forEach((tagStream) => tagStream.pipe(LogGrouping))
    } else {
      console.clear()
      mainMenu()
    }
  },
  label: 'Log Streamer',
}

export default LogStreamer
