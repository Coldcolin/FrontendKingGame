"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

const THEME = "diffarena";

const defineTheme: OnMount = (_editor, monaco) => {
  monaco.editor.defineTheme(THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "tag", foreground: "00AEEF" },
      { token: "attribute.name", foreground: "EEF2EF", fontStyle: "" },
      { token: "attribute.value", foreground: "EC5FAF" },
      { token: "string", foreground: "EC5FAF" },
      { token: "comment", foreground: "6E8C82", fontStyle: "italic" },
      { token: "delimiter", foreground: "7FA396" },
    ],
    colors: {
      "editor.background": "#12181A",
      "editor.foreground": "#EEF2EF",
      "editorLineNumber.foreground": "#3D6B5D",
      "editorLineNumber.activeForeground": "#EEF2EF",
      "editor.lineHighlightBackground": "#1A2225",
      "editor.selectionBackground": "#FFF20040",
      "editorCursor.foreground": "#FFF200",
      "editorIndentGuide.background1": "#1F2A2D",
      "scrollbarSlider.background": "#3D6B5D66",
    },
  });
  monaco.editor.setTheme(THEME);
};

export function CodeEditor({
  value,
  onChange,
  onSubmit,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}) {
  const submitRef = useRef(onSubmit);
  useEffect(() => {
    submitRef.current = onSubmit;
  }, [onSubmit]);
  return (
    <Editor
      language="html"
      value={value}
      theme="vs-dark"
      onChange={(v) => onChange(v ?? "")}
      onMount={(editor, monaco) => {
        defineTheme(editor, monaco);
        // Monaco measures glyphs itself, so it needs the resolved next/font family name.
        const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono").trim();
        if (mono) editor.updateOptions({ fontFamily: `${mono}, ui-monospace, monospace` });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => submitRef.current());
        editor.focus();
      }}
      loading={<span className="text-muted">Loading editor…</span>}
      options={{
        readOnly,
        fontFamily: "ui-monospace, monospace",
        fontSize: 13,
        lineHeight: 21,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        padding: { top: 12 },
        tabSize: 2,
        renderLineHighlight: "line",
        automaticLayout: true,
      }}
    />
  );
}
