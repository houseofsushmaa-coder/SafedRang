import React from "react";
import { AlertTriangle, RefreshCw, Home, RotateCcw } from "lucide-react";

export class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[AdminErrorBoundary] Uncaught component error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem("admin_cache");
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isSubRoute = Boolean(this.props.isSubRoute);

      return (
        <div
          style={{
            minHeight: isSubRoute ? "60vh" : "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: isSubRoute ? "transparent" : "#FAF5EC",
            fontFamily: '"Manrope", "Inter", system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: "560px",
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E8DFD0",
              boxShadow: "0 12px 36px rgba(42, 33, 29, 0.08)",
              padding: "36px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(174, 138, 84, 0.12)",
                color: "#AE8A54",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2
              style={{
                margin: "0 0 10px 0",
                fontSize: "1.35rem",
                fontWeight: "700",
                color: "#2A211D",
                letterSpacing: "-0.01em",
              }}
            >
              Safed Rang Admin · Component Recovery
            </h2>

            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "0.92rem",
                color: "#8B7863",
                lineHeight: "1.55",
              }}
            >
              An unexpected render issue occurred in this section, but the admin session
              was prevented from going blank. You can reload this module safely.
            </p>

            {this.state.error && (
              <div
                style={{
                  marginBottom: "24px",
                  textAlign: "left",
                  backgroundColor: "#FDFBF7",
                  border: "1px solid #F0E8DC",
                  borderRadius: "10px",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                >
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      color: "#6E1E2A",
                      fontFamily: "monospace",
                    }}
                  >
                    {this.state.error.message || "Runtime Error"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#AE8A54" }}>
                    {this.state.showDetails ? "Hide stack" : "View stack"}
                  </span>
                </div>

                {this.state.showDetails && (
                  <pre
                    style={{
                      margin: "10px 0 0 0",
                      fontSize: "0.72rem",
                      color: "#8B7863",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      maxHeight: "180px",
                      overflowY: "auto",
                      borderTop: "1px dashed #E8DFD0",
                      paddingTop: "8px",
                    }}
                  >
                    {this.state.error.stack || "No stack trace available."}
                  </pre>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#AE8A54",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <RefreshCw size={15} /> Reload Dashboard
              </button>

              {isSubRoute && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#FFFFFF",
                    color: "#2A211D",
                    border: "1px solid #E8DFD0",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontSize: "0.88rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={15} /> Try Again
                </button>
              )}

              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#FFFFFF",
                  color: "#8B7863",
                  border: "1px solid #E8DFD0",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                <Home size={15} /> View Store
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
