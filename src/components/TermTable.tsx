'use client';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface RowData {
  subjectCode: string;
  unit: number;
  grade: string;
  honorPoints: number;
}

interface TermTableProps {
  term: string;
  onStatsChange?: (term: string, rows: RowData[]) => void;
  initialRows?: RowData[];
  onEdge?: (direction: "up" | "down" | "left" | "right", fromTerm: string, fromRow: number, fromCol: number) => void;
}

export function TermTable({ term, onStatsChange, initialRows, onEdge }: TermTableProps) {
  const [rows, setRows] = useState<RowData[]>(() => {
    if (initialRows) {
      return initialRows;
    }
    return Array(4).fill(null).map(() => ({
      subjectCode: '',
      unit: 0,
      grade: '',
      honorPoints: 0
    }));
  });

  // Track if this component is actively being edited to prevent initialRows updates
  const isEditingRef = useRef(false);
  const lastInitialRowsRef = useRef(initialRows);

  useEffect(() => {
    // Only update from initialRows if we're not actively editing AND the data actually changed
    if (initialRows && !isEditingRef.current && initialRows !== lastInitialRowsRef.current) {
      setRows(initialRows);
      lastInitialRowsRef.current = initialRows;
    }
  }, [initialRows]);

  // Helper to check for NAT/SER subjects, ignoring case and allowing partials
  const isNatSer = useCallback((code: string) => (code || '').toUpperCase().startsWith('NATSER'), []);

  // Debounce timer ref to prevent excessive parent updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced stats change notification (only notify parent after typing stops)
  useEffect(() => {
    if (onStatsChange) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer - notify parent after 300ms of no changes (increased from 150ms)
      debounceTimerRef.current = setTimeout(() => {
        onStatsChange(term, rows);
      }, 300);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rows, term, onStatsChange]);

  // Memoize totals calculation to avoid recalculating on every render
  const totals = useMemo(() => {
    const validRows = rows.filter(row => {
      const hasData = row.subjectCode.trim() !== '' && row.grade.trim() !== '' && row.unit > 0;
      return hasData && !isNatSer(row.subjectCode);
    });
    
    const creditTotal = validRows.reduce((sum, row) => sum + Number(row.unit), 0);
    const honorPointsTotal = validRows.reduce((sum, row) => sum + row.honorPoints, 0);
    const gpa = creditTotal > 0 ? (honorPointsTotal / creditTotal).toFixed(2) : '0.00';

    return { creditTotal, honorPointsTotal, gpa };
  }, [rows, isNatSer]);

  // Grade validator: only allows 0-4.0, R/r, or NG
  const isValidGrade = useCallback((value: string): boolean => {
    if (value === '') return true; // Allow empty for clearing
    
    // Allow R or r (fail/removal)
    if (value.toUpperCase() === 'R') return true;
    
    // Allow NG (No Grade) - case insensitive
    const upperValue = value.toUpperCase();
    if (upperValue === 'N' || upperValue === 'NG') return true;
    
    // Allow numeric values with specific decimal rules
    const numericRegex = /^\d*\.?\d*$/;
    if (!numericRegex.test(value)) return false;
    
    // If it's a valid number, check range and decimal constraints
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Must be between 0 and 4.0
      if (numValue < 0 || numValue > 4.0) return false;
      
      // If value is 4 or greater, only allow exactly 4.0 or 4 (no decimals like 4.1, 4.5, etc.)
      if (numValue >= 4) {
        return numValue === 4.0;
      }
      
      // For values below 4, check decimal places
      const decimalPart = value.split('.')[1];
      if (decimalPart !== undefined) {
        // Special case: allow 0.0 (but not other .0 decimals like 1.0, 2.0, 3.0)
        if (numValue === 0.0 && (decimalPart === '0' || decimalPart === '00')) {
          return true;
        }
        
        // Decimal must be between .1 and .99 (at least 1 digit, max 2 digits)
        const decimalValue = parseInt(decimalPart, 10);
        if (decimalValue === 0 || decimalValue < 1) {
          return false; // Reject .0, .00 for grades other than 0
        }
        // Allow .1 to .99 (up to 2 decimal places)
        return decimalPart.length <= 2;
      }
      
      return true; // Allow whole numbers like 0, 1, 2, 3
    }
    
    // Allow partial inputs like "1.", "3." for typing
    if (value.endsWith('.')) {
      const wholePart = parseFloat(value);
      if (!isNaN(wholePart) && wholePart >= 0 && wholePart < 4) {
        return true;
      }
      // For "4.", reject since 4 cannot have decimals
      if (wholePart === 4) return false;
    }
    
    return true;
  }, []);

  const updateRow = useCallback((index: number, field: keyof RowData, value: string | number) => {
    isEditingRef.current = true; // Mark as editing
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index] = { ...newRows[index], [field]: value } as RowData;

      // Recalculate honor points for this row
      if (field === 'grade' || field === 'unit' || field === 'subjectCode') {
        const subj = newRows[index].subjectCode;
        // If this is a NAT/SER row, honor points are not applicable
        if (isNatSer(subj)) {
          newRows[index].honorPoints = 0;
        } else {
          const gradeStr = newRows[index].grade;
          const gradeUpper = gradeStr.toUpperCase();
          // R (fail) and NG (no grade) both count as 0
          const grade = (gradeUpper === 'R' || gradeUpper === 'NG') ? 0 : parseFloat(gradeStr) || 0;
          const unit = Number(newRows[index].unit) || 0;
          newRows[index].honorPoints = grade * unit;
        }
      }

      return newRows;
    });
    
    // Reset editing flag after a delay
    setTimeout(() => {
      isEditingRef.current = false;
    }, 500);
  }, [isNatSer]);

  const addRow = useCallback(() => {
    if (rows.length < 10) {
      setRows(prev => [...prev, {
        subjectCode: '',
        unit: 0,
        grade: '',
        honorPoints: 0
      }] as RowData[]);
    }
  }, [rows.length]);

  const removeRow = useCallback((index: number) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter((_, i) => i !== index));
    }
  }, [rows.length]);

  // Handle arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    // Only handle arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    e.preventDefault();

    let newRowIndex = rowIndex;
    let newColIndex = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        if (rowIndex > 0) {
          newRowIndex = rowIndex - 1;
          const cellId = `cell-${term}-${newRowIndex}-${colIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At top edge, try to go to table above
          onEdge('up', term, rowIndex, colIndex);
        }
        return;

      case 'ArrowDown':
        if (rowIndex < rows.length - 1) {
          newRowIndex = rowIndex + 1;
          const cellId = `cell-${term}-${newRowIndex}-${colIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At bottom edge, try to go to table below
          onEdge('down', term, rowIndex, colIndex);
        }
        return;

      case 'ArrowLeft':
        if (colIndex > 0) {
          newColIndex = colIndex - 1;
          const cellId = `cell-${term}-${rowIndex}-${newColIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At left edge, try to go to table on the left
          onEdge('left', term, rowIndex, colIndex);
        }
        return;

      case 'ArrowRight':
        if (colIndex < 2) { // Max is column 2 (Grade column)
          newColIndex = colIndex + 1;
          const cellId = `cell-${term}-${rowIndex}-${newColIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At right edge, try to go to table on the right
          onEdge('right', term, rowIndex, colIndex);
        }
        return;
    }
  };

  return (
    <Card className="shadow-md min-w-[250px] flex flex-col">
      <CardContent className="flex flex-col">
        <h2 className="text-lg font-semibold mb-2">{term}</h2>
        <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr] gap-2 text-sm font-medium mb-2">
          <span>Subject Code</span>
          <span>Unit</span>
          <span>Grade</span>
          <span className="relative left-[-12px]">Honor Pts</span>
        </div>

        <div>
          {rows.map((row, i) => {
            const isNatSerRow = isNatSer(row.subjectCode);
            const natSerClassName = 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';

            return (
              <div key={i} className={cn(
                "grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 mb-1 items-center",
                isNatSerRow && "opacity-60"
              )}>
                {/* Subject Code Input */}
                <Input
                  id={`cell-${term}-${i}-0`}
                  placeholder="Subject Code"
                  value={row.subjectCode}
                  onChange={(e) => updateRow(i, 'subjectCode', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i, 0)}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Editable Unit Input */}
                <Input
                  id={`cell-${term}-${i}-1`}
                  placeholder="0"
                  value={row.unit || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+(\.\d+)?$/.test(value)) {
                      updateRow(i, 'unit', parseFloat(value) || 0);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 1)}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Grade Input */}
                <Input
                  id={`cell-${term}-${i}-2`}
                  placeholder="1.25, R, or NG"
                  value={row.grade}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidGrade(value)) {
                      updateRow(i, 'grade', value);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 2)}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Honor Points (readonly) */}
                <div>
                  {isNatSerRow ? (
                    <Input
                      value="N/A"
                      readOnly
                      disabled
                      className={cn(natSerClassName, "pointer-events-none")}
                      tabIndex={-1}
                    />
                  ) : (
                    <Input
                      placeholder="0.00"
                      value={row.honorPoints.toFixed(2)}
                      readOnly
                      disabled
                      className="bg-gray-100 dark:bg-gray-800 pointer-events-none cursor-not-allowed"
                      tabIndex={-1}
                    />
                  )}
                </div>

                {/* Remove Row Button */}
                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
                  title="Remove row"
                  tabIndex={-1}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        {/* Totals + Add Row */}
        <div className="mt-2 pt-2">
          {/* Totals Row */}
          <div className="border-t-2 border-gray-300 pt-2 pb-6 dark:border-gray-700">
            <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 text-sm font-semibold">
              <span className="text-gray-600 dark:text-gray-300">TOTAL</span>
              <span className="text-gray-900 dark:text-gray-100">{totals.creditTotal}</span>
              <span className="text-gray-600 dark:text-gray-300">GPA: {totals.gpa}</span>
              <span className="text-gray-900 dark:text-gray-100">{totals.honorPointsTotal.toFixed(2)}</span>
              <span></span>
            </div>
          </div>

          {/* Add Subject Button */}
          <div className="flex justify-center">
            <button
              onClick={addRow}
              disabled={rows.length >= 10}
              className="text-foreground hover:text-foreground disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium px-3 py-1 border border-border rounded hover:bg-muted disabled:hover:bg-transparent transition-colors"
            >
              + Add Subject {rows.length >= 10 && "(Max 10)"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
