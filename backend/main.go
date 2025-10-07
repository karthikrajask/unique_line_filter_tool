package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/rs/cors"
)

// ---------------- Existing Structs ----------------
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
	Sort           CsvSort   `json:"sort"`
	DedupeCols     []string  `json:"dedupeColumns"`
	Filter         CsvFilter `json:"filter"`
	RemoveEmpty    string    `json:"removeEmpty"`
	TopNPerGrp     CsvTopN   `json:"topNPerGroup"`
	RenameColumn   string    `json:"renameColumn"`
	NewColumnName  string    `json:"newColumnName"`
	KeepOnlyColumn []string  `json:"keepOnlyColumns"`
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

// ---------------- Metrics Structs ----------------
type Metric struct {
	Timestamp     string  `json:"timestamp"`
	RequestType   string  `json:"requestType"`
	DurationMS    float64 `json:"durationMS"`
	MemoryMB      float64 `json:"memoryMB"`
	NumGoroutines int     `json:"goroutines"`
	ProcessedRows int     `json:"processedRows"`
}

var (
	metrics     []Metric
	metricsLock sync.Mutex
)

// ---------------- Main ----------------
func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/filter-lines", handleFilterLines)
	mux.HandleFunc("/metrics", handleMetrics)

	handler := cors.AllowAll().Handler(mux)

	fmt.Println("✅ Go Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// ---------------- Metrics Endpoint ----------------
func handleMetrics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	metricsLock.Lock()
	defer metricsLock.Unlock()
	json.NewEncoder(w).Encode(metrics)
}

// ---------------- Handler ----------------
func handleFilterLines(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

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
		resp = processCSV(req)
	} else {
		resp = processText(req)
	}

	// Calculate performance metrics
	duration := time.Since(start).Seconds() * 1000
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	memMB := float64(m.Alloc) / (1024 * 1024)

	metric := Metric{
		Timestamp:     time.Now().Format("15:04:05"),
		RequestType:   "Go",
		DurationMS:    duration,
		MemoryMB:      memMB,
		NumGoroutines: runtime.NumGoroutine(),
		ProcessedRows: resp.TotalLines,
	}

	metricsLock.Lock()
	metrics = append(metrics, metric)
	metricsLock.Unlock()

	fmt.Printf("📊 [METRIC] Time: %.2f ms | Mem: %.2f MB | GoRoutines: %d | Lines: %d\n",
		duration, memMB, runtime.NumGoroutine(), resp.TotalLines)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// ---------------- Existing Functions ----------------

// TEXT PROCESSING
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

// CSV PROCESSING
func processCSV(req FilterRequest) FilterResponse {
	reader := csv.NewReader(strings.NewReader(req.Text))
	records, err := reader.ReadAll()
	if err != nil || len(records) == 0 {
		return FilterResponse{FilteredText: req.Text}
	}

	headers := make([]string, len(records[0]))
	for i, h := range records[0] {
		headers[i] = strings.TrimSpace(h)
	}

	data := records[1:]
	stats := FilterResponse{TotalLines: len(data)}

	colIndex := func(name string) int {
		for i, h := range headers {
			if strings.EqualFold(h, strings.TrimSpace(name)) {
				return i
			}
		}
		return -1
	}

	// (Your existing CSV logic preserved completely)
	// --- No modifications below ---

	if req.CsvFeatures.RenameColumn != "" && req.CsvFeatures.NewColumnName != "" {
		idx := colIndex(req.CsvFeatures.RenameColumn)
		if idx >= 0 {
			headers[idx] = req.CsvFeatures.NewColumnName
		}
	}

	if len(req.CsvFeatures.KeepOnlyColumn) > 0 {
		keepIdx := []int{}
		for _, col := range req.CsvFeatures.KeepOnlyColumn {
			if id := colIndex(col); id >= 0 {
				keepIdx = append(keepIdx, id)
			}
		}
		newHeaders := []string{}
		for _, i := range keepIdx {
			newHeaders = append(newHeaders, headers[i])
		}
		headers = newHeaders
		newData := [][]string{}
		for _, row := range data {
			newRow := []string{}
			for _, i := range keepIdx {
				if i < len(row) {
					newRow = append(newRow, row[i])
				} else {
					newRow = append(newRow, "")
				}
			}
			newData = append(newData, newRow)
		}
		data = newData
	}

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

	if len(req.CsvFeatures.DedupeCols) > 0 {
		keys := make(map[string]bool)
		filtered := [][]string{}
		idxs := []int{}
		for _, col := range req.CsvFeatures.DedupeCols {
			if id := colIndex(col); id >= 0 {
				idxs = append(idxs, id)
			}
		}
		for _, row := range data {
			keyVals := []string{}
			for _, i := range idxs {
				if i < len(row) {
					keyVals = append(keyVals, row[i])
				}
			}
			key := strings.Join(keyVals, "|")
			if !keys[key] {
				keys[key] = true
				filtered = append(filtered, row)
			}
		}
		data = filtered
	}

	if req.CsvFeatures.Sort.Column != "" {
		idx := colIndex(req.CsvFeatures.Sort.Column)
		if idx >= 0 {
			direction := strings.ToLower(req.CsvFeatures.Sort.Direction)
			sort.SliceStable(data, func(i, j int) bool {
				if direction == "desc" {
					return data[i][idx] > data[j][idx]
				}
				return data[i][idx] < data[j][idx]
			})
		}
	}

	if req.CsvFeatures.TopNPerGrp.Column != "" && req.CsvFeatures.TopNPerGrp.Limit > 0 {
		idx := colIndex(req.CsvFeatures.TopNPerGrp.Column)
		if idx >= 0 {
			grouped := map[string][][]string{}
			for _, row := range data {
				group := ""
				if idx < len(row) {
					group = row[idx]
				}
				grouped[group] = append(grouped[group], row)
			}
			final := [][]string{}
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

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)
	writer.Write(headers)
	writer.WriteAll(data)
	writer.Flush()

	stats.UniqueLines = len(data)
	stats.FilteredText = buf.String()
	return stats
}
