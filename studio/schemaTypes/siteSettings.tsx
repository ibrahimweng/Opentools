import {defineArrayMember, defineField, defineType} from 'sanity'
import seed from '../seed.json'

// A plain chain link for the editor's link button.
function LinkIcon() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 25 25" fill="none" aria-hidden="true">
      <path
        d="M11 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M14 11a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

// The words at the top of the page: the name written in glitter, and the bio
// beside the heading. There is only one of these, opened from Site settings.
// A new one starts with the words the site shows today.
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  initialValue: {title: seed.settings.title, bio: seed.settings.bio},
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      description: 'Written in glitter at the top of the page, and as the heading beside the bio. Also the browser tab’s name.',
      type: 'string',
      validation: (rule) => [
        rule.required(),
        rule.max(16).warning('A longer title is written smaller in the glitter.'),
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      description:
        'Shown beside the title, and reads on from it: “OpenTools makes focused tools…”. To link words, select them and press the link button. Enter starts a new paragraph.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [],
            annotations: [
              defineArrayMember({
                name: 'link',
                title: 'Link',
                type: 'object',
                icon: LinkIcon,
                fields: [
                  defineField({
                    name: 'href',
                    title: 'Address',
                    description: 'Opens in a new tab, e.g. https://weng.ink',
                    type: 'url',
                    validation: (rule) => rule.required().uri({scheme: ['http', 'https', 'mailto']}),
                  }),
                ],
              }),
            ],
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site settings'}),
  },
})
