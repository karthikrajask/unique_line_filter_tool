import { useState } from "react";
import { Filter, Trash2, Sparkles } from "lucide-react";
import InputForm from "./components/InputForm";
import OptionsPanel from "./components/OptionsPanel";
import CSVOptionsPanel, { CsvFeatures } from "./components/CSVOptionsPanel";
import OutputViewer from "./components/OutputViewer";
import MetricsDashboard from "./components/MetricsDashboard";


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


function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [csvColumns, setCsvColumns] = useState<string[]>([]);

  const [options, setOptions] = useState<FilterOptions>({
    caseSensitive: false,
    trimWhitespace: true,
    ignoreBlanks: true,
    sortAlphabetically: false,
  });

  const [stats, setStats] = useState<FilterStats>({
    totalLines: 0,
    uniqueLines: 0,
    duplicatesRemoved: 0,
    blanksIgnored: 0,
  });

  // CSV features/state matching the CSVOptionsPanel component
  const [csvFeatures, setCsvFeatures] = useState<CsvFeatures>({
    Sort: { Column: "", Direction: "asc" },
    DedupeCols: [],
    Filter: { Column: "", Contains: "" },
    RemoveEmpty: "",
    TopNPerGrp: { Column: "", Limit: 0 },
    RenameColumn: "",
    NewColumnName: "",
    KeepOnlyColumn: [],
  });

  // Handle uploaded file or pasted text
  const handleFileContent = (content: string, uploadedFileName: string) => {
    setText(content);
    setFileName(uploadedFileName);

    if (uploadedFileName.toLowerCase().endsWith(".csv")) {
      const lines = content.split(/\r?\n/);
      if (lines.length > 0) {
        const headers = lines[0].split(",").map((h) => h.trim());
        setCsvColumns(headers);
      }
    } else {
      setCsvColumns([]);
    }
  };

  const handleFilter = async () => {
    if (!text.trim()) {
      alert("Please enter some text or upload a file to filter");
      return;
    }

    setLoading(true);
    try {
      // Use csvFeatures state (already matches backend CsvFeatures shape)
      // send it straight through as part of the request

      const body = {
        text,
        fileName,
        ...options,
        csvFeatures,
      };

      const response = await fetch("http://localhost:8080/filter-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setOutput(data.filteredText || "");
      setStats({
        totalLines: data.totalLines || 0,
        uniqueLines: data.uniqueLines || 0,
        duplicatesRemoved: data.duplicatesRemoved || 0,
        blanksIgnored: data.blanksIgnored || 0,
      });
    } catch (error) {
      console.error("Error filtering lines:", error);
      alert("Error connecting to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setText("");
    setOutput("");
    setFileName("");
    setCsvColumns([]);
    setCsvFeatures({
      Sort: { Column: "", Direction: "asc" },
      DedupeCols: [],
      Filter: { Column: "", Contains: "" },
      RemoveEmpty: "",
      TopNPerGrp: { Column: "", Limit: 0 },
      RenameColumn: "",
      NewColumnName: "",
      KeepOnlyColumn: [],
    });
    setStats({ totalLines: 0, uniqueLines: 0, duplicatesRemoved: 0, blanksIgnored: 0 });
  };

  const handleCopyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      alert("Output copied to clipboard!");
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const extension = fileName.split(".").pop() || "txt";
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `filtered-lines.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            Unique Line Filter Tool
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Remove duplicate lines or CSV rows with customizable filtering options
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <InputForm
              text={text}
              setText={(t) => handleFileContent(t, fileName || "manual-input.txt")}
              setFileName={setFileName}
              setCsvColumns={setCsvColumns}
            />

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleFilter}
                disabled={loading || !text.trim()}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <OptionsPanel options={options} setOptions={setOptions} />
            {csvColumns.length > 0 && (
              <CSVOptionsPanel
                csvColumns={csvColumns}
                csvFeatures={csvFeatures}
                setCsvFeatures={setCsvFeatures}
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          <OutputViewer
            output={output}
            stats={stats}
            onCopy={handleCopyOutput}
            onDownload={handleDownload}
            loading={loading}
            fileName={fileName}
          />
          <div className="mt-12">
              <MetricsDashboard />
          </div>
        </div>
      </main>

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
