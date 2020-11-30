import { IOperation } from './interface'
import { getSecret } from '../api/k8s/resources'
import RootStore from '../store'
import { selector } from './prompts';

const DisplaySecrets: IOperation = {
  execute: async () => {
    const secrets = (await selector('secrets', 'checkbox-plus'))
      .selection as string[]
    const secretDetails = await Promise.all(
      secrets.map(async (secret: string) => {
        const secretResource = await getSecret(
          secret,
          RootStore.currentNamespace
        )
        return {
          [secretResource.metadata?.name!]: Object.keys(
            secretResource.data!
          ).map((key) => {
            return {
              [key]: Buffer.from(
                secretResource.data![key],
                'base64'
              ).toLocaleString(),
            }
          }),
        }
      })
    )
    console.log(JSON.stringify(secretDetails, null, ' '))
  },
  label: 'Display Secrets',
}

export default DisplaySecrets
