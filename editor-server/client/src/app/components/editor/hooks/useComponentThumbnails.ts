import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Component } from '../../../../shared/types/component';
import { componentLibraryManager } from '../../../services/ComponentLibraryManager';
import { generateThumbnailBatch } from '../../../../lib/components/thumbnail-generator';

interface UseComponentThumbnailsParams {
  libraryId: string | null | undefined;
  components: Component[];
}

interface UseComponentThumbnailsReturn {
  thumbnails: Map<string, string>;
  parseErrors: Map<string, string>;
  isLoading: boolean;
  loadingProgress: { current: number; total: number } | null;
  refresh: () => void;
}

export function useComponentThumbnails({ libraryId, components }: UseComponentThumbnailsParams): UseComponentThumbnailsReturn {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [parseErrors, setParseErrors] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);

  const generationRef = useRef(0);
  const componentsRef = useRef(components);
  componentsRef.current = components;
  const libraryIdRef = useRef(libraryId);
  libraryIdRef.current = libraryId;

  const componentIdsKey = useMemo(
    () => components.map(c => c.internalId).join(','),
    [components]
  );

  const generateThumbnails = useCallback(async (targetLibraryId: string, targetComponents: Component[], generation: number) => {
    const batchItems = targetComponents.map(c => ({ internalId: c.internalId, code: c.code }));

    try {
      const results = await generateThumbnailBatch(batchItems, (completed, total, componentInternalId, success) => {
        if (generationRef.current !== generation) return;
        setLoadingProgress({ current: completed, total });

        if (!success) {
          const component = targetComponents.find(c => c.internalId === componentInternalId);
          if (component) {
            setParseErrors(prev => new Map(prev).set(componentInternalId, component.name));
          }
        }
      }, 120, 80);

      if (generationRef.current !== generation) return;

      const successfulThumbnails = new Map<string, string>();
      results.forEach((thumbnail, componentId) => {
        if (!thumbnail.includes('&#10060;')) {
          successfulThumbnails.set(componentId, thumbnail);
        }
      });

      componentLibraryManager.setThumbnailCache(targetLibraryId, successfulThumbnails);
      setThumbnails(results);
    } catch (error) {
      if (generationRef.current !== generation) return;
      console.error('Failed to generate thumbnails:', error);
    } finally {
      if (generationRef.current === generation) {
        setIsLoading(false);
        setLoadingProgress(null);
      }
    }
  }, []);

  useEffect(() => {
    const currentGeneration = ++generationRef.current;

    if (!libraryId) {
      setThumbnails(new Map());
      setParseErrors(new Map());
      return;
    }

    const currentComponents = componentsRef.current;
    const cachedThumbnails = componentLibraryManager.getThumbnailCache(libraryId);
    const hasAllThumbnails = currentComponents.every(c => cachedThumbnails.has(c.internalId));

    if (cachedThumbnails.size > 0 && hasAllThumbnails) {
      setThumbnails(cachedThumbnails);
      setParseErrors(new Map());
      return;
    }

    setIsLoading(true);
    setLoadingProgress({ current: 0, total: currentComponents.length });
    generateThumbnails(libraryId, currentComponents, currentGeneration);
  }, [libraryId, componentIdsKey, generateThumbnails]);

  const refresh = useCallback(() => {
    const currentLibraryId = libraryIdRef.current;
    const currentComponents = componentsRef.current;
    if (!currentLibraryId) return;

    const currentGeneration = ++generationRef.current;
    setThumbnails(new Map());
    setParseErrors(new Map());
    componentLibraryManager.setThumbnailCache(currentLibraryId, new Map());
    setIsLoading(true);
    setLoadingProgress({ current: 0, total: currentComponents.length });
    setTimeout(() => {
      generateThumbnails(currentLibraryId, currentComponents, currentGeneration);
    }, 100);
  }, [generateThumbnails]);

  return {
    thumbnails,
    parseErrors,
    isLoading,
    loadingProgress,
    refresh,
  };
}
