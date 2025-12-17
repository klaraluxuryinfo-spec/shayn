import React, { useState, useEffect } from 'react';
import { Bot, Download, RefreshCcw, LayoutDashboard, Database, ShoppingBag, Share2 } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ResultsTable } from './components/ResultsTable';
import { readExcelFile, exportToExcel, exportToShopifyCSV } from './services/excelService';
import { generateSeoForBatch } from './services/geminiService';
import { downloadN8nTemplate } from './services/workflowService';
import { ProcessedRow, ProcessingState, ProductInput } from './types';

function App() {
  const [data, setData] = useState<ProcessedRow[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Reset state
  const handleReset = () => {
    setData([]);
    setProcessingState(ProcessingState.IDLE);
    setProgress({ current: 0, total: 0 });
  };

  const processRows = async (rows: ProductInput[]) => {
    setProcessingState(ProcessingState.PROCESSING);
    setProgress({ current: 0, total: rows.length });

    const initialData: ProcessedRow[] = rows.map(r => ({ ...r, status: 'pending' } as ProcessedRow));
    setData(initialData);

    const updatedData = [...initialData];
    let consecutiveErrors = 0;
    
    // BATCH PROCESSING CONFIGURATION
    // 3 items per request is a safe sweet spot for Gemini Flash 
    const BATCH_SIZE = 3;

    // Iterate through the rows in chunks (batches)
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        // Get the current batch of items
        const batchEndIndex = Math.min(i + BATCH_SIZE, rows.length);
        const batch = rows.slice(i, batchEndIndex);
        
        // Update status to processing for all items in this batch
        for (let j = i; j < batchEndIndex; j++) {
            updatedData[j] = { ...updatedData[j], status: 'processing' };
        }
        setData([...updatedData]);

        try {
            // Send the entire batch to the API
            const batchResults = await generateSeoForBatch(batch);
            
            // Map results back to the specific rows
            batchResults.forEach((result, index) => {
                const globalIndex = i + index;
                if (globalIndex < updatedData.length) {
                    updatedData[globalIndex] = { 
                        ...updatedData[globalIndex], 
                        ...result, 
                        status: 'completed' 
                    };
                }
            });
            consecutiveErrors = 0; 
        } catch (error) {
            console.error(`Error processing batch starting at ${i}:`, error);
            
            const errString = error instanceof Error ? error.message : String(error);
            const errLower = errString.toLowerCase();

            // Detect Quota error using the specific flag we throw or generic keywords
            const isQuota = errString === 'GEMINI_QUOTA_EXCEEDED' || 
                            errLower.includes('quota') || 
                            errLower.includes('429');
            
            const displayMessage = isQuota 
                ? "Quota exceeded. You should use the free ChatGPT API instead." 
                : errString;

            // Mark all items in this batch as error
            for (let j = i; j < batchEndIndex; j++) {
                updatedData[j] = { 
                    ...updatedData[j], 
                    status: 'error', 
                    errorMessage: displayMessage
                };
            }
            
            // Update UI immediately with the errors
            setData([...updatedData]);

            // STOP IMMEDIATELY IF QUOTA EXCEEDED
            if (isQuota) {
                setProcessingState(ProcessingState.ERROR);
                alert("Gemini quota exceeded. Since the Gemini quota is over, you should use the free ChatGPT API instead.");
                return; // Break out of the function completely, stopping the loop
            }
            
            consecutiveErrors++;
        }

        // Update progress and state
        setProgress({ current: batchEndIndex, total: rows.length });

        if (consecutiveErrors >= 3) {
            setProcessingState(ProcessingState.ERROR);
            alert("Processing paused due to multiple errors.");
            return; 
        }

        // Wait time between batches. 
        if (batchEndIndex < rows.length) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    setProcessingState(ProcessingState.COMPLETED);
  };

  const handleFileSelect = async (file: File) => {
    try {
      const jsonData = await readExcelFile(file);
      if (jsonData.length === 0) {
        alert("The uploaded Excel file is empty.");
        return;
      }
      processRows(jsonData);
    } catch (error) {
      console.error("File Read Error:", error);
      alert("Failed to read the Excel file.");
    }
  };

  const handleExport = () => {
    if (data.length === 0) return;
    exportToExcel(data, `seo-generated-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleShopifyExport = () => {
    if (data.length === 0) return;
    exportToShopifyCSV(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">AutoSEO Gen</h1>
                <p className="text-xs text-gray-500 font-medium">AI-Powered Metadata Automation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               {processingState === ProcessingState.COMPLETED && (
                <>
                  <button 
                    onClick={handleShopifyExport}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#96bf48] hover:bg-[#85ab3d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#96bf48] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Shopify CSV
                  </button>
                  <button 
                    onClick={handleExport}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </button>
                </>
              )}
              
              <button 
                onClick={downloadN8nTemplate}
                title="Download n8n Workflow Template"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 focus:outline-none transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                n8n Template
              </button>

              {data.length > 0 && (
                <button 
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  New Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* State: IDLE - Upload Area */}
        {processingState === ProcessingState.IDLE && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Generate SEO Metadata in Seconds</h2>
              <p className="mt-4 text-lg text-gray-600">
                Upload your product catalog Excel file. Our AI will generate optimized titles, descriptions, keywords, and scores for every item.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
               <FileUpload onFileSelect={handleFileSelect} isLoading={false} />
               
               <div className="mt-6">
                 <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Supported Columns</h4>
                 <div className="flex flex-wrap gap-2">
                    {['Product Name', 'Description', 'Category', 'Brand', 'Features'].map((col) => (
                      <span key={col} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {col}
                      </span>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* State: PROCESSING or COMPLETED - Dashboard */}
        {(processingState === ProcessingState.PROCESSING || processingState === ProcessingState.COMPLETED || processingState === ProcessingState.ERROR) && (
          <div className="space-y-6">
            
            {/* Stats / Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${processingState === ProcessingState.COMPLETED ? 'bg-green-100 text-green-600' : (processingState === ProcessingState.ERROR ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600')}`}>
                        {processingState === ProcessingState.COMPLETED ? <Database className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {processingState === ProcessingState.COMPLETED ? 'Generation Complete' : (processingState === ProcessingState.ERROR ? 'Processing Stopped' : 'Processing Catalog')}
                    </h2>
                 </div>
                 <span className="text-sm font-medium text-gray-600">
                    {progress.current} of {progress.total} items
                 </span>
               </div>
               
               {/* Progress Bar */}
               <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                 <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${processingState === ProcessingState.COMPLETED ? 'bg-green-500' : (processingState === ProcessingState.ERROR ? 'bg-red-500' : 'bg-indigo-600')}`} 
                    style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
                 ></div>
               </div>
            </div>

            {/* Results Table */}
            <ResultsTable data={data} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;