import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

// Site settings, for the title and bio at the top of the page, then the
// tools, in the order the site shows them. Drag a tool to move it; the site
// follows within about a minute.
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('OpenTools')
    .items([
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),
      S.divider(),
      orderableDocumentListDeskItem({type: 'tool', title: 'Tools', S, context}),
    ])
