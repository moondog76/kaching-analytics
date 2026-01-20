'use client'

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Table, ArrowRight, Trash2 } from 'lucide-react'

interface CSVStructure {
  columns: string[]
  sampleRows: Record<string, string>[]
  suggestedTable: 'transactions' | 'daily_metrics' | 'merchants' | 'unknown'
  mappings: Record<string, string>
  rowCount: number
}

interface ImportResult {
  success: boolean
  table: string
  totalRows: number
  importedRows: number
  skippedRows: number
  errors: string[]
  duration: number
}

const TARGET_COLUMNS: Record<string, string[]> = {
  transactions: ['merchant_id', 'merchant_name', 'transaction_date', 'amount', 'amount_cents', 'customer_id', 'cashback_amount', 'category'],
  daily_metrics: ['merchant_id', 'merchant_name', 'date', 'transactions_count', 'revenue', 'unique_customers', 'cashback_paid'],
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [structure, setStructure] = useState<CSVStructure | null>(null)
  const [targetTable, setTargetTable] = useState<string>('')
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [clearExisting, setClearExisting] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      await analyzeFile(droppedFile)
    } else {
      setError('Please upload a CSV file')
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      await analyzeFile(selectedFile)
    }
  }

  const analyzeFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('action', 'detect')

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setStructure(data)
        setTargetTable(data.suggestedTable !== 'unknown' ? data.suggestedTable : '')
        setMappings(data.mappings || {})
      } else {
        setError(data.error || 'Failed to analyze file')
      }
    } catch (err) {
      setError(`Error analyzing file: ${err}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleImport = async () => {
    if (!file || !targetTable || Object.keys(mappings).length === 0) {
      setError('Please select a file, target table, and map at least one column')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('action', 'import')
      formData.append('targetTable', targetTable)
      formData.append('columnMappings', JSON.stringify(mappings))
      formData.append('clearExisting', String(clearExisting))

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.result)
      } else {
        setError(data.error || 'Import failed')
      }
    } catch (err) {
      setError(`Import error: ${err}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleAggregate = async () => {
    setIsImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('action', 'aggregate')
      formData.append('clearExisting', 'true')

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.result)
      } else {
        setError(data.error || 'Aggregation failed')
      }
    } catch (err) {
      setError(`Aggregation error: ${err}`)
    } finally {
      setIsImporting(false)
    }
  }

  const updateMapping = (csvColumn: string, dbColumn: string) => {
    if (dbColumn === '') {
      const newMappings = { ...mappings }
      delete newMappings[csvColumn]
      setMappings(newMappings)
    } else {
      setMappings({ ...mappings, [csvColumn]: dbColumn })
    }
  }

  const reset = () => {
    setFile(null)
    setStructure(null)
    setTargetTable('')
    setMappings({})
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Import</h1>
          <p className="text-gray-600 mt-2">Import CSV files into the KaChing Analytics database</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Import Successful!</p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-green-600">Table</p>
                    <p className="font-semibold text-green-900">{result.table}</p>
                  </div>
                  <div>
                    <p className="text-green-600">Total Rows</p>
                    <p className="font-semibold text-green-900">{result.totalRows.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-green-600">Imported</p>
                    <p className="font-semibold text-green-900">{result.importedRows.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-green-600">Duration</p>
                    <p className="font-semibold text-green-900">{(result.duration / 1000).toFixed(1)}s</p>
                  </div>
                </div>
                {result.skippedRows > 0 && (
                  <p className="mt-2 text-yellow-700">
                    {result.skippedRows.toLocaleString()} rows skipped due to missing or invalid data
                  </p>
                )}
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-700 font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-red-600 text-sm">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={reset}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Import Another File
                </button>
              </div>
            </div>
          </div>
        )}

        {!result && (
          <>
            {/* File Upload Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isAnalyzing ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-lg font-medium text-blue-700">Analyzing CSV structure...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="w-12 h-12 text-green-500" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={reset}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700">Drop your CSV file here</p>
                  <p className="text-gray-500">or</p>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
                    Browse Files
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* CSV Structure & Mapping */}
            {structure && (
              <div className="mt-8 space-y-6">
                {/* Detected Info */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">CSV Structure Detected</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Columns</p>
                      <p className="text-2xl font-bold text-gray-900">{structure.columns.length}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Rows</p>
                      <p className="text-2xl font-bold text-gray-900">{structure.rowCount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Suggested Table</p>
                      <p className="text-2xl font-bold text-blue-600">{structure.suggestedTable}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Auto-mapped</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Object.keys(structure.mappings).length} columns
                      </p>
                    </div>
                  </div>

                  {/* Sample Data Preview */}
                  <div className="overflow-x-auto">
                    <h3 className="font-medium text-gray-700 mb-2">Sample Data (First 5 Rows)</h3>
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          {structure.columns.map((col) => (
                            <th key={col} className="px-3 py-2 text-left font-medium text-gray-600">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {structure.sampleRows.map((row, i) => (
                          <tr key={i} className="border-b">
                            {structure.columns.map((col) => (
                              <td key={col} className="px-3 py-2 text-gray-800 truncate max-w-[200px]">
                                {row[col] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Target Table Selection */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Configuration</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Table</label>
                      <select
                        value={targetTable}
                        onChange={(e) => setTargetTable(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a table...</option>
                        <option value="transactions">transactions</option>
                        <option value="daily_metrics">daily_metrics</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="clearExisting"
                        checked={clearExisting}
                        onChange={(e) => setClearExisting(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="clearExisting" className="text-sm text-gray-700">
                        Clear existing data before import (recommended for full replacement)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Column Mapping */}
                {targetTable && (
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Column Mapping</h2>
                    <p className="text-gray-600 mb-4">
                      Map your CSV columns to database fields. Only mapped columns will be imported.
                    </p>

                    <div className="space-y-3">
                      {structure.columns.map((csvCol) => (
                        <div key={csvCol} className="flex items-center gap-4">
                          <div className="w-1/3">
                            <span className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
                              {csvCol}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="w-1/3">
                            <select
                              value={mappings[csvCol] || ''}
                              onChange={(e) => updateMapping(csvCol, e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">(skip this column)</option>
                              {TARGET_COLUMNS[targetTable]?.map((dbCol) => (
                                <option key={dbCol} value={dbCol}>
                                  {dbCol}
                                </option>
                              ))}
                            </select>
                          </div>
                          {mappings[csvCol] && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Button */}
                <div className="flex gap-4">
                  <button
                    onClick={handleImport}
                    disabled={isImporting || !targetTable || Object.keys(mappings).length === 0}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Table className="w-5 h-5" />
                        Start Import
                      </>
                    )}
                  </button>

                  {targetTable === 'transactions' && (
                    <button
                      onClick={handleAggregate}
                      disabled={isImporting}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition"
                    >
                      Aggregate to Metrics
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {!structure && (
              <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleAggregate}
                    disabled={isImporting}
                    className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition flex items-center gap-4"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Table className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Regenerate Daily Metrics</p>
                      <p className="text-sm text-gray-500">
                        Recalculate daily_metrics from existing transactions
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
