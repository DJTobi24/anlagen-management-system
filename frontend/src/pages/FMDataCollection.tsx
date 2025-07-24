import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import fmDataService, { 
  Liegenschaft, 
  Building, 
  AksTreeNode,
  AnlageInFM 
} from '../services/fmDataService';

const FMDataCollection: React.FC = () => {
  const [expandedLiegenschaften, setExpandedLiegenschaften] = useState<Set<string>>(new Set());
  const [expandedAksNodes, setExpandedAksNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<{
    liegenschaft?: Liegenschaft;
    building?: Building;
    aksNode?: AksTreeNode;
  }>({});

  // Fetch Liegenschaften
  const { data: liegenschaften = [], isLoading: isLoadingLiegenschaften } = useQuery(
    ['liegenschaften-fm'],
    () => fmDataService.getLiegenschaften(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch Buildings for selected Liegenschaft
  const { data: buildings = [] } = useQuery(
    ['buildings-fm', selectedPath.liegenschaft?.id],
    () => selectedPath.liegenschaft ? fmDataService.getBuildings(selectedPath.liegenschaft.id) : Promise.resolve([]),
    {
      enabled: !!selectedPath.liegenschaft,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch AKS tree for selected building
  const { data: aksTree = [], isLoading: isLoadingAksTree } = useQuery(
    ['aks-tree-fm', selectedPath.building?.id],
    () => selectedPath.building ? fmDataService.getAksTreeForBuilding(selectedPath.building.id) : Promise.resolve([]),
    {
      enabled: !!selectedPath.building,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch Anlagen for selected AKS code
  const { data: anlagen = [] } = useQuery(
    ['anlagen-fm', selectedPath.building?.id, selectedPath.aksNode?.code],
    () => selectedPath.building && selectedPath.aksNode ? 
      fmDataService.getAnlagenForAks(selectedPath.building.id, selectedPath.aksNode.code) : 
      Promise.resolve([]),
    {
      enabled: !!selectedPath.building && !!selectedPath.aksNode && selectedPath.aksNode.direct_anlage_count > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  const toggleLiegenschaft = (id: string) => {
    const newExpanded = new Set(expandedLiegenschaften);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLiegenschaften(newExpanded);
  };

  const toggleAksNode = (code: string) => {
    const newExpanded = new Set(expandedAksNodes);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedAksNodes(newExpanded);
  };

  const selectLiegenschaft = (liegenschaft: Liegenschaft) => {
    setSelectedPath({ liegenschaft });
    if (!expandedLiegenschaften.has(liegenschaft.id)) {
      toggleLiegenschaft(liegenschaft.id);
    }
  };

  const selectBuilding = (building: Building) => {
    setSelectedPath(prev => ({ ...prev, building, aksNode: undefined }));
  };

  const selectAksNode = (aksNode: AksTreeNode) => {
    if (aksNode.direct_anlage_count > 0) {
      setSelectedPath(prev => ({ ...prev, aksNode }));
    }
  };

  const renderAksNode = (node: AksTreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedAksNodes.has(node.code);
    const isSelected = selectedPath.aksNode?.id === node.id;
    const paddingLeft = depth * 24 + 8;

    const getIcon = () => {
      if (node.direct_anlage_count > 0) {
        return <WrenchScrewdriverIcon className="h-4 w-4 text-indigo-600" />;
      }
      switch (node.level) {
        case 1:
          return <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />;
        case 2:
          return isExpanded ? 
            <FolderOpenIcon className="h-4 w-4 text-amber-500" /> :
            <FolderIcon className="h-4 w-4 text-amber-600" />;
        default:
          return <DocumentTextIcon className="h-4 w-4 text-green-600" />;
      }
    };

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center py-2 px-3 cursor-pointer transition-all duration-150 ease-in-out rounded-lg mx-1 my-0.5 ${
            isSelected 
              ? 'bg-gradient-to-r from-indigo-100 to-indigo-50 border-l-4 border-indigo-500' 
              : 'hover:bg-gray-50 hover:shadow-sm'
          } ${node.direct_anlage_count === 0 && (!node.children || node.children.length === 0) ? 'opacity-60' : ''}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => selectAksNode(node)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
            {node.children && node.children.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAksNode(node.code);
                }}
                className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-colors duration-150"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Node Icon */}
          <div className="mr-3 flex-shrink-0">
            {getIcon()}
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {node.name}
                </div>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {node.code}
                  </span>
                  {node.direct_anlage_count > 0 && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {node.direct_anlage_count} Anlagen
                    </span>
                  )}
                  {node.total_anlage_count > node.direct_anlage_count && (
                    <span className="text-xs text-gray-500">
                      ({node.total_anlage_count} gesamt)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => renderAksNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            FM-Datenaufnahme
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Erfassen Sie Anlagendaten nach der Facility Management Struktur
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedPath.liegenschaft || selectedPath.building || selectedPath.aksNode) && (
        <div className="bg-gray-50 px-4 py-2 rounded-lg">
          <nav className="flex items-center space-x-2 text-sm">
            <ClipboardDocumentListIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Pfad:</span>
            {selectedPath.liegenschaft && (
              <>
                <span className="font-medium text-gray-900">{selectedPath.liegenschaft.name}</span>
                {(selectedPath.building || selectedPath.aksNode) && <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
              </>
            )}
            {selectedPath.building && (
              <>
                <span className="font-medium text-gray-900">{selectedPath.building.name}</span>
                {selectedPath.aksNode && <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
              </>
            )}
            {selectedPath.aksNode && (
              <span className="font-medium text-indigo-600">{selectedPath.aksNode.name}</span>
            )}
          </nav>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liegenschaften */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
              Liegenschaften
            </h3>
          </div>
          {isLoadingLiegenschaften ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Lade Liegenschaften...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {liegenschaften.map(liegenschaft => {
                const isExpanded = expandedLiegenschaften.has(liegenschaft.id);
                const isSelected = selectedPath.liegenschaft?.id === liegenschaft.id;
                const liegenschaftBuildings = buildings.filter(b => 
                  selectedPath.liegenschaft?.id === liegenschaft.id
                );
                
                return (
                  <div key={liegenschaft.id}>
                    <div
                      className={`group flex items-center py-3 px-3 cursor-pointer transition-all duration-150 rounded-lg ${
                        isSelected 
                          ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50 hover:shadow-sm'
                      }`}
                      onClick={() => selectLiegenschaft(liegenschaft)}
                    >
                      {/* Expand/Collapse */}
                      <div className="w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                        {liegenschaft.building_count > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLiegenschaft(liegenschaft.id);
                            }}
                            className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-colors duration-150"
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </div>

                      {/* Icon */}
                      <div className="mr-3 flex-shrink-0">
                        <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {liegenschaft.name}
                        </div>
                        {liegenschaft.building_count > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {liegenschaft.building_count} Gebäude · {liegenschaft.anlage_count} Anlagen
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buildings */}
                    {isExpanded && liegenschaftBuildings.length > 0 && (
                      <div className="ml-8 mt-2 space-y-1">
                        {liegenschaftBuildings.map(building => (
                          <div
                            key={building.id}
                            className={`flex items-center py-2 px-3 cursor-pointer transition-all duration-150 rounded-lg ${
                              selectedPath.building?.id === building.id
                                ? 'bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-500'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => selectBuilding(building)}
                          >
                            <div className="mr-3 flex-shrink-0">
                              <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {building.name}
                              </div>
                              {building.anlage_count > 0 && (
                                <div className="text-xs text-green-600 mt-0.5">
                                  {building.anlage_count} Anlagen
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AKS Hierarchie */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
              AKS-Hierarchie
              {selectedPath.building && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  für {selectedPath.building.name}
                </span>
              )}
            </h3>
          </div>

          {!selectedPath.building ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 font-medium mb-2">Gebäude auswählen</div>
              <p className="text-sm text-gray-500">
                Wählen Sie zuerst eine Liegenschaft und ein Gebäude aus, um die verfügbaren AKS-Codes zu sehen.
              </p>
            </div>
          ) : isLoadingAksTree ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Lade AKS-Struktur...</p>
            </div>
          ) : aksTree.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 font-medium mb-2">Keine Anlagen gefunden</div>
              <p className="text-sm text-gray-500">
                In diesem Gebäude sind noch keine Anlagen erfasst.
              </p>
            </div>
          ) : (
            <div className="h-96 overflow-y-auto bg-white">
              <div className="p-2">
                {aksTree.map(node => renderAksNode(node))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Facility Details */}
      {selectedPath.aksNode && selectedPath.aksNode.direct_anlage_count > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <WrenchScrewdriverIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Anlagen in {selectedPath.aksNode.name}
            </h3>
            <span className="text-sm text-gray-500">
              {selectedPath.aksNode.direct_anlage_count} Anlagen
            </span>
          </div>
          
          {anlagen.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anlagen.map(anlage => (
                <div key={anlage.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{anlage.name}</h4>
                      {anlage.t_nummer && (
                        <p className="text-xs text-gray-500 mt-1">T-Nr: {anlage.t_nummer}</p>
                      )}
                      {anlage.description && (
                        <p className="text-sm text-gray-600 mt-2">{anlage.description}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${anlage.status === 'aktiv' ? 'bg-green-100 text-green-800' :
                          anlage.status === 'wartung' ? 'bg-yellow-100 text-yellow-800' :
                          anlage.status === 'defekt' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {anlage.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Zustand: {anlage.zustands_bewertung}/5</span>
                    {anlage.maintenance_interval_months && (
                      <span>Wartung: alle {anlage.maintenance_interval_months} Monate</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-medium mb-2">Lade Anlagen...</div>
              <p className="text-sm text-blue-700">
                Die Anlagen aus "{selectedPath.aksNode.name}" werden geladen.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FMDataCollection;