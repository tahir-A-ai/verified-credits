"use client";

import { useRef, useState } from "react";

interface UploadPanelProps {
  creditsAvailable: number;
  onCreditsChange: (value: number) => void;
  onValidate: (file: File | null) => void;
  loading: boolean;
}

export function UploadPanel({
  creditsAvailable,
  onCreditsChange,
  onValidate,
  loading,
}: UploadPanelProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setPendingFile(file);
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs flex flex-col gap-5">
      {/* Step 1: Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            1. Lead Dataset
          </h2>
          {fileName && (
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                setPendingFile(null);
              }}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              Clear file
            </button>
          )}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">{fileName}</span>
            </div>
          ) : (
            <>Drop a SaaSquatch CSV export here, or click to choose a file</>
          )}
        </div>
      </div>

      {/* Step 2: Wallet & Validate Button */}
      <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-4 flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          Credits in wallet
          <input
            type="number"
            min={0}
            value={creditsAvailable}
            onChange={(e) => onCreditsChange(Math.max(0, Number(e.target.value)))}
            className="w-20 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-200"
          />
        </label>

        <button
          type="button"
          disabled={loading || !pendingFile}
          onClick={() => onValidate(pendingFile)}
          className="rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          {loading
            ? "Validating leads…"
            : !pendingFile
            ? "Upload a CSV to validate"
            : "Validate leads"}
        </button>
      </div>
    </div>
  );
}
