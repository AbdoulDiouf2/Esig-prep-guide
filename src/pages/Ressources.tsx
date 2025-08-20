import React from 'react';
import { Tabs, Card } from 'antd';

import AcademicResources from "./AcademicResources.tsx"
import ResourceLibrary from "./ResourceLibrary.tsx"

const { TabPane } = Tabs;

/**
 * Page principale pour la visualisation et la gestion de la qualité des données.
 * Regroupe les métriques d'exhaustivité, les logs ElasticSearch et les checks météo.
 */
const Ressources: React.FC = () => {

  return (
    <div className="data-quality-container p-6">
      <Card
        title="Ressources Académiques et Procédurales"
        className="shadow-lg rounded-lg"
      >
        <Tabs
          defaultActiveKey="academic"
          type="card"
          tabPosition="top"
        >
          <TabPane tab={<span>Ressources Académiques</span>} key="academic">
            <AcademicResources />
          </TabPane>
          <TabPane tab={<span>Ressources Procédurales</span>} key="procedural">
            <ResourceLibrary />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Ressources;
