import api from '../api'
import { mainMenu } from '../mainMenu'
import RootStore from '../store'
import { stdout } from 'process'
import { LogGrouper, LogTagger } from '../streaming/tranformers'
import { IOperation } from './interface'
import { selector } from './prompts'



const LogStreamer: IOperation = {
  execute: async () => {
    const LogGrouping = new LogGrouper()
    console.clear()
    const choices: string[] = (await selector('pods', 'checkbox-plus'))
      .selection as string[]

    LogGrouping.pipe(stdout)

    if (choices.length > 0) {
      const tagStreams = await Promise.all(choices.map(async (name: string) => {
        const LogTagging = new LogTagger(name)
        await api.streamLog(name, RootStore.currentNamespace, LogTagging)
        return LogTagging
      }))
      await Promise.all(tagStreams.map(async(tagStream) => {
        tagStream.pipe(LogGrouping)

        await new Promise(done=> {
          LogGrouping.on("end", done)
          tagStream.on("finish", done)
        })
      }))

    } else {
      console.clear()
      mainMenu()
    }

  },
  label: 'Log Streamer',
}

export default LogStreamer
