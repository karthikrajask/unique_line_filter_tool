import React from "react";
import {
  Copy,
  Download,
  FileText,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import Papa from "papaparse";

interface OutputViewerProps {
  output: string;
  stats: {
    totalLines: number;
    uniqueLines: number;
    duplicatesRemoved: number;
    blanksIgnored: number;
  };
  onCopy: () => void;
  onDownload: () => void;
  loading: boolean;
  fileName?: string; // detect CSV
}

const OutputViewer: React.FC<OutputViewerProps> = ({
  output,
  stats,
  onCopy,
  onDownload,
  loading,
  fileName = "",
}) => {
  const isCsv = fileName.toLowerCase().endsWith(".csv");

  const parseCsv = (csvText: string): string[][] => {
    if (!csvText.trim()) return [];
    const parsed = Papa.parse(csvText.trim(), {
      skipEmptyLines: true,
    });
    return parsed.data as string[][];
  };

  const csvData = isCsv && output ? parseCsv(output) : [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Filtered Output
        </h2>

        <div className="flex gap-2">
          <button
            onClick={onCopy}
            disabled={!output || loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </button>

          <button
            onClick={onDownload}
            disabled={!output || loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      {/* Stats */}
      {(stats.totalLines > 0 || loading) && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {loading ? "..." : stats.totalLines}
              </div>
              <div className="text-gray-600">Total Lines</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {loading ? "..." : stats.uniqueLines}
              </div>
              <div className="text-gray-600">Unique Lines</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {loading ? "..." : stats.duplicatesRemoved}
              </div>
              <div className="text-gray-600">Duplicates Removed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {loading ? "..." : stats.blanksIgnored}
              </div>
              <div className="text-gray-600">Blanks Ignored</div>
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          </div>
        )}

        {isCsv && csvData.length > 0 ? (
          <div className="overflow-auto border border-gray-300 rounded-lg max-h-96">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {csvData[0].map((header, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-2 text-left font-semibold text-gray-700 border-b whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {csvData.slice(1).map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={`hover:bg-gray-50 ${
                      rowIdx % 2 === 0 ? "bg-gray-50/30" : ""
                    }`}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-2 text-gray-800 border-b whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <textarea
            value={output}
            readOnly
            placeholder={
              loading
                ? "Processing your text..."
                : "Filtered results will appear here..."
            }
            className="w-full h-64 p-4 border border-gray-300 rounded-lg textarea-mono text-sm resize-none bg-gray-50 focus:outline-none transition-all"
          />
        )}
      </div>

      {output && !loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          Processing complete! {stats.uniqueLines} unique lines found.
        </div>
      )}
    </div>
  );
};

export default OutputViewer;
