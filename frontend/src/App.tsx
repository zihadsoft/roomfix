import { useState, type FormEvent, type CSSProperties } from 'react'

// Vercel same-domain API routing
const API = ''

type Session = {
  access_token: string
  name: string
  role: string
}

type Ticket = {
  id: number
  title: string
  description: string
  location: string
  priority: string
  status: string
  created_by: number
  assigned_staff: number | null
}

type Staff = {
  id: number
  name: string
  email: string
}

type Person = {
  id: number
  name: string
  email: string
  role: string
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [register, setRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [users, setUsers] = useState<Person[]>([])

  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [priority, setPriority] = useState('medium')

  // ==========================================
  // API REQUEST FUNCTION
  // ==========================================

  async function request(
    path: string,
    method = 'GET',
    body?: object,
    token = session?.access_token
  ) {
    const res = await fetch(API + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw Error(
        typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail || 'Request failed')
      )
    }

    return data
  }

  // ==========================================
  // REFRESH DASHBOARD DATA
  // ==========================================

  async function refresh(
    token = session?.access_token,
    role = session?.role
  ) {
    if (!token) return

    const t = await request('/api/requests', 'GET', undefined, token)
    setTickets(t)

    if (role === 'admin') {
      setStaff(await request('/api/staff', 'GET', undefined, token))
      setUsers(await request('/api/users', 'GET', undefined, token))
    }
  }

  // ==========================================
  // LOGIN AND REGISTRATION
  // ==========================================

  async function login(e: FormEvent) {
    e.preventDefault()

    if (isSubmitting) return

    setMessage('')
    setIsSubmitting(true)

    try {
      if (register) {
        await request('/api/register', 'POST', {
          name,
          email,
          password
        })

        setRegister(false)
        setPassword('')
        setShowPassword(false)
        setMessage('Registered successfully! Please log in.')
        return
      }

      const data = await request('/api/login', 'POST', {
        email,
        password
      })

      setSession(data)
      setPassword('')
      setShowPassword(false)

      await refresh(data.access_token, data.role)

    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : String(err)
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================
  // GENERAL ACTION FUNCTION
  // ==========================================

  async function act(
    path: string,
    method: string,
    body: object
  ) {
    try {
      await request(path, method, body)

      setMessage('Saved successfully!')
      await refresh()

    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : String(e)
      )
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  function logout() {
    setSession(null)
    setTickets([])
    setUsers([])
    setStaff([])
    setPassword('')
    setShowPassword(false)
    setMessage('')
  }

  // ==========================================
  // DESIGN STYLES
  // ==========================================

  const field: CSSProperties = {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #64748b',
    background: '#ffffff',
    color: '#111827',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 15,
    outline: 'none'
  }

  const btn: CSSProperties = {
    padding: '12px 17px',
    background: '#2563eb',
    color: 'white',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    transition: '0.2s'
  }

  const panel: CSSProperties = {
    background: '#1e293b',
    padding: 20,
    borderRadius: 12,
    margin: '16px 0',
    boxShadow: '0 5px 15px rgba(0,0,0,0.15)'
  }

  // ==========================================
  // MAIN APPLICATION
  // ==========================================

  return (
    <main
      style={{
        background: '#0f172a',
        color: 'white',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        padding: '25px 16px'
      }}
    >

      <style>{`
        @keyframes loginBlink {
          0%, 100% {
            opacity: 1;
            filter: brightness(1);
          }

          50% {
            opacity: 0.55;
            filter: brightness(1.3);
          }
        }

        .login-blink {
          animation: loginBlink 0.7s infinite;
        }

        .rf-button:hover {
          filter: brightness(1.15);
        }

        .rf-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
        }

        .rf-card {
          animation: cardAppear 0.3s ease;
        }

        @keyframes cardAppear {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={{ maxWidth: 950, margin: 'auto' }}>

        {/* HEADER */}

        <h1 style={{ fontSize: 34, marginBottom: 5 }}>
          RoomFix
        </h1>

        <p style={{ color: '#cbd5e1', marginTop: 5 }}>
          Maintenance Request Management System
        </p>

        {/* ================================== */}
        {/* LOGIN / REGISTRATION PAGE */}
        {/* ================================== */}

        {!session ? (

          <section
            className="rf-card"
            style={{
              ...panel,
              maxWidth: 440,
              margin: '25px auto'
            }}
          >

            <h2 style={{ marginTop: 0 }}>
              {register ? 'Register as Resident' : 'Login'}
            </h2>

            <form
              onSubmit={login}
              style={{
                display: 'grid',
                gap: 14
              }}
            >

              {/* NAME */}

              {register && (
                <input
                  className="rf-input"
                  style={field}
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  minLength={2}
                />
              )}

              {/* EMAIL */}

              <input
                className="rf-input"
                style={field}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              {/* PASSWORD WITH EYE ICON */}

              <div
                style={{
                  position: 'relative',
                  width: '100%'
                }}
              >

                <input
                  className="rf-input"
                  style={{
                    ...field,
                    paddingRight: 55
                  }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={register ? 8 : undefined}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 21,
                    padding: 4,
                    color: '#334155'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isSubmitting}
                className={
                  isSubmitting
                    ? 'login-blink'
                    : 'rf-button'
                }
                style={{
                  ...btn,
                  width: '100%',
                  opacity: isSubmitting ? 0.8 : 1,
                  cursor: isSubmitting ? 'wait' : 'pointer'
                }}
              >

                {isSubmitting
                  ? 'Please wait...'
                  : register
                    ? 'Create Account'
                    : 'Log in'}

              </button>

            </form>

            {/* REGISTER BUTTON */}

            <button
              type="button"
              className="rf-button"
              disabled={isSubmitting}
              onClick={() => {
                setRegister(!register)
                setMessage('')
                setShowPassword(false)
              }}
              style={{
                ...btn,
                background: 'transparent',
                paddingLeft: 0,
                marginTop: 12
              }}
            >

              {register
                ? 'Already have an account? Login'
                : 'Register new resident'}

            </button>

          </section>

        ) : (

          <>
            {/* ================================== */}
            {/* DASHBOARD HEADER */}
            {/* ================================== */}

            <section
              className="rf-card"
              style={panel}
            >

              <h2>
                Welcome, {session.name}
              </h2>

              <p>
                Role: <b>{session.role}</b>
              </p>

              <button
                className="rf-button"
                style={btn}
                onClick={logout}
              >
                Logout
              </button>

              {' '}

              <button
                className="rf-button"
                style={btn}
                onClick={() =>
                  refresh().catch(e =>
                    setMessage(String(e))
                  )
                }
              >
                Refresh
              </button>

            </section>

            {/* ================================== */}
            {/* RESIDENT MAINTENANCE REQUEST FORM */}
            {/* ================================== */}

            {session.role === 'resident' && (

              <section
                className="rf-card"
                style={panel}
              >

                <h2>Submit Maintenance Request</h2>

                <form
                  style={{
                    display: 'grid',
                    gap: 12
                  }}

                  onSubmit={async e => {
                    e.preventDefault()

                    await act(
                      '/api/requests',
                      'POST',
                      {
                        title,
                        description,
                        location,
                        priority
                      }
                    )

                    setTitle('')
                    setDescription('')
                    setLocation('')
                  }}
                >

                  <input
                    className="rf-input"
                    style={field}
                    placeholder="Request Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    minLength={3}
                  />

                  <textarea
                    className="rf-input"
                    style={field}
                    placeholder="Describe your maintenance problem"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    minLength={5}
                    rows={4}
                  />

                  <input
                    className="rf-input"
                    style={field}
                    placeholder="Location / Room Number"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    required
                    minLength={2}
                  />

                  <select
                    className="rf-input"
                    style={field}
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>

                  <button
                    type="submit"
                    className="rf-button"
                    style={btn}
                  >
                    Submit Request
                  </button>

                </form>

              </section>
            )}

            {/* ================================== */}
            {/* MAINTENANCE REQUEST LIST */}
            {/* ================================== */}

            <section
              className="rf-card"
              style={panel}
            >

              <h2>
                {session.role === 'admin'
                  ? 'All Maintenance Requests'
                  : session.role === 'maintenance_staff'
                    ? 'My Assigned Requests'
                    : 'My Maintenance Requests'}
              </h2>

              {tickets.length === 0 ? (

                <p>No requests yet.</p>

              ) : (

                tickets.map(t => (

                  <article
                    key={t.id}
                    style={{
                      border: '1px solid #475569',
                      borderRadius: 9,
                      padding: 14,
                      margin: '12px 0',
                      background: '#0f172a'
                    }}
                  >

                    <h3>
                      #{t.id} — {t.title}
                    </h3>

                    <p>{t.description}</p>

                    <p>
                      Location: {t.location}
                    </p>

                    <p>
                      Priority: <b>{t.priority}</b>
                    </p>

                    <p>
                      Status: <b>{t.status}</b>
                    </p>

                    <p>
                      Created by user #{t.created_by}
                    </p>

                    <p>
                      Assigned Staff: {t.assigned_staff ?? 'None'}
                    </p>

                    {/* ADMIN ASSIGN STAFF */}

                    {session.role === 'admin' && (

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap'
                        }}
                      >

                        <select
                          className="rf-input"
                          style={{
                            ...field,
                            width: 240
                          }}
                          id={'staff-' + t.id}
                          defaultValue=""
                        >

                          <option value="">
                            Select Maintenance Staff
                          </option>

                          {staff.map(s => (

                            <option
                              key={s.id}
                              value={s.id}
                            >
                              {s.name} (#{s.id})
                            </option>

                          ))}

                        </select>

                        <button
                          className="rf-button"
                          style={btn}
                          onClick={() => {
                            const id = (
                              document.getElementById(
                                'staff-' + t.id
                              ) as HTMLSelectElement
                            ).value

                            if (id) {
                              act(
                                `/api/requests/${t.id}/assign`,
                                'PUT',
                                {
                                  staff_id: Number(id)
                                }
                              )
                            }
                          }}
                        >
                          Assign Staff
                        </button>

                      </div>
                    )}

                    {/* STAFF STATUS UPDATE */}

                    {session.role === 'maintenance_staff' &&
                      ['assigned', 'in_progress'].includes(t.status) && (

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap'
                          }}
                        >

                          {(
                            ['in_progress', 'completed', 'rejected'] as const
                          ).map(s => (

                            <button
                              key={s}
                              className="rf-button"
                              style={btn}
                              onClick={() =>
                                act(
                                  `/api/requests/${t.id}/status`,
                                  'PUT',
                                  { status: s }
                                )
                              }
                            >
                              {s.replace('_', ' ')}
                            </button>

                          ))}

                        </div>
                      )}

                  </article>

                ))

              )}

            </section>

            {/* ================================== */}
            {/* ADMIN USER MANAGEMENT */}
            {/* ================================== */}

            {session.role === 'admin' && (

              <section
                className="rf-card"
                style={panel}
              >

                <h2>User Management</h2>

                {users.map(u => (

                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      padding: 10,
                      borderBottom: '1px solid #334155'
                    }}
                  >

                    <span>
                      {u.name} — {u.email} ({u.role})
                    </span>

                    <select
                      className="rf-input"
                      style={{
                        ...field,
                        width: 185
                      }}
                      value={u.role}
                      onChange={e =>
                        act(
                          `/api/users/${u.id}/role`,
                          'PUT',
                          { role: e.target.value }
                        )
                      }
                    >

                      <option value="admin">Admin</option>

                      <option value="resident">Resident</option>

                      <option value="maintenance_staff">
                        Maintenance Staff
                      </option>

                      {u.role === 'manager' && (
                        <option value="manager">
                          Manager (legacy)
                        </option>
                      )}

                    </select>

                  </div>

                ))}

              </section>
            )}

          </>
        )}

        {/* ================================== */}
        {/* SUCCESS / ERROR MESSAGE */}
        {/* ================================== */}

        {message && (

          <p
            role="alert"
            style={{
              background: '#334155',
              padding: 14,
              borderRadius: 8,
              marginTop: 18,
              border: '1px solid #64748b',
              overflowWrap: 'anywhere'
            }}
          >
            {message}
          </p>

        )}

      </div>

    </main>
  )
}
