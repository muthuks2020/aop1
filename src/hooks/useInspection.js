/**
 * useInspection Hook
 * Manages inspection state, readings, and validation
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  getInspectionById, 
  saveDraftReadings, 
  submitInspection,
  validateReading,
  calculateCheckpointResult,
} from '../api/inspectionService';
import { debounce, deepClone, checkReadingsComplete } from '../utils/helpers';

/**
 * Initialize empty readings structure
 * @param {Array} checkpoints - Checkpoint configurations
 * @param {number} sampleSize - Number of samples
 * @returns {Object} Empty readings object
 */
const initializeReadings = (checkpoints, sampleSize) => {
  const readings = {};
  
  checkpoints.forEach((checkpoint) => {
    readings[checkpoint.id] = {
      checkpointId: checkpoint.id,
      readings: {},
      result: 'Pending',
    };
    
    // Initialize sample slots
    for (let i = 1; i <= sampleSize; i++) {
      readings[checkpoint.id].readings[i] = {
        sampleNumber: i,
        value: null,
        status: null,
        timestamp: null,
      };
    }
  });
  
  return readings;
};

/**
 * Custom hook for managing inspection state
 * @param {string} inspectionId - The inspection ID
 * @returns {Object} Inspection state and actions
 */
export const useInspection = (inspectionId) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [inspectionForm, setInspectionForm] = useState(null);
  const [readings, setReadings] = useState({});
  const [remarks, setRemarks] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Load inspection data
  useEffect(() => {
    const loadInspection = async () => {
      if (!inspectionId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getInspectionById(inspectionId);
        
        setBatchInfo({
          id: data.id,
          irNumber: data.irNumber,
          irDate: data.irDate,
          poNumber: data.poNumber,
          poDate: data.poDate,
          grnNumber: data.grnNumber,
          grnDate: data.grnDate,
          vendorDcNo: data.vendorDcNo,
          vendorDcDate: data.vendorDcDate,
          partCode: data.partCode,
          partName: data.partName,
          vendor: data.vendor,
          prProcessCode: data.prProcessCode,
          lotSize: data.lotSize,
          sampleSize: data.sampleSize,
          samplingPlanNo: data.samplingPlanNo,
          qualityPlanNo: data.qualityPlanNo,
          batchNo: data.batchNo,
          documentRef: data.documentRef,
          inspectionType: data.inspectionType,
          status: data.status,
        });
        
        setInspectionForm(data.inspectionForm);
        
        // Initialize or restore readings
        if (data.savedReadings?.checkpoints) {
          // Merge saved readings with form structure
          const formCheckpoints = data.inspectionForm?.checkpoints || [];
          const initialReadings = initializeReadings(formCheckpoints, data.sampleSize);
          
          // Restore saved values
          Object.entries(data.savedReadings.checkpoints).forEach(([checkpointId, savedData]) => {
            if (initialReadings[checkpointId]) {
              initialReadings[checkpointId] = {
                ...initialReadings[checkpointId],
                ...savedData,
              };
            }
          });
          
          setReadings(initialReadings);
          setRemarks(data.savedReadings.remarks || '');
          setLastSaved(data.savedReadings.lastSaved);
        } else if (data.inspectionForm?.checkpoints) {
          // Initialize fresh readings
          setReadings(initializeReadings(data.inspectionForm.checkpoints, data.sampleSize));
        }
      } catch (err) {
        console.error('Error loading inspection:', err);
        setError(err.message || 'Failed to load inspection data');
      } finally {
        setLoading(false);
      }
    };
    
    loadInspection();
  }, [inspectionId]);

  // Update a reading value
  const updateReading = useCallback((checkpointId, sampleNumber, value) => {
    setReadings((prev) => {
      const newReadings = deepClone(prev);
      const checkpoint = inspectionForm?.checkpoints.find(c => c.id === checkpointId);
      
      if (!checkpoint || !newReadings[checkpointId]) return prev;
      
      // Validate the reading
      const validation = validateReading(value, checkpoint);
      
      // Update the specific reading
      newReadings[checkpointId].readings[sampleNumber] = {
        sampleNumber,
        value,
        status: validation.status,
        timestamp: new Date().toISOString(),
      };
      
      // Recalculate checkpoint result
      newReadings[checkpointId].result = calculateCheckpointResult(
        newReadings[checkpointId].readings,
        checkpoint
      );
      
      return newReadings;
    });
    
    setIsDirty(true);
  }, [inspectionForm]);

  // Update visual check value (OK/NG)
  const updateVisualCheck = useCallback((checkpointId, sampleNumber, value) => {
    setReadings((prev) => {
      const newReadings = deepClone(prev);
      
      if (!newReadings[checkpointId]) return prev;
      
      newReadings[checkpointId].readings[sampleNumber] = {
        sampleNumber,
        value,
        status: value === 'OK' ? 'pass' : 'fail',
        timestamp: new Date().toISOString(),
      };
      
      // Calculate result for visual checks
      const allReadings = Object.values(newReadings[checkpointId].readings);
      const hasNG = allReadings.some(r => r.value === 'NG');
      newReadings[checkpointId].result = hasNG ? 'Rejected' : 'Accepted';
      
      return newReadings;
    });
    
    setIsDirty(true);
  }, []);

  // Update remarks
  const updateRemarks = useCallback((value) => {
    setRemarks(value);
    setIsDirty(true);
  }, []);

  // Auto-save with debounce
  const autoSave = useMemo(
    () => debounce(async (readingsData, remarksData) => {
      if (!inspectionId) return;
      
      setIsSaving(true);
      try {
        await saveDraftReadings(inspectionId, {
          checkpoints: readingsData,
          remarks: remarksData,
        });
        setLastSaved(new Date().toISOString());
        setIsDirty(false);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [inspectionId]
  );

  // Trigger auto-save when readings change
  useEffect(() => {
    if (isDirty && Object.keys(readings).length > 0) {
      autoSave(readings, remarks);
    }
  }, [readings, remarks, isDirty, autoSave]);

  // Manual save
  const saveProgress = useCallback(async () => {
    if (!inspectionId) return;
    
    setIsSaving(true);
    try {
      await saveDraftReadings(inspectionId, {
        checkpoints: readings,
        remarks,
      });
      setLastSaved(new Date().toISOString());
      setIsDirty(false);
      return { success: true };
    } catch (err) {
      console.error('Save failed:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [inspectionId, readings, remarks]);

  // Submit inspection
  const submitInspectionData = useCallback(async () => {
    if (!inspectionId || !batchInfo) return;
    
    setIsSubmitting(true);
    try {
      const result = await submitInspection(inspectionId, {
        checkpoints: readings,
        remarks,
        totalSamples: batchInfo.sampleSize,
        lotSize: batchInfo.lotSize,
        submittedAt: new Date().toISOString(),
      });
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Submit failed:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [inspectionId, batchInfo, readings, remarks]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!inspectionForm?.checkpoints || !readings) {
      return {
        totalCheckpoints: 0,
        completedCheckpoints: 0,
        passedCheckpoints: 0,
        failedCheckpoints: 0,
        passRate: 0,
        isComplete: false,
      };
    }
    
    const checkpoints = Object.values(readings);
    const totalCheckpoints = checkpoints.length;
    let completedCheckpoints = 0;
    let passedCheckpoints = 0;
    let failedCheckpoints = 0;
    
    checkpoints.forEach((cp) => {
      if (cp.result === 'Accepted') {
        completedCheckpoints++;
        passedCheckpoints++;
      } else if (cp.result === 'Rejected') {
        completedCheckpoints++;
        failedCheckpoints++;
      }
    });
    
    const completionCheck = checkReadingsComplete(
      readings,
      inspectionForm.checkpoints,
      batchInfo?.sampleSize || 0
    );
    
    return {
      totalCheckpoints,
      completedCheckpoints,
      passedCheckpoints,
      failedCheckpoints,
      passRate: completedCheckpoints > 0 
        ? ((passedCheckpoints / completedCheckpoints) * 100).toFixed(1) 
        : 0,
      isComplete: completionCheck.isComplete,
      missingReadings: completionCheck.missingCount,
    };
  }, [readings, inspectionForm, batchInfo]);

  return {
    // State
    loading,
    error,
    batchInfo,
    inspectionForm,
    readings,
    remarks,
    isDirty,
    isSaving,
    isSubmitting,
    lastSaved,
    stats,
    
    // Actions
    updateReading,
    updateVisualCheck,
    updateRemarks,
    saveProgress,
    submitInspectionData,
    
    // Helpers
    checkpoints: inspectionForm?.checkpoints || [],
    sampleSize: batchInfo?.sampleSize || 0,
  };
};

export default useInspection;
