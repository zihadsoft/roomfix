import { useState, type FormEvent, type CSSProperties } from 'react'

const API = import.meta.env.VITE_API_URL || window.location.origin

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
  const [showPassword, setShowPassword] = useState(false)

  const [register, setRegister] = useState(false)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [users, setUsers] = useState<Person[]>([])

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [priority, setPriority] = useState('medium')

  const [selectedStaff, setSelectedStaff] = useState<Record<number, string>>({})

  // ==============================
  // API REQUEST
  // ==============================

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
      throw new Error(
        typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail || 'Request failed')
      )
    }

    return data
  }

  // ==============================
  // REFRESH DATA
  // ==============================

  async function refresh(
    token = session?.access_token,
    role = session?.role
  ) {
    if (!token) return

    const data = await request('/api/requests', 'GET', undefined, token)
    setTickets(data)

    if (role === 'admin') {
      const [staffData, userData] = await Promise.all([
        request('/api/staff', 'GET', undefined, token),
        request('/api/users', 'GET', undefined, token)
      ])

      setStaff(staffData)
      setUsers(userData)
    }
  }

  // ==============================
  // UNIVERSAL LOADING SYSTEM
  // ==============================

  async function runAction(
    key: string,
    task: () => Promise<void>,
    successText = 'Successfully Updated!'
  ) {
    if (loadingAction !== null) return

    setLoadingAction(key)
    setMessage('')
    setMessageType('')

    try {
      await task()

      setMessage(successText)
      setMessageType('success')

    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown error'

      setMessage(`Operation Failed! ${reason}`)
      setMessageType('error')

    } finally {
      setLoadingAction(null)
    }
  }

  function isLoading(key: string) {
    return loadingAction === key
  }

  // ==============================
  // LOGIN / REGISTRATION
  // ==============================

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    await runAction(
      'login',
      async () => {
        if (register) {
          await request('/api/register', 'POST', {
            name,
            email,
            password
          })

          setRegister(false)
          setPassword('')
          setName('')
          return
        }

        const data = await request('/api/login', 'POST', {
          email,
          password
        })

        setSession(data)
        setPassword('')

        await refresh(data.access_token, data.role)
      },
      register
        ? 'Registration Successful! Please Login.'
        : 'Login Successful!'
    )
  }

  // ==============================
  // LOGOUT
  // ==============================

  function logout() {
    void runAction('logout', async () => {
      setSession(null)
      setTickets([])
      setStaff([])
      setUsers([])
      setPassword('')
    }, 'Logged Out Successfully!')
  }

  // ==============================
  // SUBMIT MAINTENANCE REQUEST
  // ==============================

  async function submitRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    await runAction(
      'submit-request',
      async () => {
        await request('/api/requests', 'POST', {
          title,
          description,
          location,
          priority
        })

        setTitle('')
        setDescription('')
        setLocation('')

        await refresh()
      },
      'Request Submitted Successfully!'
    )
  }

  // ==============================
  // ASSIGN STAFF
  // ==============================

  async function assignStaff(ticketId: number) {
    const staffId = selectedStaff[ticketId]

    if (!staffId) {
      setMessage('Please select maintenance staff first!')
      setMessageType('error')
      return
    }

    await runAction(
      `assign-${ticketId}`,
      async () => {
        await request(
          `/api/requests/${ticketId}/assign`,
          'PUT',
          { staff_id: Number(staffId) }
        )

        await refresh()
      },
      'Staff Assigned Successfully!'
    )
  }

  // ==============================
  // UPDATE REQUEST STATUS
  // ==============================

  async function updateStatus(ticketId: number, status: string) {
    await runAction(
      `status-${ticketId}-${status}`,
      async () => {
        await request(
          `/api/requests/${ticketId}/status`,
          'PUT',
          { status }
        )

        await refresh()
      },
      `Request Status Updated Successfully!`
    )
  }

  // ==============================
  // CHANGE USER ROLE
  // ==============================

  async function changeRole(userId: number, role: string) {
    await runAction(
      `role-${userId}`,
      async () => {
        await request(
          `/api/users/${userId}/role`,
          'PUT',
          { role }
        )

        await refresh()
      },
      'User Role Updated Successfully!'
    )
  }

  // ==============================
  // COMMON STYLES
  // ==============================

  const field: CSSProperties = {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #64748b',
    background: '#ffffff',
    color: '#111827',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 15
  }

  const btn: CSSProperties = {
    padding: '12px 18px',
    background: '#2563eb',
    color: '#ffffff',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    transition: 'all 0.2s ease'
  }

  const panel: CSSProperties = {
    background: '#1e293b',
    padding: 20,
    borderRadius: 14,
    margin: '16px 0',
    border: '1px solid #334155'
  }

  // ==============================
  // STATUS COLOR
  // ==============================

  function statusStyle(status: string): CSSProperties {
    const colors: Record<string, CSSProperties> = {
      pending: {
        background: '#854d0e',
        color: '#fef08a'
      },
      completed: {
        background: '#166534',
        color: '#bbf7d0'
      },
      rejected: {
        background: '#991b1b',
        color: '#fecaca'
      },
      assigned: {
        background: '#1e40af',
        color: '#bfdbfe'
      },
      in_progress: {
        background: '#075985',
        color: '#bae6fd'
      }
    }

    return {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 800,
      ...colors[status]
    }
  }

  function actionButton(
    key: string,
    label: string,
    onClick: () => void,
    background = '#2563eb'
  ) {
    return (
      <button
        type="button"
        className={`action-btn ${isLoading(key) ? 'is-loading' : ''}`}
        style={{ ...btn, background }}
        onClick={onClick}
        disabled={loadingAction !== null}
      >
        {isLoading(key) ? (
          <span className="loading-content">
            <span className="spinner" />
            Loading...
          </span>
        ) : label}
      </button>
    )
  }

  // ==============================
  // MAIN UI
  // ==============================

  return (
    <main className="app-main">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .app-main {
          background: #0f172a;
          color: white;
          min-height: 100vh;
          font-family: Arial, sans-serif;
          padding: 25px 16px;
        }

        .app-container {
          max-width: 950px;
          margin: auto;
        }

        .action-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .action-btn:hover:not(:disabled) {
          filter: brightness(1.18);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px #0005;
        }

        .action-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .action-btn:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .action-btn.is-loading {
          animation: buttonBlink 0.7s infinite;
        }

        @keyframes buttonBlink {
          0%, 100% {
            opacity: 1;
            filter: brightness(1);
          }
          50% {
            opacity: 0.55;
            filter: brightness(1.5);
          }
        }

        .loading-content {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid #ffffff70;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .feedback {
          padding: 15px;
          border-radius: 9px;
          margin-top: 18px;
          font-weight: 700;
          animation: feedbackIn 0.3s ease;
          overflow-wrap: anywhere;
        }

        .feedback.success {
          background: #14532d;
          color: #bbf7d0;
          border: 1px solid #22c55e;
        }

        .feedback.error {
          background: #7f1d1d;
          color: #fecaca;
          border: 1px solid #ef4444;
        }

        @keyframes feedbackIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ticket-card {
          background: #0f172a;
          border: 1px solid #475569;
          border-radius: 12px;
          padding: 17px;
          margin: 14px 0;
          overflow-wrap: anywhere;
        }

        .ticket-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .user-row {
          padding: 12px 5px;
          border-bottom: 1px solid #475569;
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        @media (max-width: 600px) {
          .app-main {
            padding: 15px 10px;
          }

          .ticket-actions button {
            flex: 1;
            min-width: 100px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .action-btn.is-loading,
          .spinner,
          .feedback {
            animation-duration: 2s;
          }
        }
      `}</style>

      <div className="app-container">
        <h1>RoomFix</h1>
        <p>Maintenance Request Management System</p>

        {/* LOGIN / REGISTER */}

        {!session ? (
          <section style={{ ...panel, maxWidth: 440 }}>
            <h2>{register ? 'Register as Resident' : 'Login'}</h2>

            <form
              onSubmit={login}
              style={{ display: 'grid', gap: 13 }}
            >
              {register && (
                <input
                  style={field}
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  minLength={2}
                />
              )}

              <input
                style={field}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...field, paddingRight: 55 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (8+ characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={register ? 8 : undefined}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 5,
                    padding: 7,
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#334155',
                    fontSize: 18
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              <button
                style={btn}
                className={`action-btn ${isLoading('login') ? 'is-loading' : ''}`}
                disabled={loadingAction !== null}
              >
                {isLoading('login') ? (
                  <span className="loading-content">
                    <span className="spinner" />
                    Loading...
                  </span>
                ) : register ? 'Create Account' : 'Log in'}
              </button>
            </form>

            <button
              type="button"
              className="action-btn"
              style={{
                ...btn,
                background: 'transparent',
                marginTop: 12
              }}
              disabled={loadingAction !== null}
              onClick={() => {
                setRegister(!register)
                setMessage('')
                setMessageType('')
              }}
            >
              {register
                ? 'Already have an account? Login'
                : 'Register New Resident'}
            </button>
          </section>
        ) : (
          <>
            {/* USER DASHBOARD */}

            <section style={panel}>
              <h2>Welcome, {session.name}</h2>
              <p>
                Role: <b>{session.role}</b>
              </p>

              {actionButton(
                'logout',
                'Logout',
                logout,
                '#475569'
              )}

              {' '}

              {actionButton(
                'refresh',
                'Refresh',
                () => runAction(
                  'refresh',
                  async () => {
                    await refresh()
                  },
                  'Data Refreshed Successfully!'
                )
              )}
            </section>

            {/* RESIDENT REQUEST FORM */}

            {session.role === 'resident' && (
              <section style={panel}>
                <h2>Submit Maintenance Request</h2>

                <form
                  onSubmit={submitRequest}
                  style={{ display: 'grid', gap: 12 }}
                >
                  <input
                    style={field}
                    placeholder="Request Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    minLength={3}
                  />

                  <textarea
                    style={field}
                    placeholder="Describe your problem"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    minLength={5}
                    rows={4}
                  />

                  <input
                    style={field}
                    placeholder="Location / Room Number"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    required
                    minLength={2}
                  />

                  <select
                    style={field}
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>

                  <button
                    style={btn}
                    className={`action-btn ${isLoading('submit-request') ? 'is-loading' : ''}`}
                    disabled={loadingAction !== null}
                  >
                    {isLoading('submit-request') ? (
                      <span className="loading-content">
                        <span className="spinner" />
                        Loading...
                      </span>
                    ) : 'Submit Request'}
                  </button>
                </form>
              </section>
            )}

            {/* MAINTENANCE REQUESTS */}

            <section style={panel}>
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
                tickets.map(ticket => {
                  const closed = [
                    'completed',
                    'rejected'
                  ].includes(ticket.status)

                  return (
                    <article
                      key={ticket.id}
                      className="ticket-card"
                    >
                      <h3>
                        #{ticket.id} — {ticket.title}
                      </h3>

                      <p>{ticket.description}</p>

                      <p>
                        Location: {ticket.location}
                      </p>

                      <p>
                        Priority: <b>{ticket.priority}</b>
                      </p>

                      <p>
                        Status:{' '}
                        <span style={statusStyle(ticket.status)}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </p>

                      <p>
                        Created by user #{ticket.created_by}
                      </p>

                      <p>
                        Assigned Staff: {ticket.assigned_staff ?? 'None'}
                      </p>

                      {/* ADMIN ASSIGN STAFF */}

                      {session.role === 'admin' && !closed && (
                        <div className="ticket-actions">
                          <select
                            style={{ ...field, flex: 1, minWidth: 170 }}
                            value={selectedStaff[ticket.id] || ''}
                            onChange={e =>
                              setSelectedStaff(prev => ({
                                ...prev,
                                [ticket.id]: e.target.value
                              }))
                            }
                            disabled={loadingAction !== null}
                          >
                            <option value="">
                              Select Maintenance Staff
                            </option>

                            {staff.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} (#{s.id})
                              </option>
                            ))}
                          </select>

                          {actionButton(
                            `assign-${ticket.id}`,
                            'Assign Staff',
                            () => assignStaff(ticket.id)
                          )}
                        </div>
                      )}

                      {/* STAFF STATUS BUTTONS */}

                      {session.role === 'maintenance_staff' &&
                        ['assigned', 'in_progress'].includes(ticket.status) && (
                          <div className="ticket-actions">
                            {(['in_progress', 'completed', 'rejected'] as const).map(s => (
                              <ReactStatusButton
                                key={s}
                                status={s}
                                loading={isLoading(`status-${ticket.id}-${s}`)}
                                disabled={loadingAction !== null}
                                onClick={() => updateStatus(ticket.id, s)}
                                btnStyle={btn}
                              />
                            ))}
                          </div>
                        )}

                      {closed && (
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>
                          This request is closed.
                        </p>
                      )}
                    </article>
                  )
                })
              )}
            </section>

            {/* ADMIN USER MANAGEMENT */}

            {session.role === 'admin' && (
              <section style={panel}>
                <h2>User Management</h2>

                {users.map(user => (
                  <div key={user.id} className="user-row">
                    <div>
                      <b>{user.name}</b>
                      <br />
                      <small>{user.email}</small>
                      <br />
                      <small>Current Role: {user.role}</small>
                    </div>

                    <select
                      style={{ ...field, width: 190 }}
                      value={user.role}
                      disabled={loadingAction !== null}
                      onChange={e =>
                        changeRole(user.id, e.target.value)
                      }
                    >
                      <option value="admin">Admin</option>
                      <option value="resident">Resident</option>
                      <option value="maintenance_staff">
                        Maintenance Staff
                      </option>

                      {user.role === 'manager' && (
                        <option value="manager" disabled>
                          Manager (Legacy)
                        </option>
                      )}
                    </select>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {/* GLOBAL SUCCESS / ERROR MESSAGE */}

        {message && (
          <div
            className={`feedback ${messageType}`}
            role="alert"
            aria-live="polite"
          >
            {messageType === 'success' ? '✓ ' : '✕ '}
            {message}
          </div>
        )}
      </div>
    </main>
  )
}

// ==============================
// STAFF STATUS BUTTON COMPONENT
// ==============================

function ReactStatusButton({
  status,
  loading,
  disabled,
  onClick,
  btnStyle
}: {
  status: string
  loading: boolean
  disabled: boolean
  onClick: () => void
  btnStyle: CSSProperties
}) {
  const labels: Record<string, string> = {
    in_progress: 'In Progress',
    completed: 'Completed',
    rejected: 'Rejected'
  }

  const colors: Record<string, string> = {
    in_progress: '#0369a1',
    completed: '#15803d',
    rejected: '#b91c1c'
  }

  return (
    <button
      type="button"
      className={`action-btn ${loading ? 'is-loading' : ''}`}
      style={{ ...btnStyle, background: colors[status] }}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? (
        <span className="loading-content">
          <span className="spinner" />
          Loading...
        </span>
      ) : labels[status]}
    </button>
  )
}
