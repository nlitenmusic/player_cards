import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 720, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 6px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Access denied</h2>
        <p style={{ marginTop: 8 }}>You don't have permission to view this section.</p>
        <div style={{ marginTop: 12 }}>
          <Link href="/">Return to home</Link>
        </div>
      </div>
    </div>
  )
}
