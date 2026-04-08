"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Loader2, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { type ChangelogEntry } from "@/lib/changelog"

export default function ChangelogAdminPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [actioningId, setActioningId] = useState<number | null>(null)
  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState(false)

  const visibleCount = useMemo(
    () => entries.filter((entry) => entry.is_visible).length,
    [entries]
  )

  useEffect(() => {
    // Don't auto-fetch on mount - require explicit login first
  }, [])

  const fetchEntries = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/changelog/admin", {
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setEntries([])
          setIsAuthenticated(false)
          return
        }

        throw new Error(data?.error || "Failed to load update logs")
      }

      const nextEntries = Array.isArray(data.entries) ? data.entries : []
      setEntries(nextEntries)
      setIsAuthenticated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load update logs")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    if (!trimmedUsername || !trimmedPassword) {
      setError("Username and password are required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/changelog/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Login failed")
      }

      setPassword("")
      await fetchEntries()
    } catch (err) {
      setIsAuthenticated(false)
      setEntries([])
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (entry: ChangelogEntry) => {
    if (!isAuthenticated) return

    setActioningId(entry.id)
    setError("")

    try {
      const response = await fetch("/api/changelog/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: entry.id,
          is_visible: !entry.is_visible,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          setEntries([])
          throw new Error("Session expired. Please log in again.")
        }
        throw new Error(data?.error || "Failed to update visibility")
      }

      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id ? { ...item, is_visible: !item.is_visible } : item
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update visibility")
    } finally {
      setActioningId(null)
    }
  }

  const handleDelete = async (entry: ChangelogEntry) => {
    if (!isAuthenticated) return

    const confirmed = window.confirm(`Delete log #${entry.id}? This cannot be undone.`)
    if (!confirmed) return

    setActioningId(entry.id)
    setError("")

    try {
      const response = await fetch("/api/changelog/admin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: entry.id }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          setEntries([])
          throw new Error("Session expired. Please log in again.")
        }
        throw new Error(data?.error || "Failed to delete log")
      }

      setEntries((current) => current.filter((item) => item.id !== entry.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete log")
    } finally {
      setActioningId(null)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/changelog/admin/logout", {
      method: "POST",
    })

    setIsAuthenticated(false)
    setUsername("")
    setPassword("")
    setEntries([])
    setError("")
  }

  const handleCreateEntry = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = createTitle.trim()
    const trimmedDescription = createDescription.trim()

    if (!trimmedTitle || !trimmedDescription) {
      setCreateError("Title and description are required")
      return
    }

    setIsCreating(true)
    setCreateError("")
    setCreateSuccess(false)

    try {
      const response = await fetch("/api/changelog/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          setEntries([])
          throw new Error("Session expired. Please log in again.")
        }
        throw new Error(data?.error || "Failed to create update log")
      }

      const newEntry = data.entry as ChangelogEntry
      setEntries((current) => [...current, newEntry])
      setCreateTitle("")
      setCreateDescription("")
      setCreateSuccess(true)
      setTimeout(() => setCreateSuccess(false), 3000)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create update log")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-sm text-muted-foreground">Admin</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {!isAuthenticated ? (
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleLogin}>
                  <Input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Username"
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading
                      </>
                    ) : (
                      "Log In"
                    )}
                  </Button>
                </form>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Manage Updates</h2>
                <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create New Update Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCreateEntry}>
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium">
                        Title
                      </label>
                      <Input
                        id="title"
                        type="text"
                        value={createTitle}
                        onChange={(event) => setCreateTitle(event.target.value)}
                        placeholder="e.g., Dark Mode Support"
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground">
                        {createTitle.length}/100 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        id="description"
                        value={createDescription}
                        onChange={(event) => setCreateDescription(event.target.value)}
                        placeholder="Describe this update in detail..."
                        maxLength={1000}
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        {createDescription.length}/1000 characters
                      </p>
                    </div>

                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating
                        </>
                      ) : (
                        "Create Update Log"
                      )}
                    </Button>

                    {createError && <p className="text-sm text-destructive">{createError}</p>}
                    {createSuccess && (
                      <p className="text-sm text-green-600">Update log created successfully!</p>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Update Logs ({visibleCount} visible / {entries.length} total)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No update logs found.</p>
                  ) : (
                    <div className="space-y-3">
                      {entries
                        .slice()
                        .sort((a, b) => b.id - a.id)
                        .map((entry) => {
                          const busy = actioningId === entry.id

                          return (
                            <div
                              key={entry.id}
                              className="rounded-lg border p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">#{entry.id}</p>
                                <p className="font-medium">{entry.title}</p>
                                <p className="text-sm text-muted-foreground">{entry.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  Created: {new Date(entry.created_at).toLocaleString()}
                                </p>
                                <p className="text-xs">
                                  Status: {entry.is_visible ? "Visible" : "Hidden"}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => handleToggleVisibility(entry)}
                                >
                                  {entry.is_visible ? (
                                    <>
                                      <EyeOff className="h-4 w-4" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4" />
                                      Show
                                    </>
                                  )}
                                </Button>

                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => handleDelete(entry)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}