'use client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import subjectData from '@/lib/subjectData.json';

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

export function TermTable({ term }: { term: string }) {
  const [rows, setRows] = useState<RowData[]>(() => 
    Array(4).fill(null).map(() => ({
      subjectCode: '',
      unit: 0,
      grade: '',
      honorPoints: 0
    }))
  );

  // Create options for React Select from subject data
  const subjectOptions: SubjectOption[] = Object.keys(subjectData).map(code => ({
    value: code,
    label: code
  }));

  const updateRow = (index: number, field: keyof RowData, value: string | number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // So what this does is that it updates the unit of the subject code based on the subject code
    if (field === 'subjectCode' && typeof value === 'string') {
      const subjectCode = value.toUpperCase();
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
                placeholder="SHEAPPS"
                isClearable
                isSearchable
                className="text-sm"
              />
            </div>
            <Input 
              placeholder="0" 
              value={row.unit ? row.unit.toString() : (row.subjectCode && !subjectData[row.subjectCode as keyof typeof subjectData] ? "CODE NOT FOUND" : "")}
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
      </CardContent>
    </Card>
  );
}
