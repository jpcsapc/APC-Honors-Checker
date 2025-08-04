'use client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import collegeSubjectData from '@/lib/collegeSubjects.json';
import shsSubjectData from '@/lib/shsSubjects.json';


// WARNING: CONNECTING TOGGLELEVELSELECTOR COMPONENT TO SYNCH WITH SELECTED GRADE IS VIBE CODED.

interface RowData {
  subjectCode: string;
  unit: number;
  grade: string;
  honorPoints: number;
}

interface SubjectOption {
  value: string;
  label: string;
}

interface TermTableProps {
  term: string;
  level: 'shs' | 'college';
}

export function TermTable({ term, level }: TermTableProps) {
  const [rows, setRows] = useState<RowData[]>(() => 
    Array(4).fill(null).map(() => ({
      subjectCode: '',
      unit: 0,
      grade: '',
      honorPoints: 0
    }))
  );

  // Get the appropriate subject data based on level
  const getSubjectData = () => {
    return level === 'college' ? collegeSubjectData : shsSubjectData;
  };

  // Create options for React Select from subject data
  const subjectOptions: SubjectOption[] = Object.keys(getSubjectData()).map(code => ({
    value: code,
    label: code
  }));

  // Function to get a random subject code for placeholder
  const getRandomSubjectCode = () => {
    const subjectCodes = Object.keys(getSubjectData());
    return subjectCodes[Math.floor(Math.random() * subjectCodes.length)];
  };

  const updateRow = (index: number, field: keyof RowData, value: string | number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // So what this does is that it updates the unit of the subject code based on the subject code
    if (field === 'subjectCode' && typeof value === 'string') {
      const subjectCode = value.toUpperCase();
      const subjectData = getSubjectData();
      const unit = subjectData[subjectCode as keyof typeof subjectData];
      newRows[index].unit = unit || 0;
    }
    
    if (field === 'grade' || field === 'unit') {
      const grade = parseFloat(newRows[index].grade) || 0;
      const unit = newRows[index].unit;
      newRows[index].honorPoints = grade * unit;
    }
    
    setRows(newRows);
  };

  const handleSubjectCodeChange = (index: number, selectedOption: SubjectOption | null) => {
    const subjectCode = selectedOption ? selectedOption.value : '';
    const subjectData = getSubjectData();
    const unit = selectedOption ? subjectData[selectedOption.value as keyof typeof subjectData] : 0;
    
    const newRows = [...rows];
    newRows[index] = {
      ...newRows[index],
      subjectCode,
      unit,
      honorPoints: (parseFloat(newRows[index].grade) || 0) * unit
    };
    
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

  // Function to get the display value for unit field
  const getUnitDisplayValue = (row: RowData) => {
    if (row.unit) return row.unit.toString();
    if (row.subjectCode) {
      const subjectData = getSubjectData();
      if (!subjectData[row.subjectCode as keyof typeof subjectData]) {
        return "CODE NOT FOUND";
      }
    }
    return "";
  };

  // Calculate GPA and total honor points for the term
  const calculateTermStats = () => {
    const validRows = rows.filter(row => row.subjectCode && row.grade && row.unit > 0);
    
    if (validRows.length === 0) {
      return { gpa: 0, totalHonorPoints: 0, totalUnits: 0 };
    }

    const totalHonorPoints = validRows.reduce((sum, row) => sum + row.honorPoints, 0);
    const totalUnits = validRows.reduce((sum, row) => sum + row.unit, 0);
    const gpa = totalUnits > 0 ? totalHonorPoints / totalUnits : 0;

    return {
      gpa: gpa,
      totalHonorPoints: totalHonorPoints,
      totalUnits: totalUnits
    };
  };

  const termStats = calculateTermStats();

  return (
    <Card className="shadow-md min-w-[250px]">
      <CardContent>
        <h2 className="text-lg font-semibold mb-2">{term}</h2>
        <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr] gap-2 text-sm font-medium mb-2">
          <span>Subject Code</span>
          <span>Unit</span>
          <span>Grade</span>
          <span>Honor Pts</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[2fr_0.7fr_1fr_1fr] gap-2 mb-1">
            <div className="relative">
              <Select
                options={subjectOptions}
                value={row.subjectCode ? { value: row.subjectCode, label: row.subjectCode } : null}
                onChange={(option) => handleSubjectCodeChange(i, option)}
                
                // Place Holder is some random subject code in the subjectcodelist
                placeholder={getRandomSubjectCode()}
                isClearable
                isSearchable
                className="text-sm"
              />
            </div>
            <Input 
              placeholder="0" 
              value={getUnitDisplayValue(row)}
              readOnly
              className="bg-gray-100"
            />
            <Input 
              placeholder="1.25" 
              value={row.grade}
              onChange={(e) => updateRow(i, 'grade', e.target.value)}
              type="number"
              step="0.25"
              min="1.0"
              max="4.0"
            />
            <Input 
              placeholder="0.00" 
              value={row.honorPoints.toFixed(2)}
              readOnly
              className="bg-gray-100"
            />
          </div>
        ))}
        
        {/* Summary Row */}
        <div className="border-t-2 border-gray-300 mt-4 pt-2">
          <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr] gap-2 text-sm font-semibold">
            <span className="text-gray-600">TOTAL</span>
            <span className="text-gray-600">{termStats.totalUnits}</span>
            <span className="text-gray-600">GPA: {termStats.gpa.toFixed(2)}</span>
            <span className="text-gray-600">{termStats.totalHonorPoints.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
