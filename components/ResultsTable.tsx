import React, { useState } from 'react';
import { ProcessedRow, KeywordData } from '../types';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

interface ResultsTableProps {
  data: ProcessedRow[];
}

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  let colorClass = 'bg-red-100 text-red-800';
  if (score >= 80) colorClass = 'bg-green-100 text-green-800';
  else if (score >= 50) colorClass = 'bg-yellow-100 text-yellow-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {score}
    </span>
  );
};

const KeywordTable: React.FC<{ keywords: KeywordData[], title: string, colorClass: string }> = ({ keywords, title, colorClass }) => {
  if (!keywords || keywords.length === 0) return null;
  
  return (
    <div className="mt-2">
      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h5>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Keyword</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vol</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {keywords.map((k, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs font-medium text-gray-900 break-words">{k.keyword}</td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
                    {k.searchVolume || 'N/A'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{k.intent || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  if (data.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">#</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Product Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Meta Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keywords</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Expand</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <React.Fragment key={index}>
                <tr className={`hover:bg-gray-50 transition-colors ${expandedRow === index ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={row["Product Name"] || "N/A"}>
                    {row["Product Name"] || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={row.metaTitle}>
                    {row.metaTitle || <span className="italic text-gray-400">Pending...</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {row.primaryKeywords ? row.primaryKeywords.slice(0, 3).map(k => k.keyword).join(', ') + '...' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.seoScore !== undefined ? <ScoreBadge score={row.seoScore} /> : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {row.status === 'processing' && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                    {row.status === 'pending' && <div className="w-2 h-2 bg-gray-300 rounded-full ml-1" />}
                    {row.status === 'error' && (
                      <span title={row.errorMessage}>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => toggleRow(index)}
                      className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                    >
                      {expandedRow === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
                {expandedRow === index && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-gray-700">
                        <div className="col-span-1 space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-1">Core Metadata</h4>
                            <div className="space-y-3">
                              <p><span className="font-medium text-gray-600 block text-xs uppercase mb-0.5">Meta Title</span> {row.metaTitle}</p>
                              <p><span className="font-medium text-gray-600 block text-xs uppercase mb-0.5">Meta Desc</span> {row.metaDescription}</p>
                              <p><span className="font-medium text-gray-600 block text-xs uppercase mb-0.5">URL Slug</span> <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">{row.urlSlug}</code></p>
                              <p><span className="font-medium text-gray-600 block text-xs uppercase mb-0.5">H1 Title</span> {row.h1Title}</p>
                              {row.buyerPersona && (
                                <div className="bg-green-50 p-2 rounded border border-green-200 mt-2">
                                   <span className="font-medium text-green-800 block text-xs uppercase mb-0.5">Target Buyer Persona</span>
                                   <p className="text-green-900 italic">{row.buyerPersona}</p>
                                </div>
                              )}
                            </div>
                        </div>
                        <div className="col-span-1 space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-1">Content Strategy</h4>
                            <div className="space-y-4">
                              <KeywordTable 
                                keywords={row.primaryKeywords} 
                                title="Primary Keywords" 
                                colorClass="bg-blue-100 text-blue-800" 
                              />
                              <KeywordTable 
                                keywords={row.buyingIntentKeywords} 
                                title="Buying Intent (Transactional)" 
                                colorClass="bg-emerald-100 text-emerald-800" 
                              />
                              <KeywordTable 
                                keywords={row.longTailKeywords} 
                                title="Long-Tail Keywords" 
                                colorClass="bg-purple-100 text-purple-800" 
                              />
                            </div>
                        </div>
                        <div className="col-span-1 space-y-4">
                             <h4 className="font-semibold text-gray-900 border-b pb-1">Optimization & Analysis</h4>
                             <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                <span className="font-bold text-yellow-800 text-xs uppercase block mb-1">Improvement Tips</span>
                                <p className="text-yellow-900">{row.improvementTips}</p>
                             </div>
                             <div>
                                <span className="font-medium text-gray-600 text-xs uppercase block mb-2">Heading Suggestions</span>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs">
                                    {row.headingsSuggestions?.map((h, i) => <li key={i}>{h}</li>)}
                                </ul>
                             </div>
                             <p className="pt-2"><span className="font-medium text-gray-600 text-xs uppercase">Image Alt:</span> <br/>{row.imageAltText}</p>
                        </div>
                        <div className="col-span-1 md:col-span-3 space-y-2 mt-2 pt-4 border-t border-gray-200">
                             <h4 className="font-semibold text-gray-900">Long Description</h4>
                             <p className="text-gray-600 leading-relaxed bg-white p-4 rounded border border-gray-200 text-sm shadow-sm">{row.longSeoDescription}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};