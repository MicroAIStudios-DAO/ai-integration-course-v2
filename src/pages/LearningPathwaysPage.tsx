import React from 'react';
import MarkdownPage from '../components/MarkdownPage';

const LearningPathwaysPage: React.FC = () => (
  <div className="max-w-3xl mx-auto p-6 space-y-6">
    <h1 className="text-3xl font-bold">Learning Pathways</h1>
    <MarkdownPage src="/md/smart_learning_pathways_design.md" />
  </div>
);

export default LearningPathwaysPage;
