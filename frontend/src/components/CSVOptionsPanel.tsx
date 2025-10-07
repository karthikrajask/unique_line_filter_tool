import React from 'react';

export interface CsvFeatures {
  Sort: { Column: string; Direction: 'asc' | 'desc' };
  DedupeCols: string[];
  Filter: { Column: string; Contains: string };
  RemoveEmpty: string;
  TopNPerGrp: { Column: string; Limit: number };
  RenameColumn: string;
  NewColumnName: string;
  KeepOnlyColumn: string[];
}

interface CSVOptionsPanelProps {
  csvColumns: string[];
  csvFeatures: CsvFeatures;
  setCsvFeatures: React.Dispatch<React.SetStateAction<CsvFeatures>>;
}

const CSVOptionsPanel: React.FC<CSVOptionsPanelProps> = ({
  csvColumns,
  csvFeatures,
  setCsvFeatures,
}) => {
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">CSV Options</h2>

      {/* Sort */}
      <div>
        <label>Sort Column:</label>
        <select
          value={csvFeatures.Sort.Column}
          onChange={(e) =>
            setCsvFeatures((prev) => ({
              ...prev,
              Sort: { ...prev.Sort, Column: e.target.value },
            }))
          }
          className="mt-1 block w-full border-gray-300 rounded-md"
        >
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={col}>
              {col}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center mt-2">
          <input
            type="checkbox"
            checked={csvFeatures.Sort.Direction === 'desc'}
            onChange={(e) =>
              setCsvFeatures((prev) => ({
                ...prev,
                Sort: { ...prev.Sort, Direction: e.target.checked ? 'desc' : 'asc' },
              }))
            }
            className="mr-2"
          />
          Descending
        </label>
      </div>

      {/* Dedupe Columns */}
      <div>
        <label>Remove Duplicates By Column(s):</label>
        <select
          multiple
          value={csvFeatures.DedupeCols}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
            setCsvFeatures((prev) => ({ ...prev, DedupeCols: selected }));
          }}
          className="mt-1 block w-full border-gray-300 rounded-md"
        >
          {csvColumns.map((col, idx) => (
            <option key={idx} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* Filter */}
      <div>
        <label>Filter Column:</label>
        <select
          value={csvFeatures.Filter.Column}
          onChange={(e) =>
            setCsvFeatures((prev) => ({
              ...prev,
              Filter: { ...prev.Filter, Column: e.target.value },
            }))
          }
          className="mt-1 block w-full border-gray-300 rounded-md"
        >
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={col}>
              {col}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Contains..."
          value={csvFeatures.Filter.Contains}
          onChange={(e) =>
            setCsvFeatures((prev) => ({
              ...prev,
              Filter: { ...prev.Filter, Contains: e.target.value },
            }))
          }
          className="mt-1 block w-full border-gray-300 rounded-md"
        />
      </div>

      {/* Remove Empty */}
      <div>
        <label>Remove Rows If Column Blank:</label>
        <select
          value={csvFeatures.RemoveEmpty}
          onChange={(e) => setCsvFeatures((prev) => ({ ...prev, RemoveEmpty: e.target.value }))}
          className="mt-1 block w-full border-gray-300 rounded-md"
        >
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* Rename Column */}
      <div>
        <label>Rename Column:</label>
        <select
          value={csvFeatures.RenameColumn}
          onChange={(e) => setCsvFeatures((prev) => ({ ...prev, RenameColumn: e.target.value }))}
          className="mt-1 block w-full border-gray-300 rounded-md"
        >
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={col}>
              {col}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="New name..."
          value={csvFeatures.NewColumnName}
          onChange={(e) =>
            setCsvFeatures((prev) => ({ ...prev, NewColumnName: e.target.value }))
          }
          className="mt-1 block w-full border-gray-300 rounded-md"
        />
      </div>

      {/* Top N per Group */}
      <div>
        <label>Top N Per Group (Column & Limit):</label>
        <select
          value={csvFeatures.TopNPerGrp.Column}
          onChange={(e) =>
            setCsvFeatures((prev) => ({ ...prev, TopNPerGrp: { ...prev.TopNPerGrp, Column: e.target.value } }))
          }
          className="mt-1 block w-full border-gray-300 rounded-md"
        >
          <option value="">-- Select column --</option>
          {csvColumns.map((col, idx) => (
            <option key={idx} value={col}>
              {col}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          placeholder="Limit"
          value={csvFeatures.TopNPerGrp.Limit}
          onChange={(e) =>
            setCsvFeatures((prev) => ({
              ...prev,
              TopNPerGrp: { ...prev.TopNPerGrp, Limit: parseInt(e.target.value) || 0 },
            }))
          }
          className="mt-1 block w-full border-gray-300 rounded-md"
        />
      </div>
    </div>
  );
};

export default CSVOptionsPanel;
