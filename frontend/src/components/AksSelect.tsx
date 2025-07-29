import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { MagnifyingGlassIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface AksCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  level: number;
  is_category: boolean;
}

interface AksSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const AksSelect: React.FC<AksSelectProps> = ({
  value,
  onChange,
  required = false,
  placeholder = "AKS-Code auswählen...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all AKS codes using the tree endpoint
  const { data: aksTreeResponse, isLoading } = useQuery<any>(
    ['aks-tree-all'],
    async () => {
      const response = await api.get('/aks/tree');
      return response.data;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Extract the tree data from the response
  const aksTree = React.useMemo(() => {
    if (!aksTreeResponse) return [];
    // If response has a data property, use it, otherwise use the response directly
    return aksTreeResponse.data || aksTreeResponse;
  }, [aksTreeResponse]);

  // Flatten the tree structure to get all AKS codes
  const flattenTree = (nodes: any[], result: AksCode[] = []): AksCode[] => {
    if (!Array.isArray(nodes)) return result;
    
    nodes.forEach(node => {
      result.push({
        id: node.id,
        code: node.code,
        name: node.name,
        description: node.description,
        level: node.level,
        is_category: node.is_category
      });
      if (node.children && node.children.length > 0) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };

  const aksCodes = useMemo(() => {
    const treeArray = Array.isArray(aksTree) ? aksTree : [];
    return flattenTree(treeArray);
  }, [aksTree]);

  // Filter AKS codes based on search term
  const filteredCodes = aksCodes.filter(aks => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      aks.code.toLowerCase().includes(searchLower) ||
      aks.name.toLowerCase().includes(searchLower) ||
      (aks.description && aks.description.toLowerCase().includes(searchLower))
    );
  });

  // Find selected AKS code
  const selectedAks = aksCodes.find(aks => aks.code === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (aksCode: string) => {
    onChange(aksCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
          selectedAks ? 'text-gray-900' : 'text-gray-500'
        } bg-white border-gray-300`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 truncate">
            {selectedAks ? (
              <span>
                <span className="font-mono text-sm">{selectedAks.code}</span>
                <span className="ml-2 text-gray-600">{selectedAks.name}</span>
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {/* Search input */}
          <div className="sticky top-0 bg-white px-3 py-2 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suche nach Code oder Name..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-3 text-gray-500">Lade AKS-Codes...</div>
            ) : filteredCodes.length === 0 ? (
              <div className="text-center py-3 text-gray-500">Keine AKS-Codes gefunden</div>
            ) : (
              filteredCodes.map((aks) => (
                <button
                  key={aks.id}
                  type="button"
                  onClick={() => handleSelect(aks.code)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between ${
                    aks.code === value ? 'bg-indigo-50' : ''
                  }`}
                  disabled={aks.is_category}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`font-mono text-sm ${aks.is_category ? 'text-gray-400' : 'text-gray-900'}`}>
                        {aks.code}
                      </span>
                      {aks.level > 1 && (
                        <span className="ml-2 text-xs text-gray-400">
                          {'  '.repeat(aks.level - 1)}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${aks.is_category ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                      {aks.name}
                      {aks.is_category && ' (Kategorie)'}
                    </div>
                  </div>
                  {aks.code === value && (
                    <CheckIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AksSelect;