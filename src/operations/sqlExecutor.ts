import { IOperation } from './interface'
import * as fs from 'fs'
import { env } from 'process'
import inquirer = require('inquirer')

const sql_dir = env.SQL_DIR || 'sql'

const preaddir = async (dir: string) => {
  return new Promise<string[]>((done, error) => {
    return fs.readdir(dir, (err, files: string[]) => {
      if (err) {
        error(err)
      }
      done(files)
    })
  })
}

const SQLExecutor: IOperation = {
  execute: async () => {
    const files = await preaddir(sql_dir)

    const selected = await inquirer.prompt({
      type: 'checkbox',
      name: 'sql_files',
      message: 'Select sql files to execute',
      choices: files,
    })

    console.log('Selected: ', selected)
  },
  label: 'SQL Executor',
}

export default SQLExecutor
