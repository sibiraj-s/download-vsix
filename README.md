# Download VSIX

A simple web application to download VSIX packages directly from the Visual Studio Code Marketplace. (Made for personal use since I didn't trust all extensions published on open-vsx yet)

## Usage

1. Visit the application
2. Paste a VS Code Marketplace extension URL (e.g., `https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-containers`)
3. Click the download button
4. The latest VSIX package will be downloaded to your device

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd download-vsix

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

> [!IMPORTANT]
> This tool uses unofficial APIs to download VSIX packages and may stop working anytime
