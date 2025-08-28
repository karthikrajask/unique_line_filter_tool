import React from 'react';

interface CSVOptionsPanelProps {
  csvColumns: string[];
  csvOptions: any;
  setCsvOptions: (opts: any) => void;
}

const CSVOptionsPanel: React.FC<CSVOptionsPanelProps> = ({ csvColumns, csvOptions, setCsvOptions }) => {
  const updateOption = (key: string, value: any) => {
    setCsvOptions((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-4">
      <h2 className="text-xl font-semibold mb-4">CSV Options</h2>

      {/* Remove duplicates */}
      <label className="block mb-3">
        Remove duplicates by column:
        <select value={csvOptions.removeDupesByColumn ?? ""} onChange={(e) => updateOption("removeDupesByColumn", Number(e.target.value))}>
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={idx}>{col}</option>
          ))}
        </select>
      </label>

      {/* Sort by column */}
      <label className="block mb-3">
        Sort by column:
        <select value={csvOptions.sortByColumnIndex ?? ""} onChange={(e) => updateOption("sortByColumnIndex", Number(e.target.value))}>
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={idx}>{col}</option>
          ))}
        </select>
        <label className="ml-2">
          Descending:
          <input
            type="checkbox"
            checked={csvOptions.sortDescending || false}
            onChange={(e) => updateOption("sortDescending", e.target.checked)}
          />
        </label>
      </label>

      {/* Remove rows where blank */}
      <label className="block mb-3">
        Remove rows where column is blank:
        <select value={csvOptions.removeRowsIfColumnBlank ?? ""} onChange={(e) => updateOption("removeRowsIfColumnBlank", Number(e.target.value))}>
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={idx}>{col}</option>
          ))}
        </select>
      </label>

      {/* Filter contains */}
      <label className="block mb-3">
        Filter rows where column contains:
        <select value={csvOptions.filterColumnIndex ?? ""} onChange={(e) => updateOption("filterColumnIndex", Number(e.target.value))}>
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={idx}>{col}</option>
          ))}
        </select>
        <input
          type="text"
          className="ml-2 border p-1"
          placeholder="Value..."
          value={csvOptions.filterContains || ""}
          onChange={(e) => updateOption("filterContains", e.target.value)}
        />
      </label>

      {/* Rename column */}
      <label className="block mb-3">
        Rename column:
        <select value={csvOptions.renameColumnIndex ?? ""} onChange={(e) => updateOption("renameColumnIndex", Number(e.target.value))}>
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={idx}>{col}</option>
          ))}
        </select>
        <input
          type="text"
          className="ml-2 border p-1"
          placeholder="New name..."
          value={csvOptions.newColumnName || ""}
          onChange={(e) => updateOption("newColumnName", e.target.value)}
        />
      </label>

      {/* Keep only columns */}
      <label className="block mb-3">
        Keep only columns:
        {csvColumns.map((col, idx) => (
          <label key={idx} className="ml-2">
            <input
              type="checkbox"
              checked={csvOptions.keepOnlyColumns?.includes(idx) || false}
              onChange={(e) => {
                const checked = e.target.checked;
                setCsvOptions((prev: any) => {
                  const current = new Set(prev.keepOnlyColumns || []);
                  checked ? current.add(idx) : current.delete(idx);
                  return { ...prev, keepOnlyColumns: Array.from(current) };
                });
              }}
            />
            {col}
          </label>
        ))}
      </label>
    </div>
  );
};

export default CSVOptionsPanel;
