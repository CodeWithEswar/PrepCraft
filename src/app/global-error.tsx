"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("PrepCraft global layout error:", error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#121315", color: "#f2f0ed", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "28rem", textAlign: "center", padding: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>PrepCraft encountered a critical error</h1>
          <p style={{ fontSize: "0.875rem", color: "#b5b1ad", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            The root layout failed to initialize. Please try reloading the application.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#a15f4b",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  )
}
