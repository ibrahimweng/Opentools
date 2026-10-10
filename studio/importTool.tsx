import {useEffect, useState} from 'react'
import {definePlugin, useClient} from 'sanity'
import {Box, Button, Card, Container, Heading, Stack, Text} from '@sanity/ui'
import {LexoRank} from 'lexorank'
import seed from './seed.json'

// A plain download arrow, drawn here so the studio needs no icon package.
function DownloadIcon() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 25 25" fill="none" aria-hidden="true">
      <path d="M12.5 5v11M8 12l4.5 4.5L17 12M6 19.5h13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

type SeedTool = {slug: {current: string}; name: string; [key: string]: unknown}

// Copies the seven tools the site already describes into Sanity, so the
// studio starts filled in rather than empty. Uses the signed-in editor's own
// access, so no key is needed. Safe to press twice: a tool that is already
// here is left exactly as it is.
function ImportTool() {
  const client = useClient({apiVersion: '2025-02-19'})
  const [have, setHave] = useState<string[] | null>(null)
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const tools = seed.tools as SeedTool[]

  const load = () =>
    client
      .fetch<string[]>('*[_type == "tool" && !(_id in path("drafts.**"))]._id')
      .then(setHave)
      .catch(() => setHave([]))

  useEffect(() => {
    load()
  }, [client])

  const missing = have === null ? [] : tools.filter((t) => !have.includes(`tool-${t.slug.current}`))

  async function run() {
    setState('working')
    setError('')
    try {
      // Place new tools after any already in the list, in the site's order.
      const last = await client.fetch<string | null>(
        '*[_type == "tool" && defined(orderRank)] | order(orderRank desc)[0].orderRank',
      )
      let rank = last ? LexoRank.parse(last).genNext() : LexoRank.middle()
      const tx = client.transaction()
      for (const t of missing) {
        tx.createIfNotExists({...t, _id: `tool-${t.slug.current}`, _type: 'tool', orderRank: rank.toString()})
        rank = rank.genNext()
      }
      await tx.commit()
      await load()
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setState('error')
    }
  }

  return (
    <Container width={1} padding={5}>
      <Stack space={5}>
        <Heading size={3}>Import the tools</Heading>
        <Text muted>
          Copies the {tools.length} tools on the site today, with their names, taglines, descriptions, features and
          GitHub links, into the studio. After that, everything is edited in Tools.
        </Text>
        <Card padding={4} radius={3} border tone={missing.length ? 'primary' : 'positive'}>
          <Stack space={4}>
            {have === null ? (
              <Text>Checking what is already here…</Text>
            ) : missing.length ? (
              <Text>
                {missing.length} of {tools.length} still to import: {missing.map((t) => t.name).join(', ')}.
              </Text>
            ) : (
              <Text>All {tools.length} tools are in the studio. Open Tools to edit them.</Text>
            )}
            {missing.length > 0 && (
              <Box>
                <Button
                  icon={DownloadIcon}
                  text={state === 'working' ? 'Importing…' : `Import ${missing.length} tools`}
                  tone="primary"
                  disabled={state === 'working'}
                  onClick={run}
                />
              </Box>
            )}
            {state === 'done' && !missing.length && <Text>Done. Every tool is published and on the site.</Text>}
            {state === 'error' && <Text>Something went wrong: {error}</Text>}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

export const importTool = definePlugin({
  name: 'opentools-import',
  tools: [{name: 'import', title: 'Import', icon: DownloadIcon, component: ImportTool}],
})
