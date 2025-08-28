package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"

	"github.com/rs/cors"
)

type FilterOptions struct {
	CaseSensitive      bool `json:"caseSensitive"`
	TrimWhitespace     bool `json:"trimWhitespace"`
	IgnoreBlanks       bool `json:"ignoreBlanks"`
	SortAlphabetically bool `json:"sortAlphabetically"`
}

type CsvSort struct {
	Column    string `json:"column"`
	Direction string `json:"direction"` // "asc" or "desc"
}

type CsvFilter struct {
	Column   string `json:"column"`
	Contains string `json:"contains"`
}

type CsvTopN struct {
	Column string `json:"column"`
	Limit  int    `json:"limit"`
}

type CsvFeatures struct {
	Sort        CsvSort   `json:"sort"`
	DedupeCols  []string  `json:"dedupeColumns"`
	Filter      CsvFilter `json:"filter"`
	RemoveEmpty string    `json:"removeEmpty"`
	TopNPerGrp  CsvTopN   `json:"topNPerGroup"`
}

type FilterRequest struct {
	Text     string `json:"text"`
	FileName string `json:"fileName"`
	FilterOptions
	CsvFeatures CsvFeatures `json:"csvFeatures"`
}

type FilterResponse struct {
	FilteredText      string `json:"filteredText"`
	TotalLines        int    `json:"totalLines"`
	UniqueLines       int    `json:"uniqueLines"`
	DuplicatesRemoved int    `json:"duplicatesRemoved"`
	BlanksIgnored     int    `json:"blanksIgnored"`
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/filter-lines", handleFilterLines)

	handler := cors.AllowAll().Handler(mux)

	fmt.Println("✅ Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func handleFilterLines(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req FilterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	isCSV := strings.HasSuffix(strings.ToLower(req.FileName), ".csv")

	var resp FilterResponse
	if isCSV {
		resp.FilteredText = processCSV(req)
	} else {
		resp = processText(req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// -------- TEXT PROCESSING ----------
func processText(req FilterRequest) FilterResponse {
	lines := strings.Split(req.Text, "\n")
	seen := make(map[string]bool)
	var result []string
	stats := FilterResponse{}

	for _, line := range lines {
		stats.TotalLines++
		if req.TrimWhitespace {
			line = strings.TrimSpace(line)
		}
		if req.IgnoreBlanks && line == "" {
			stats.BlanksIgnored++
			continue
		}
		key := line
		if !req.CaseSensitive {
			key = strings.ToLower(line)
		}
		if !seen[key] {
			seen[key] = true
			result = append(result, line)
		} else {
			stats.DuplicatesRemoved++
		}
	}

	if req.SortAlphabetically {
		sort.Strings(result)
	}

	stats.UniqueLines = len(result)
	stats.FilteredText = strings.Join(result, "\n")
	return stats
}

// -------- CSV PROCESSING ----------
func processCSV(req FilterRequest) string {
	reader := csv.NewReader(strings.NewReader(req.Text))
	records, err := reader.ReadAll()
	if err != nil || len(records) == 0 {
		return req.Text // fallback
	}

	headers := records[0]
	data := records[1:]

	colIndex := func(name string) int {
		for i, h := range headers {
			if strings.EqualFold(h, name) {
				return i
			}
		}
		return -1
	}

	// Filter rows
	if req.CsvFeatures.Filter.Column != "" && req.CsvFeatures.Filter.Contains != "" {
		idx := colIndex(req.CsvFeatures.Filter.Column)
		if idx >= 0 {
			filtered := [][]string{}
			for _, row := range data {
				if idx < len(row) && strings.Contains(strings.ToLower(row[idx]), strings.ToLower(req.CsvFeatures.Filter.Contains)) {
					filtered = append(filtered, row)
				}
			}
			data = filtered
		}
	}

	// Remove empty
	if req.CsvFeatures.RemoveEmpty != "" {
		idx := colIndex(req.CsvFeatures.RemoveEmpty)
		if idx >= 0 {
			filtered := [][]string{}
			for _, row := range data {
				if idx < len(row) && strings.TrimSpace(row[idx]) != "" {
					filtered = append(filtered, row)
				}
			}
			data = filtered
		}
	}

	// Dedupe by columns
	if len(req.CsvFeatures.DedupeCols) > 0 {
		keys := make(map[string]bool)
		filtered := [][]string{}
		var idxs []int
		for _, col := range req.CsvFeatures.DedupeCols {
			if id := colIndex(col); id >= 0 {
				idxs = append(idxs, id)
			}
		}
		for _, row := range data {
			var vals []string
			for _, i := range idxs {
				if i < len(row) {
					vals = append(vals, row[i])
				}
			}
			key := strings.Join(vals, "|")
			if !keys[key] {
				keys[key] = true
				filtered = append(filtered, row)
			}
		}
		data = filtered
	}

	// Sort
	if req.CsvFeatures.Sort.Column != "" {
		idx := colIndex(req.CsvFeatures.Sort.Column)
		if idx >= 0 {
			sort.SliceStable(data, func(i, j int) bool {
				if idx >= len(data[i]) || idx >= len(data[j]) {
					return false
				}
				if req.CsvFeatures.Sort.Direction == "desc" {
					return strings.Compare(data[i][idx], data[j][idx]) > 0
				}
				return strings.Compare(data[i][idx], data[j][idx]) < 0
			})
		}
	}

	// Top N per group
	if req.CsvFeatures.TopNPerGrp.Column != "" && req.CsvFeatures.TopNPerGrp.Limit > 0 {
		idx := colIndex(req.CsvFeatures.TopNPerGrp.Column)
		if idx >= 0 {
			grouped := map[string][][]string{}
			for _, row := range data {
				if idx < len(row) {
					group := row[idx]
					grouped[group] = append(grouped[group], row)
				}
			}
			var final [][]string
			for _, rows := range grouped {
				limit := req.CsvFeatures.TopNPerGrp.Limit
				if len(rows) < limit {
					limit = len(rows)
				}
				final = append(final, rows[:limit]...)
			}
			data = final
		}
	}

	// Write back CSV
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)
	writer.Write(headers)
	writer.WriteAll(data)
	writer.Flush()
	return buf.String()
}
