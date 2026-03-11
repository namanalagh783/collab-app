import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard({ session }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email

  useEffect(() => {
    fetchDocs()
  }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setDocs(data || [])
    setLoading(false)
  }

  async function createDoc() {
    if (!newTitle.trim()) return
    setCreating(true)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: newTitle.trim(),
        content: '',
        owner_id: session.user.id
      })
      .select()
      .single()

    if (!error && data) {
      navigate(`/editor/${data.id}`)
    }
    setCreating(false)
  }

  async function deleteDoc(docId, e) {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    await supabase.from('documents').delete().eq('id', docId)
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Top nav */}
      <nav className="border-b border-border bg-surface px-8 py-4 flex items-center justify-between">
        <span className="font-display font-bold text-ink text-lg tracking-tight">COLLAB</span>
        <div className="flex items-center gap-6">
          <span className="font-body text-sm text-muted hidden sm:block">{userName}</span>
          <button onClick={handleSignOut} className="font-display text-xs uppercase tracking-widest text-muted hover:text-accent transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-muted mb-2">Workspace</p>
            <h1 className="font-display font-bold text-4xl text-ink">Your Documents</h1>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
        </div>

        {/* Docs grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card animate-pulse h-36">
                <div className="h-4 bg-border rounded w-2/3 mb-3" />
                <div className="h-3 bg-border rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border">
            <svg className="w-12 h-12 text-border mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-display font-semibold text-ink mb-2">No documents yet</p>
            <p className="font-body text-sm text-muted mb-6">Create your first document to get started</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>Create Document</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                className="card cursor-pointer group animate-slide-up relative"
                style={{ animationDelay: `${i * 60}ms`, opacity: 0, animationFillMode: 'forwards' }}
                onClick={() => navigate(`/editor/${doc.id}`)}
              >
                {/* Doc icon */}
                <div className="w-8 h-10 border border-border flex items-center justify-center mb-4 group-hover:border-accent transition-colors">
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <h3 className="font-display font-semibold text-ink mb-1 truncate pr-8">{doc.title}</h3>
                <p className="font-mono text-xs text-muted">{formatDate(doc.created_at)}</p>

                {/* Delete button */}
                <button
                  onClick={(e) => deleteDoc(doc.id, e)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-accent"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-8 z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md p-8 animate-slide-up">
            <h2 className="font-display font-bold text-2xl text-ink mb-6">New Document</h2>
            <label className="font-display text-xs uppercase tracking-widest text-muted mb-2 block">Document Title</label>
            <input
              className="input-field mb-6"
              type="text"
              placeholder="Untitled Document"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createDoc()}
              autoFocus
            />
            <div className="flex gap-3">
              <button className="btn-primary flex-1 flex items-center justify-center" onClick={createDoc} disabled={creating}>
                {creating ? <span className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" /> : 'Create'}
              </button>
              <button className="btn-ghost flex-1" onClick={() => { setShowModal(false); setNewTitle('') }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}