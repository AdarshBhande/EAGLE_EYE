# EAGLE EYE — AI-Powered Electrical Cabinet Inspection

EAGLE EYE is an industrial quality-control prototype designed to assist in inspecting electrical cabinets using computer vision and engineering data. It aims to identify visual discrepancies, compare observed components with expected engineering information, highlight inspection evidence, and support corrective re-checks.

## Key Features

- **AI-based component detection:** Detects supported electrical components using a YOLO-based vision pipeline.
- **Engineering data integration:** Supports General Arrangement (GA) PDFs and Excel wire lists.
- **Automated QC checks:** Compares observed information against expected engineering data.
- **Visual defect evidence:** Displays inspection results and available annotated evidence.
- **Inspection lifecycle:** Supports re-checks after corrective actions.
- **Inspection history:** Stores and retrieves inspection records using SQLite.
- **Report export:** Exports inspection summaries in CSV and JSON formats.
- **Industrial dashboard:** React-based interface for inspections, results, and history.
- **Anomaly detection — planned extension:** MVTec AD cable, transistor, and metal-nut datasets are being evaluated for an additional visual anomaly-detection capability. This feature should be considered experimental until training and validation are complete.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Component detection | Ultralytics YOLO, PyTorch |
| Image processing | OpenCV |
| Engineering documents | PyMuPDF, pandas, openpyxl |
| Database | SQLite |
| Testing | pytest |
| Model training | Google Colab with GPU support |

## Project Structure

The exact structure may vary by project version.

```text
EAGLE_EYE/
├── backend/
│   ├── app/
│   └── tests/
├── src/
│   ├── api/
│   ├── components/
│   ├── types.ts
│   └── utils/
├── public/
├── models/
│   └── weights/
├── datasets/
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## Prerequisites

Install the following before running the application:

- Python 3.10 or the version supported by the project's dependencies
- Node.js and npm
- Git
- A modern web browser

The trained model weights and datasets may need to be obtained separately. Do not assume they are included in the repository.

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd EAGLE_EYE
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual repository URL.

### 2. Set up the Python backend

Open a terminal in the project root.

Create a virtual environment:

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks environment activation, use Command Prompt and run:

```bat
.venv\Scripts\activate.bat
```

Install backend dependencies using the requirements file present in your repository. For example, if the file is in the root:

```bash
python -m pip install -r requirements.txt
```

If your project uses `backend/requirements.txt`, use that path instead.

Start the backend:

```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```

If your actual FastAPI entry point differs, use the module path configured in your project.

### 3. Verify the backend

Open these URLs in your browser:

- Health endpoint: http://127.0.0.1:8000/health
- Interactive API documentation: http://127.0.0.1:8000/docs

The health endpoint should return a successful status response.

Keep the backend terminal running.

### 4. Set up the frontend

Open a second terminal in the project root:

```bash
npm install
npm run dev
```

Vite prints the local URL when it starts. Open that exact URL in your browser. For example, your current development setup has used:

http://localhost:3001

The port can change if another process is already using the default port.

Keep the frontend terminal running as well.

## Running the Application

Start both services:

| Service | Command | Example URL |
|---|---|---|
| FastAPI backend | `python -m uvicorn backend.app.main:app --reload --port 8000` | http://127.0.0.1:8000 |
| React frontend | `npm run dev` | http://localhost:3001 |

Run each command in a separate terminal. The backend must remain available while using features that call its API.

## Running Tests

From the project root, activate the Python virtual environment and run:

```bash
python -m pytest backend/tests
```

Build the frontend for production:

```bash
npm run build
```

Resolve any test or build failures before presenting a release as verified.

## Inspection Workflow

1. Open the EAGLE EYE dashboard.
2. Start a new inspection.
3. Upload the required cabinet photograph and engineering files supported by the application.
4. Review the engineering model preview and validation results.
5. Run the inspection.
6. Review QC findings, available visual evidence, and the inspection status.
7. Correct identified issues and submit a re-check where supported.
8. Review inspection history and export reports.

Exact outcomes depend on the available model, input data, and validation rules. AI predictions should be reviewed before being treated as confirmed defects.

## Model and Dataset Notes

The component detector and the proposed anomaly detector are separate capabilities.

- The existing YOLO model detects supported component classes.
- MVTec AD datasets for cable, transistor, and metal nut can support experimentation with visual anomaly detection.
- The MVTec AD datasets do not independently establish whether a cabinet's components match its engineering drawing.
- Dataset licenses must be respected. Check the MVTec AD non-commercial license before redistribution or commercial use.
- Keep independent evaluation images separate from training data.

Large model weights and datasets are generally better stored in a dedicated artifact or dataset repository than committed directly to Git.

## Troubleshooting

### Frontend displays "Failed to fetch"

1. Check that the backend is running.
2. Open `http://127.0.0.1:8000/health`.
3. Inspect the frontend API base URL in `src/api/client.ts` or the project's environment configuration.
4. Check backend CORS configuration for the actual frontend origin.
5. Confirm that the history API route exists and returns the expected response format.

### Port already in use

Vite may select another port automatically. Use the URL it prints. If the backend cannot bind to port 8000, check for an existing listener or a Windows socket-permission issue before changing ports.

### Model weights not found

Check the configured model path and ensure the required weights are available. Avoid committing large weights, credentials, or private datasets to the repository.

## Future Improvements

- Validate component detection on independent real-world cabinets.
- Improve label and ferrule verification using OCR and specialized detection.
- Evaluate the additional anomaly-detection model.
- Improve defect localization and evidence quality.
- Add repeatable model evaluation and confidence calibration.
- Deploy the frontend and backend for remote demonstrations.

## Disclaimer

EAGLE EYE is an AI-assisted inspection prototype. Its output should be reviewed by a qualified person and should not replace required electrical safety procedures or professional inspection.

## License

Add the license appropriate for your code and verify that all third-party datasets, models, and dependencies permit your intended use.
