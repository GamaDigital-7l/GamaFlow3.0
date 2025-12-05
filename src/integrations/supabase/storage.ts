import { createClient } from '@supabase/supabase-js'
import { StorageClient } from '@supabase/storage-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:9000'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ACCESS_KEY'
const MINIO_SECRET_KEY = import.meta.env.VITE_MINIO_SECRET_KEY || 'YOUR_SECRET_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const storage = new StorageClient(
  `${SUPABASE_URL}/storage/v1`,
  {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `AWS ${SUPABASE_ANON_KEY}:${MINIO_SECRET_KEY}`,
  },
  {
    global: {
      fetch: (...args) => {
        const [url, options] = args
        const headers = new Headers(options?.headers)
        headers.set('Authorization', `AWS ${SUPABASE_ANON_KEY}:${MINIO_SECRET_KEY}`)
        return fetch(url, { ...options, headers })
      },
    },
  }
)

export { storage };