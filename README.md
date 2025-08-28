# unique_line_filter_tool
A web-based tool to filter, clean, and process text or CSV files.
Frontend: React + TypeScript + TailwindCSS
Backend: Go (Golang HTTP server)

🚀 Features

🔹 Paste text or upload a file for processing

🔹 Remove duplicate lines

🔹 Ignore case sensitivity (optional)

🔹 Trim whitespace automatically

🔹 Skip blank lines

🔹 Sort lines alphabetically

🔹 Supports CSV file filtering with:

Sort by a selected column
Deduplicate rows based on selected column(s)
Filter rows by conditions
Remove empty rows

Extract Top N rows per group

🔹 Copy filtered output to clipboard
🔹 Download filtered output (text or CSV)

🛠️ Tech Stack

Frontend: React + TypeScript +TailwindCSS
Backend: Go(HTTP server)
Styling: Tailwind CSS
Deployment: Runs locally or can be hosted on any Go-compatible server

📦 Installation
1️⃣ Clone the repo
git clone https://github.com/karthikrajask/unique_line_filter_tool.git
cd unique_line_filter_tool

2️⃣ Install dependencies
Frontend
cd frontend
npm install
npm run dev

Backend
cd backend
go run main.go


Frontend will run at http://localhost:5173/
Backend will run at http://localhost:8080/


🔮 Future Improvements

Export directly to Excel
Advanced CSV filters and transformations
Regex-based filtering
Support very large files with streaming
