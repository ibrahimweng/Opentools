import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

// One tool on the site. Every field here is something the page shows: the
// index lists name and category, and the pop-up shows the rest.
export const tool = defineType({
  name: 'tool',
  title: 'Tool',
  type: 'document',
  orderings: [orderRankOrdering],
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'media', title: 'Video'},
    {name: 'details', title: 'Details'},
  ],
  fields: [
    // Position in the list. Hidden; set by dragging rows in Tools.
    orderRankField({type: 'tool', newItemPosition: 'after'}),

    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Link name',
      description: 'Used in the tool’s own address on the site, e.g. opentools.art/#typeforge. Click Generate to make it from the name.',
      type: 'slug',
      group: 'basics',
      options: {source: 'name', maxLength: 48},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      description: 'One line, shown beside the name at the top of the pop-up.',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.max(80).warning('Longer than one line on most screens.'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      description: 'A word or two, shown under the name in the index. For example: Type, Icons, Sound.',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'url',
      title: 'Tool link',
      description: 'Where “Visit site” goes, e.g. https://typeforge.opentools.art. Left empty, the button reads “Live link soon”.',
      type: 'url',
      group: 'basics',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'hidden',
      title: 'Hide from the site',
      description: 'Keeps the tool here but takes it off the page.',
      type: 'boolean',
      group: 'basics',
      initialValue: false,
    }),

    defineField({
      name: 'video',
      title: 'Demo video',
      description: 'MP4, 10–30 seconds, ideally under 8 MB. Plays muted on a loop in the pop-up. Left empty, the tool’s animated preview plays instead.',
      type: 'file',
      group: 'media',
      options: {accept: 'video/mp4,video/webm,video/quicktime'},
    }),
    defineField({
      name: 'poster',
      title: 'Video still',
      description: 'Optional. Shown for the moment before the video starts.',
      type: 'image',
      group: 'media',
    }),

    defineField({
      name: 'lead',
      title: 'Short description',
      description: 'One sentence, shown first in the pop-up’s overview.',
      type: 'string',
      group: 'details',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'The overview. Leave an empty line between paragraphs.',
      type: 'text',
      rows: 8,
      group: 'details',
    }),
    defineField({
      name: 'features',
      title: 'What it does',
      description: 'A short list. Drag to reorder.',
      type: 'array',
      group: 'details',
      of: [
        defineArrayMember({
          name: 'feature',
          title: 'Feature',
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', title: 'Description', type: 'string'}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        }),
      ],
    }),
    defineField({
      name: 'runs',
      title: 'Runs',
      description: 'Where it runs, e.g. “In your browser. Fonts are never uploaded.”',
      type: 'string',
      group: 'details',
    }),
    defineField({
      name: 'stack',
      title: 'Built with',
      type: 'string',
      group: 'details',
    }),
    defineField({
      name: 'source',
      title: 'Source code link',
      description: 'The GitHub repository. Left empty, the link is hidden.',
      type: 'url',
      group: 'details',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'tagline', hidden: 'hidden', media: 'poster'},
    prepare({title, subtitle, hidden, media}) {
      return {title: hidden ? `${title} — hidden` : title, subtitle, media}
    },
  },
})
