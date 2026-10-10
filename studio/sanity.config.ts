import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {tool} from './schemaTypes/tool'
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
  schema: {types: [tool]},
  document: {
    // A tool is created from the Tools list, which places it in order; the
    // global "Create" menu would skip that.
    newDocumentOptions: (prev) => prev.filter((item) => item.templateId !== 'tool'),
  },
})
