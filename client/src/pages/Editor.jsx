import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Quill from 'quill'
import { supabase } from '../lib/supabaseClient'
import { socket } from '../lib/socket'

const SAVE_INTERVAL = 3000 // auto-save every 3 seconds

export default function Editor({ session }) {
  const { docId } = useParams()
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const [doc, setDoc] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | saving | saved | error
  const [activeUsers, setActiveUsers] = useState([])
  const saveTimerRef = useRef(null)
  const isRemoteChange = useRef(false)

  // Load document from Supabase
  useEffect(() => {
    async function loadDoc() {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single()

      if (error || !data) {
        setStatus('error')
        return
      }
      setDoc(data)
      setStatus('ready')
    }
    loadDoc()
  }, [docId])

  // Initialize Quill
  useEffect(() => {
    if (status !== 'ready' || !editorRef.current || quillRef.current) return

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: 'Start writing...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['clean']
        ]
      }
    })

    // Load existing content
    if (doc?.content) {
      try {
        quill.setContents(JSON.parse(doc.content))
      } catch {
        quill.setText(doc.content)
      }
    }

    quillRef.current = quill
  }, [status, doc])

  // Socket.io setup
  useEffect(() => {
    if (status !== 'ready' || !quillRef.current) return

    const quill = quillRef.current
    const userName = session?.user?.user_metadata?.full_name || session?.user?.email

    socket.connect()
    socket.emit('join-doc', { docId, userName })

    // Receive changes from other users
    socket.on('doc-update', (delta) => {
      isRemoteChange.current = true
      quill.updateContents(delta)
      isRemoteChange.current = false
    })

    // Active users presence
    socket.on('users-update', (users) => {
      setActiveUsers(users.filter(u => u.id !== socket.id))
    })

    // Send local changes to others
    quill.on('text-change', (delta, _oldDelta, source) => {
      if (source !== 'user' || isRemoteChange.current) return
      socket.emit('doc-change', { docId, delta })

      // Trigger auto-save
      setStatus('saving')
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveDoc(quill), SAVE_INTERVAL)
    })

    return () => {
      socket.emit('leave-doc', docId)
      socket.off('doc-update')
      socket.off('users-update')
      socket.disconnect()
      quill.off('text-change')
      clearTimeout(saveTimerRef.current)
    }
  }, [status, docId])

  const saveDoc = useCallback(async (quill) => {
    const content = JSON.stringify(quill.getContents())
    const { error } = await supabase
      .from('documents')
      .update({ content })
      .eq('id', docId)

    if (!error) {
      // Bonus: save version snapshot
      await supabase.from('versions').insert({ doc_id: docId, content })
      setStatus('saved')
      setTimeout(() => setStatus('ready'), 2000)
    }
  }, [docId])

  function handleManualSave() {
    if (!quillRef.current) return
    clearTimeout(saveTimerRef.current)
    setStatus('saving')
    saveDoc(quillRef.current)
  }

  const statusLabel = {
    loading: 'Loading...',
    ready: 'All changes saved',
    saving: 'Saving...',
    saved: 'Saved ✓',
    error: 'Error loading document'
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="font-display font-semibold text-ink mb-4">Document not found</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-surface px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-display text-xs uppercase tracking-widest text-muted hover:text-accent transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Docs
          </button>
          <span className="text-border">|</span>
          <h1 className="font-display font-semibold text-ink text-sm truncate max-w-xs">
            {doc?.title || '...'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Active users avatars */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-1">
              {activeUsers.slice(0, 4).map((user, i) => (
                <div
                  key={user.id}
                  title={user.name}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold text-white"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                >
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              ))}
              {activeUsers.length > 4 && (
                <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs text-white font-display">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Save status */}
          <span className="font-mono text-xs text-muted">{statusLabel[status]}</span>

          {/* Manual save */}
          <button
            className="btn-ghost py-2 px-4 text-xs"
            onClick={handleManualSave}
            disabled={status === 'saving' || status === 'loading'}
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor area */}
      {status === 'loading' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 bg-paper">
          <div ref={editorRef} className="h-full" />
        </div>
      )}
    </div>
  )
}

const COLORS = ['#E8572A', '#2A7BE8', '#2AE857', '#E8A52A', '#892AE8']