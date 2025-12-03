import React from 'react';
import { LightbulbIcon, LoaderIcon } from './icons';

interface AIInsightsProps {
  insights: string[];
  isLoading: boolean;
  onInsightClick: (insight: string) => void;
}

export default function AIInsights({ insights, isLoading, onInsightClick }: AIInsightsProps) {
  if (isLoading && insights.length === 0) {
      return (
        <div className="mb-4 p-4 bg-shark/50 rounded-lg border border-gray-700 animate-fade-in">
          <div className="flex items-center space-x-2 mb-3">
            <LightbulbIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-loblolly">AI Insights</h3>
          </div>
          <div className="flex items-center space-x-2 text-nevada text-sm">
            <LoaderIcon className="w-4 h-4 animate-spin" />
            <span>Generating smart prompts...</span>
          </div>
        </div>
      );
  }

  if (!isLoading && insights.length === 0) {
    return null; // Don't show the component if there are no insights to display
  }

  return (
    <div className="mb-4 p-4 bg-shark/50 rounded-lg border border-gray-700 animate-fade-in">
      <div className="flex items-center space-x-2 mb-3">
        <LightbulbIcon className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-loblolly">AI Insights</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {insights.map((insight, index) => (
          <button
            key={index}
            onClick={() => onInsightClick(insight)}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-bunker border border-gray-600 text-loblolly hover:bg-science-blue hover:text-white hover:border-science-blue transition-all duration-200"
          >
            "{insight}"
          </button>
        ))}
      </div>
    </div>
  );
}