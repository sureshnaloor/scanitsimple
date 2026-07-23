import React, { useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Paper } from '@mui/material';
import {QRCodeSVG} from 'qrcode.react';

const QR_SIZES = {
  small: {
    qrSize: 80,
    gridCols: 6,
    gridRows: 7,
    perPage: 42,
    fontSize: '14px',
    containerHeight: '297mm',
    gap: '8px',
    padding: '2mm',
  },
  medium: {
    qrSize: 120,
    gridCols: 3,
    gridRows: 7,
    perPage: 21,
    fontSize: '18px',
    containerHeight: '297mm',
    gap: '16px',
    padding: '3mm',
  },
  large: {
    qrSize: 180,
    gridCols: 2,
    gridRows: 7,
    perPage: 14,
    fontSize: '24px',
    containerHeight: '297mm',
    gap: '16px',
    padding: '3mm',
  }
};

const QRCodePrint = () => {
  const [collection, setCollection] = useState('equipmentandtools');
  const [mode, setMode] = useState('range');
  const [startAsset, setStartAsset] = useState('');
  const [endAsset, setEndAsset] = useState('');
  const [numberOfInputs, setNumberOfInputs] = useState(12);
  const [discreteAssets, setDiscreteAssets] = useState(Array(12).fill(''));
  const [previewData, setPreviewData] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [qrSize, setQrSize] = useState('medium');

  const handleDiscreteAssetChange = (index, value) => {
    const newAssets = [...discreteAssets];
    newAssets[index] = value;
    setDiscreteAssets(newAssets);
  };

  const handleNumberOfInputsChange = (value) => {
    setNumberOfInputs(value);
    setDiscreteAssets(Array(value).fill(''));
  };

  const calculateSheets = async () => {
    try {
      if (mode === 'range') {
        if (!startAsset || !endAsset) {
          alert('Please enter both start and end asset numbers');
          return;
        }

        console.log('Sending request:', { collection, startAsset, endAsset });
        const response = await fetch(`/api/assets/range`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collection,
            startAsset,
            endAsset,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received response:', data);

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.assets || !Array.isArray(data.assets)) {
          throw new Error('Invalid response format');
        }

        setPreviewData({
          totalAssets: data.assets.length,
          sheetsRequired: Math.ceil(data.assets.length / QR_SIZES[qrSize].perPage),
          assets: data.assets,
        });
      } else {
        const filledAssets = discreteAssets.filter(asset => asset.trim() !== '');
        if (filledAssets.length === 0) {
          alert('Please enter at least one asset number');
          return;
        }

        const assets = filledAssets.map(assetnumber => ({ assetnumber }));
        setPreviewData({
          totalAssets: assets.length,
          sheetsRequired: Math.ceil(assets.length / QR_SIZES[qrSize].perPage),
          assets: assets,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error calculating sheets: ' + error.message);
    }
  };

  const generateQRCodes = () => {
    setQrCodes(previewData.assets);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Form Section - Hidden in Print */}
      <Box sx={{ '@media print': { display: 'none' } }}>
        <Typography variant="h5" gutterBottom>
          Generate QR Codes for Assets
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Collection</InputLabel>
            <Select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              label="Collection"
            >
              <MenuItem value="equipmentandtools">Equipment and Tools</MenuItem>
              <MenuItem value="fixedassets">Fixed Assets</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Input Mode</InputLabel>
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              label="Input Mode"
            >
              <MenuItem value="range">Asset Range</MenuItem>
              <MenuItem value="discrete">Individual Assets</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>QR Code Size</InputLabel>
            <Select
              value={qrSize}
              onChange={(e) => setQrSize(e.target.value)}
              label="QR Code Size"
            >
              <MenuItem value="small">Small (6 per row)</MenuItem>
              <MenuItem value="medium">Medium (3 per row)</MenuItem>
              <MenuItem value="large">Large (2 per row)</MenuItem>
            </Select>
          </FormControl>

          {mode === 'range' ? (
            <>
              <TextField
                label="Start Asset Number"
                value={startAsset}
                onChange={(e) => setStartAsset(e.target.value)}
              />
              <TextField
                label="End Asset Number"
                value={endAsset}
                onChange={(e) => setEndAsset(e.target.value)}
              />
            </>
          ) : (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Number of Inputs</InputLabel>
              <Select
                value={numberOfInputs}
                onChange={(e) => handleNumberOfInputsChange(e.target.value)}
                label="Number of Inputs"
              >
                <MenuItem value={12}>12 Assets</MenuItem>
                <MenuItem value={24}>24 Assets</MenuItem>
                <MenuItem value={36}>36 Assets</MenuItem>
              </Select>
            </FormControl>
          )}

          <Button variant="contained" onClick={calculateSheets}>
            Calculate Sheets
          </Button>
        </Box>

        {mode === 'discrete' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
            {discreteAssets.map((asset, index) => (
              <TextField
                key={index}
                label={`Asset ${index + 1}`}
                value={asset}
                onChange={(e) => handleDiscreteAssetChange(index, e.target.value)}
                size="small"
              />
            ))}
          </Box>
        )}

        {previewData && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography>Total Assets: {previewData.totalAssets}</Typography>
            <Typography>Sheets Required: {previewData.sheetsRequired}</Typography>
            <Button variant="contained" onClick={generateQRCodes} sx={{ mt: 2 }}>
              Generate QR Codes
            </Button>
          </Paper>
        )}

        {qrCodes.length > 0 && (
          <Button variant="contained" onClick={handlePrint} sx={{ mb: 2 }}>
            Print QR Codes
          </Button>
        )}
      </Box>

      {/* QR Codes Section - Visible in Print */}
      {qrCodes.length > 0 && (
        <Box className="qr-sheets" sx={{ 
          pageBreakInside: 'avoid',
          '@media print': {
            margin: 0,
            padding: 0,
            backgroundColor: 'white'
          }
        }}>
          {Array.from({ length: Math.ceil(qrCodes.length / QR_SIZES[qrSize].perPage) }).map((_, sheetIndex) => (
            <Box
              key={sheetIndex}
              className="qr-sheet"
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${QR_SIZES[qrSize].gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${QR_SIZES[qrSize].gridRows}, 1fr)`,
                gap: QR_SIZES[qrSize].gap,
                p: QR_SIZES[qrSize].padding,
                pageBreakAfter: 'always',
                width: '210mm',
                height: QR_SIZES[qrSize].containerHeight,
                margin: '0 auto',
                backgroundColor: 'white',
                '@media print': {
                  margin: 0,
                  padding: QR_SIZES[qrSize].padding,
                  width: '210mm',
                  height: QR_SIZES[qrSize].containerHeight,
                  pageBreakAfter: 'always',
                  pageBreakInside: 'avoid',
                  backgroundColor: 'white',
                  minHeight: '297mm'
                }
              }}
            >
              {qrCodes.slice(sheetIndex * QR_SIZES[qrSize].perPage, (sheetIndex + 1) * QR_SIZES[qrSize].perPage).map((asset) => (
                <Box
                  key={asset.assetnumber}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: '2px',
                    height: '100%',
                    '@media print': {
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                      minHeight: `${QR_SIZES[qrSize].qrSize + 30}px`
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ 
                    mb: qrSize === 'small' ? 0.5 : 1,
                    fontSize: QR_SIZES[qrSize].fontSize,
                    fontWeight: 'bold',
                    '@media print': {
                      margin: qrSize === 'small' ? '2px 0' : '4px 0'
                    }
                  }}>
                    {asset.assetnumber}
                  </Typography>
                  <QRCodeSVG 
                    value={`https://assettags.vercel.app/${collection === 'fixedassets' ? 'fixedasset' : 'asset'}/${asset.assetnumber}`}
                    size={QR_SIZES[qrSize].qrSize}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="H"
                    imageSettings={{
                      src: '/images/logo.jpg',
                      x: undefined,
                      y: undefined,
                      height: qrSize === 'small' ? QR_SIZES[qrSize].qrSize * 0.2 :
                             qrSize === 'medium' ? QR_SIZES[qrSize].qrSize * 0.3 :
                             QR_SIZES[qrSize].qrSize * 0.4,
                      width: qrSize === 'small' ? QR_SIZES[qrSize].qrSize * 0.2 :
                             qrSize === 'medium' ? QR_SIZES[qrSize].qrSize * 0.3 :
                             QR_SIZES[qrSize].qrSize * 0.4,
                    }}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: white;
            min-height: 297mm;
          }
          .qr-sheets {
            margin: 0;
            padding: 0;
            background-color: white;
          }
          .qr-sheet {
            break-inside: avoid;
            page-break-inside: avoid;
            page-break-after: always;
            background-color: white;
            min-height: 297mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default QRCodePrint;