#!/bin/bash

# Setup script for Python + Excel integration
# Installs all dependencies and configures the environment

set -e

echo "======================================"
echo "Trade Republic Python Setup"
echo "======================================"

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "Python version: $PYTHON_VERSION"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install requests xlwing

# Check installations
echo ""
echo "Verifying installations..."
python3 -c "import requests; print(f'requests: {requests.__version__}')"
python3 -c "import xlwing; print(f'xlwing: {xlwing.__version__}')"

# Create data directory
echo ""
echo "Creating data directory..."
mkdir -p data
mkdir -p .tr-sessions

# Set permissions
chmod 700 .tr-sessions

# Create requirements.txt
echo ""
echo "Creating requirements.txt..."
cat > requirements.txt << 'EOF'
requests>=2.31.0
xlwing>=0.30.0
EOF

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Start the dashboard:"
echo "   npm run dev"
echo ""
echo "3. Run data collection:"
echo "   python scripts/python_api_client.py --export-excel"
echo ""
echo "======================================"
