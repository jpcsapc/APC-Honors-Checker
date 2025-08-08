'use client';
import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export function ToggleLevelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string | null
  ) => {
    if (newAlignment !== null) onChange(newAlignment);
  };

  return (
    <div className="flex justify-center">
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="Level"
        color="primary"
      >
        <ToggleButton
            value="shs"
            sx={{ borderRadius: '9999px', px: 3 }}
            >
            SHS
        </ToggleButton>
        <ToggleButton
            value="college"
            sx={{ borderRadius: '9999px', px: 3 }}
            >
            College
        </ToggleButton>

      </ToggleButtonGroup>
    </div>
  );
}
