import React, { useState } from 'react';
import Hero3D from './components/Hero3D';
import UploadSection from './components/UploadSection';
import ResultsView from './components/ResultsView';
import StatsSection from './components/StatsSection';

function App() {
  const [file, setFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [detections, setDetections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (selectedFile) => {
    setFile(selectedFile);
    setImagePreviewUrl(URL.createObjectURL(selectedFile));
    setLoading(true);
    setError(null);
    setDetections(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image on the server.');
      }

      const data = await response.json();
      if (data.success) {
        setDetections(data.detections);
      } else {
        throw new Error(data.error || 'Unknown error occurred.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImagePreviewUrl(null);
    setDetections(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans">
      <header className="fixed top-0 w-full z-50 bg-background border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-accent-500 to-accent-600 bg-clip-text text-transparent">
            PackLabel Detector
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {!file && (
          <section className="relative min-h-[80vh] flex items-center justify-center overflow-visible py-8">
            <div className="absolute inset-0 z-0 opacity-40">
              <Hero3D />
            </div>
            <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-8">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight py-2 leading-normal">
                AI-Powered <span className="text-accent-500">Package Label</span> Detection
              </h1>
              <p className="text-xl text-gray-400">
                Instantly extract and identify Batch numbers, MFG dates, RS codes, TimeStamps, and BB fields with state-of-the-art YOLOv8 vision.
              </p>
              
              <div className="pt-8">
                <UploadSection onUpload={handleFileUpload} loading={loading} />
              </div>
              
              {error && (
                <div className="text-red-500 font-medium mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}
            </div>
          </section>
        )}

        {file && imagePreviewUrl && (
          <section className="container mx-auto px-4 py-12">
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-3xl font-bold">Analysis Results</h2>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg font-medium"
              >
                Scan Another Image
              </button>
            </div>
            
            <ResultsView 
              imageUrl={imagePreviewUrl} 
              detections={detections} 
              loading={loading} 
            />
          </section>
        )}

        <StatsSection />
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-gray-500">
        <p>© 2026 Zara. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
