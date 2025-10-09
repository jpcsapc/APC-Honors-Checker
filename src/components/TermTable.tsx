'use client';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import collegeSubjectData from '@/lib/collegeSubjects.json';
import shsSubjectData from '@/lib/shsSubjects.json';

// Global set of NAT/SER codes (stable reference for hooks)
const NAT_SER_CODES_GLOBAL = new Set(['NATSER1', 'NATSER2']);

interface RowData {
  subjectCode: string;
  unit: number;
  grade: string;
  honorPoints: number;
}

interface TermTableProps {
  term: string;
  level: 'shs' | 'college';
  onStatsChange?: (term: string, stats: { gpa: number; totalHonorPoints: number; totalUnits: number; rGrades: number }) => void;
}

export function TermTable({ term, level, onStatsChange }: TermTableProps) {
  const [rows, setRows] = useState<RowData[]>(() => 
    Array(4).fill(null).map(() => ({
      subjectCode: '',
      unit: 0,
      grade: '',
      honorPoints: 0
    }))
  );

  const getSubjectData = () => {
    return level === 'college' ? collegeSubjectData : shsSubjectData;
  };

  const updateRow = (index: number, field: keyof RowData, value: string | number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value } as RowData;

    // Auto-update unit if subject code matches
    if (field === 'subjectCode' && typeof value === 'string') {
      const subjectCode = value.toUpperCase();
  const subjectData = getSubjectData();
  const unit = (subjectData as Record<string, number>)[subjectCode];
      // Do not force-clear NATSER fields — they should remain editable but excluded from calculations
      if (unit) {
        newRows[index].unit = unit;
      }
    }

    // Recalculate honor points for this row
    if (field === 'grade' || field === 'unit' || field === 'subjectCode') {
      const subj = (newRows[index].subjectCode || '').toUpperCase();
      // If this is a NAT/SER reference row, keep honorPoints at 0 so it won't affect calculations
      if (NAT_SER_CODES_GLOBAL.has(subj)) {
        newRows[index].honorPoints = 0;
      } else {
        const gradeStr = newRows[index].grade;
        const grade = gradeStr.toUpperCase() === 'R' ? 0 : parseFloat(gradeStr) || 0;
        const unit = Number(newRows[index].unit) || 0;
        newRows[index].honorPoints = grade * unit;
      }
    }

    setRows(newRows);
  };

  // Reset rows when level changes
  useEffect(() => {
    setRows(Array(4).fill(null).map(() => ({
      subjectCode: '',
      unit: 0,
      grade: '',
      honorPoints: 0
    })));
  }, [level]);

  const addRow = () => {
    if (rows.length < 10) {
      setRows([...rows, {
        subjectCode: '',
        unit: 0,
        grade: '',
        honorPoints: 0
      }] as RowData[]);
    }
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  const termStats = React.useMemo(() => {
    // Filter rows that have all required fields filled
    const validRows = rows.filter(row => {
      const code = (row.subjectCode || '').toUpperCase();
      // Exclude NATSER1 / NATSER2 from all calculations
      if (NAT_SER_CODES_GLOBAL.has(code)) return false;
      return row.subjectCode.trim() !== '' && row.grade.trim() !== '' && row.unit > 0;
    });

    if (validRows.length === 0) {
      return { gpa: 0, totalHonorPoints: 0, totalUnits: 0, rGrades: 0 };
    }

    const totalHonorPoints = validRows.reduce((sum, row) => sum + row.honorPoints, 0);
    const totalUnits = validRows.reduce((sum, row) => sum + Number(row.unit), 0);
    const gpa = totalUnits > 0 ? totalHonorPoints / totalUnits : 0;
    const rGrades = validRows.filter(row => row.grade.toUpperCase() === 'R').length;

    return {
      gpa: gpa,
      totalHonorPoints: totalHonorPoints,
      totalUnits: totalUnits,
      rGrades: rGrades
    };
  }, [rows]);

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(term, termStats);
    }
  }, [termStats, term, onStatsChange]);

  return (
    <Card className="shadow-md min-w-[250px] flex flex-col h-[650 px]">
      <CardContent className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">{term}</h2>
        <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr] gap-2 text-sm font-medium mb-2">
          <span>Subject Code</span>
          <span>Unit</span>
          <span>Grade</span>
          <span>Honor Pts</span>
        </div>

        <div className="flex-1">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 mb-1 items-center">
              {/* Subject Code Input */}
              <Input
                placeholder="Subject Code"
                value={row.subjectCode}
                onChange={(e) => updateRow(i, 'subjectCode', e.target.value)}
                type="text"
              />

              {/* Editable Unit Input */}
              <Input
                placeholder="0"
                value={row.unit || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+(\.\d+)?$/.test(value)) {
                    updateRow(i, 'unit', parseFloat(value) || 0);
                  }
                }}
                type="text"
                // Keep editable but visually muted for NATSER rows
                className={NAT_SER_CODES_GLOBAL.has((row.subjectCode || '').toUpperCase()) ? 'bg-gray-50 text-gray-500' : ''}
              />

              {/* Grade Input */}
              <Input
                placeholder="1.25 or R"
                value={row.grade}
                onChange={(e) => updateRow(i, 'grade', e.target.value)}
                type="text"
                // Keep editable but visually muted for NATSER rows
                className={NAT_SER_CODES_GLOBAL.has((row.subjectCode || '').toUpperCase()) ? 'bg-gray-50 text-gray-500' : ''}
              />

              {/* Honor Points (readonly) */}
              <div>
                {NAT_SER_CODES_GLOBAL.has((row.subjectCode || '').toUpperCase()) ? (
                  <div className="px-2 py-1 text-sm bg-gray-50 text-gray-500 rounded">N/A</div>
                ) : (
                  <Input
                    placeholder="0.00"
                    value={row.honorPoints.toFixed(2)}
                    readOnly
                    className="bg-gray-100"
                  />
                )}
              </div>

              {/* Remove Row Button */}
              <button
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
                title="Remove row"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add Row + Totals */}
        <div className="mt-auto pt-4">
          <div className="flex justify-center mb-4">
            <button
              onClick={addRow}
              disabled={rows.length >= 10}
              className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 disabled:hover:bg-transparent"
            >
              + Add Subject {rows.length >= 10 && "(Max 10)"}
            </button>
          </div>

          <div className="border-t-2 border-gray-300 pt-2">
            <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 text-sm font-semibold">
              <span className="text-gray-600">TOTAL</span>
              <span className="text-gray-600">{termStats.totalUnits}</span>
              <span className="text-gray-600">GPA: {termStats.gpa.toFixed(2)}</span>
              <span className="text-gray-600">{termStats.totalHonorPoints.toFixed(2)}</span>
              <span></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
