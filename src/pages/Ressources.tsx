import React from 'react';
import { Tabs, Card } from 'antd';
import { BookOpen, FileText } from 'lucide-react';

import AcademicResources from "./AcademicResources.tsx"
import ResourceLibrary from "./ResourceLibrary.tsx"

const { TabPane } = Tabs;

/**
 * Page principale pour les ressources académiques et procédurales.
 * Permet d'accéder aux cours, TD, TP ainsi qu'aux documents administratifs.
 */
const Ressources: React.FC = () => {

  return (
    <div className="data-quality-container p-6">
      <Card
        title={
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
            <span className="text-2xl font-bold">Ressources Académiques et Procédurales</span>
          </div>
        }
        className="shadow-lg rounded-lg"
      >
        <Tabs
          defaultActiveKey="academic"
          type="card"
          tabPosition="top"
          size="large"
          className="custom-tabs"
        >
          <TabPane 
            tab={
              <div className="flex items-center space-x-2 px-4 py-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-base">📚 Ressources Académiques</span>
              </div>
            } 
            key="academic"
          >
            <AcademicResources />
          </TabPane>
          <TabPane 
            tab={
              <div className="flex items-center space-x-2 px-4 py-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-base">📋 Ressources Procédurales</span>
              </div>
            } 
            key="procedural"
          >
            <ResourceLibrary />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Ressources;
