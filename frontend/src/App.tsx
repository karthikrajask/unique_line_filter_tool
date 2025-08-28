import { useState } from 'react';
import { Filter, Trash2, Sparkles } from 'lucide-react';
import InputForm from './components/InputForm';
import OptionsPanel from './components/OptionsPanel';
import OutputViewer from './components/OutputViewer';

interface FilterOptions {
  caseSensitive: boolean;
  trimWhitespace: boolean;
  ignoreBlanks: boolean;
  sortAlphabetically: boolean;
}

interface FilterStats {
  totalLines: number;
  uniqueLines: number;
  duplicatesRemoved: number;
  blanksIgnored: number;
}

type SortDirection = 'asc' | 'desc';

interface CsvFeatures {
  sort: { column: string; direction: SortDirection };
  dedupeColumns: string[];
  filter: { column: string; contains: string };
  removeEmpty: string;
  topNPerGroup: { column: string; limit: number };
}

function App() {
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // NEW: track uploaded file name and CSV columns for CSV-only UI
  const [fileName, setFileName] = useState('');
  const [csvColumns, setCsvColumns] = useState<string[]>([]);

  const [options, setOptions] = useState<FilterOptions>({
    caseSensitive: false,
    trimWhitespace: true,
    ignoreBlanks: true,
    sortAlphabetically: false,
  });

  // CSV-only feature state
  const [csvFeatures, setCsvFeatures] = useState<CsvFeatures>({
    sort: { column: '', direction: 'asc' },
    dedupeColumns: [],
    filter: { column: '', contains: '' },
    removeEmpty: '',
    topNPerGroup: { column: '', limit: 0 },
  });

  const [stats, setStats] = useState<FilterStats>({
    totalLines: 0,
    uniqueLines: 0,
    duplicatesRemoved: 0,
    blanksIgnored: 0,
  });

  const handleFilter = async () => {
    if (!text.trim()) {
      alert('Please enter some text or upload a file to filter');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/filter-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          fileName,           // so backend can keep same extension/name
          ...options,         // caseSensitive, trimWhitespace, ignoreBlanks, sortAlphabetically
          csvFeatures,        // CSV-specific instructions (backend can ignore if not CSV)
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setOutput(data.filteredText || '');
      setStats({
        totalLines: data.totalLines ?? 0,
        uniqueLines: data.uniqueLines ?? 0,
        duplicatesRemoved: data.duplicatesRemoved ?? 0,
        blanksIgnored: data.blanksIgnored ?? 0,
      });
    } catch (err) {
      console.error('Error filtering lines:', err);
      alert('Error connecting to the server. Make sure the Go backend is running on http://localhost:8080');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setText('');
    setOutput('');
    setFileName('');
    setCsvColumns([]);
    setCsvFeatures({
      sort: { column: '', direction: 'asc' },
      dedupeColumns: [],
      filter: { column: '', contains: '' },
      removeEmpty: '',
      topNPerGroup: { column: '', limit: 0 },
    });
    setStats({
      totalLines: 0,
      uniqueLines: 0,
      duplicatesRemoved: 0,
      blanksIgnored: 0,
    });
  };

  const handleCopyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      alert('Output copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    if (!output) return;

    const ext = (fileName.split('.').pop() || 'txt').toLowerCase();
    const mime =
      ext === 'csv' ? 'text/csv' :
      ext === 'md' ? 'text/markdown' :
      ext === 'log' ? 'text/plain' :
      'text/plain';

    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Preserve original base name if we have one
    const base =
      fileName && fileName.includes('.')
        ? fileName.substring(0, fileName.lastIndexOf('.'))
        : 'filtered-lines';

    link.href = url;
    link.download = `${base}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              Unique Line Filter Tool
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Remove duplicate lines or CSV rows with customizable filtering options
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <InputForm
              text={text}
              setText={setText}
              setFileName={setFileName}
              setCsvColumns={setCsvColumns}
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleFilter}
                disabled={loading || !text.trim()}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Filter className="w-5 h-5 mr-2" />
                    Filter Lines
                  </>
                )}
              </button>

              <button
                onClick={handleClearAll}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear All
              </button>
            </div>
          </div>

          {/* Options Panel */}
          <div className="space-y-6">
            <OptionsPanel
              options={options}
              setOptions={setOptions}
              csvColumns={csvColumns}
              csvFeatures={csvFeatures}
              setCsvFeatures={setCsvFeatures}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="mt-8">
          <OutputViewer
            output={output}
            stats={stats}
            onCopy={handleCopyOutput}
            onDownload={handleDownload}
            loading={loading}
            fileName={fileName} // lets the viewer switch to table mode for .csv
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Built with React, Tailwind CSS, and Go • Designed for developers and content creators
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
