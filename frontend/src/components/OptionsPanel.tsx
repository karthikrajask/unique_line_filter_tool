import React from 'react';
import { Settings, Table } from 'lucide-react';

interface OptionsPanelProps {
  options: {
    caseSensitive: boolean;
    trimWhitespace: boolean;
    ignoreBlanks: boolean;
    sortAlphabetically: boolean;
  };
  setOptions: React.Dispatch<React.SetStateAction<any>>;
  csvColumns?: string[];
  csvFeatures?: {
    sort?: { column: string; direction: 'asc' | 'desc' };
    dedupeColumns?: string[];
    filter?: { column: string; contains: string };
    removeEmpty?: string;
    topNPerGroup?: { column: string; limit: number };
  };
  setCsvFeatures?: React.Dispatch<React.SetStateAction<any>>;
}

const OptionsPanel: React.FC<OptionsPanelProps> = ({
  options,
  setOptions,
  csvColumns = [],
  csvFeatures = {},
  setCsvFeatures = () => {}
}) => {
  const handleOptionChange = (key: string, value: boolean) => {
    setOptions((prev: typeof options) => ({ ...prev, [key]: value }));
  };

  const optionItems = [
    { key: 'caseSensitive', label: 'Case Sensitive', description: 'Treat uppercase and lowercase as different' },
    { key: 'trimWhitespace', label: 'Trim Whitespaces', description: 'Remove leading and trailing spaces' },
    { key: 'ignoreBlanks', label: 'Ignore Blank Lines', description: 'Skip empty or whitespace-only lines' },
    { key: 'sortAlphabetically', label: 'Sort Alphabetically', description: 'Sort unique lines in alphabetical order' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Filter Options
      </h2>

      <div className="space-y-4">
        {optionItems.map((item) => (
          <label key={item.key} className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options[item.key as keyof typeof options]}
              onChange={(e) => handleOptionChange(item.key, e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                {item.label}
              </div>
              <div className="text-sm text-gray-500 mt-1">{item.description}</div>
            </div>
          </label>
        ))}

        {/* CSV-specific section */}
        {csvColumns.length > 0 && (
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <Table className="w-5 h-5" />
              CSV Features
            </h3>

            {/* Sort by column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by Column</label>
              <div className="flex gap-2">
                <select
                  value={csvFeatures.sort?.column || ''}
                  onChange={(e) => setCsvFeatures((prev: any) => ({
                    ...prev,
                    sort: { ...prev.sort, column: e.target.value }
                  }))}
                  className="flex-1 border border-gray-300 rounded-lg p-2"
                >
                  <option value="">-- Select Column --</option>
                  {csvColumns.map((col, idx) => (
                    <option key={idx} value={col}>{col}</option>
                  ))}
                </select>
                <select
                  value={csvFeatures.sort?.direction || 'asc'}
                  onChange={(e) => setCsvFeatures((prev: any) => ({
                    ...prev,
                    sort: { ...prev.sort, direction: e.target.value }
                  }))}
                  className="w-28 border border-gray-300 rounded-lg p-2"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            {/* Dedupe by column(s) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remove duplicates based on columns</label>
              <select
                multiple
                value={csvFeatures.dedupeColumns || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setCsvFeatures((prev: any) => ({ ...prev, dedupeColumns: selected }));
                }}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                {csvColumns.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Filter rows containing text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter rows where column contains</label>
              <div className="flex gap-2">
                <select
                  value={csvFeatures.filter?.column || ''}
                  onChange={(e) => setCsvFeatures((prev: any) => ({
                    ...prev,
                    filter: { ...prev.filter, column: e.target.value }
                  }))}
                  className="flex-1 border border-gray-300 rounded-lg p-2"
                >
                  <option value="">-- Select Column --</option>
                  {csvColumns.map((col, idx) => (
                    <option key={idx} value={col}>{col}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Contains..."
                  value={csvFeatures.filter?.contains || ''}
                  onChange={(e) => setCsvFeatures((prev: any) => ({
                    ...prev,
                    filter: { ...prev.filter, contains: e.target.value }
                  }))}
                  className="flex-1 border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Remove empty rows for specific column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remove rows where column is empty</label>
              <select
                value={csvFeatures.removeEmpty || ''}
                onChange={(e) => setCsvFeatures((prev: any) => ({ ...prev, removeEmpty: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">-- Select Column --</option>
                {csvColumns.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Top N per group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keep top N rows per group</label>
              <div className="flex gap-2">
                <select
                  value={csvFeatures.topNPerGroup?.column || ''}
                  onChange={(e) => setCsvFeatures((prev: any) => ({
                    ...prev,
                    topNPerGroup: { ...prev.topNPerGroup, column: e.target.value }
                  }))}
                  className="flex-1 border border-gray-300 rounded-lg p-2"
                >
                  <option value="">-- Select Column --</option>
                  {csvColumns.map((col, idx) => (
                    <option key={idx} value={col}>{col}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="N"
                  value={csvFeatures.topNPerGroup?.limit || ''}
                  onChange={(e) => setCsvFeatures((prev: any) => ({
                    ...prev,
                    topNPerGroup: { ...prev.topNPerGroup, limit: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-24 border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptionsPanel;
