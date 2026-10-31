import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// StrictMode intentionally removed:
// StrictMode double-invokes effects in dev AND can cause race conditions
// between ProductContext state updates and React Router outlet rendering,
// resulting in the wrong page component being displayed after navigation.
createRoot(document.getElementById("root")).render(<App />);
