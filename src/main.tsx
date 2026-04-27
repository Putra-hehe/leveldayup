import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { ErrorBoundary } from "./app/components/ErrorBoundary";
import { initAnalytics, initAppCheck } from "./app/firebase";
import { installDOMGuards } from "./app/utils/domGuards";

installDOMGuards();

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
}

void initAnalytics();
void initAppCheck();
