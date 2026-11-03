import { useState, type FormEvent } from "react"

const API_URL = "http://127.0.0.1:8000"

type LoginResponse = {
  access_token: string
  token_type: string
  role: string
  name: string
}

type Room = {
  id: number
  room_number: string
  status: string
}

export default function App() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [user, setUser] = useState<LoginResponse | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid email or password")
        }

        throw new Error(`Login failed: ${response.status}`)
      }

      const data: LoginResponse = await response.json()

      const profileResponse = await fetch(
        `${API_URL}/api/profile`,
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      )

      if (!profileResponse.ok) {
        throw new Error("Unable to verify login")
      }

      setUser(data)
      setPassword("")

      const roomsResponse = await fetch(`${API_URL}/api/rooms`)

      if (roomsResponse.ok) {
        const roomsData: Room[] = await roomsResponse.json()
        setRooms(roomsData)
      } else {
        setError("Login successful, but rooms could not be loaded")
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setUser(null)
    setRooms([])
    setEmail("")
    setPassword("")
    setError("")
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    padding: "40px 20px",
    boxSizing: "border-box" as const,
  }

  const cardStyle = {
    width: "100%",
    maxWidth: "440px",
    margin: "40px auto",
    padding: "32px",
    background: "#1e293b",
    borderRadius: "16px",
    boxSizing: "border-box" as const,
    boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    height: "48px",
    padding: "12px",
    marginTop: "8px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #64748b",
    background: "#ffffff",
    color: "#111827",
    fontSize: "15px",
    boxSizing: "border-box" as const,
  }

  const buttonStyle = {
    display: "block",
    width: "100%",
    height: "48px",
    padding: "12px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  }

  if (!user) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1
            style={{
              textAlign: "center",
              marginBottom: "8px",
              fontSize: "32px",
            }}
          >
            RoomFix
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#cbd5e1",
              marginBottom: "32px",
            }}
          >
            Room Management System
          </p>

          <h2 style={{ marginBottom: "24px" }}>Login</h2>

          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
            }}
          >
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              style={inputStyle}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              style={inputStyle}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {error && (
            <p
              role="alert"
              style={{
                color: "#f87171",
                marginTop: "16px",
              }}
            >
              {error}
            </p>
          )}
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
        }}
      >
        <h1>RoomFix Dashboard</h1>

        <div
          style={{
            background: "#1e293b",
            padding: "24px",
            borderRadius: "12px",
            marginTop: "24px",
          }}
        >
          <h2>Welcome, {user.name}</h2>

          <p>
            Your Role: <strong>{user.role}</strong>
          </p>

          <button
            style={{
              ...buttonStyle,
              maxWidth: "150px",
              marginTop: "20px",
            }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <h2 style={{ marginTop: "35px" }}>Room List</h2>

        {error && (
          <p role="alert" style={{ color: "#f87171" }}>
            {error}
          </p>
        )}

        {rooms.length === 0 ? (
          <p>No rooms to display.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {rooms.map((room) => (
              <div
                key={room.id}
                style={{
                  padding: "24px",
                  background: "#1e293b",
                  borderRadius: "12px",
                  border: "1px solid #334155",
                }}
              >
                <h3>Room {room.room_number}</h3>

                <p>
                  Status:{" "}
                  <strong
                    style={{
                      color:
                        room.status === "available"
                          ? "#4ade80"
                          : "#fbbf24",
                    }}
                  >
                    {room.status}
                  </strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}