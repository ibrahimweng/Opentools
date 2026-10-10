import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

// One list: the tools, in the order the site shows them. Drag a row to move
// it; the site follows within about a minute.
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('OpenTools')
    .items([orderableDocumentListDeskItem({type: 'tool', title: 'Tools', S, context})])
