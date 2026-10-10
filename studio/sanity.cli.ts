import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: 'hha7i7up', dataset: 'production'},
  project: {basePath: '/studio'},
  // Bundle the studio with the site rather than loading it from Sanity's CDN.
  deployment: {autoUpdates: false},
})
