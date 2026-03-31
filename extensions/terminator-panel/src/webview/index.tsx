import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import type { VsCodeApi } from "./types";

const vscode: VsCodeApi = acquireVsCodeApi();

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App vscode={vscode} />);
