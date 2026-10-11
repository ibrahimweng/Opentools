import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {tool} from './schemaTypes/tool'
import {siteSettings} from './schemaTypes/siteSettings'
import {structure} from './structure'
import {importTool} from './importTool'

// The OpenTools studio, served from the site at /studio. The project id and
// dataset are public by design: the site reads the same dataset without a key.
export default defineConfig({
  name: 'default',
  title: 'OpenTools',
  // No basePath here: /studio is set once, in sanity.cli.ts. Setting it in
  // both places joins them, and the studio ends up at /studio/studio.
  projectId: 'hha7i7up',
  dataset: 'production',
  plugins: [structureTool({structure}), importTool()],
  schema: {types: [siteSettings, tool]},
  document: {
    // A tool is created from the Tools list, which places it in order; the
    // global "Create" menu would skip that. Site settings is one document,
    // opened from its own item.
    newDocumentOptions: (prev) =>
      prev.filter((item) => item.templateId !== 'tool' && item.templateId !== 'siteSettings'),
    // Site settings can be edited and published, but not copied, taken down
    // or deleted.
    actions: (prev, {schemaType}) =>
      schemaType === 'siteSettings'
        ? prev.filter(({action}) => action !== 'duplicate' && action !== 'unpublish' && action !== 'delete')
        : prev,
  },
})
