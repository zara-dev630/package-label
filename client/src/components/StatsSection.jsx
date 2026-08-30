import React from 'react';

const stats = [
  { label: 'Overall Detection Accuracy (mAP50)', value: '98.7%' },
  { label: 'Precision', value: '96.9%' },
  { label: 'Recall', value: '97.9%' }
];

const perClassStats = [
  { label: 'BB', value: '98.7%' },
  { label: 'Batch', value: '99.2%' },
  { label: 'MFG', value: '98.7%' },
  { label: 'RS', value: '98.2%' },
  { label: 'TimeStamp', value: '98.5%' }
];

export default function StatsSection() {
  return (
    <section className="bg-surface py-16 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Model Performance</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Validated on real-world test images with consistent detection across all label types.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-background rounded-xl p-6 text-center border border-gray-800 shadow-lg">
              <div className="text-4xl font-extrabold text-accent-500 mb-2">{stat.value}</div>
              <div className="text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-background rounded-xl p-8 border border-gray-800 shadow-lg max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-6 text-center">Per-Class Accuracy</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {perClassStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface border-2 border-accent-500 flex items-center justify-center mb-3">
                  <span className="font-bold text-accent-400">{stat.value}</span>
                </div>
                <span className="text-sm font-semibold text-gray-300">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
