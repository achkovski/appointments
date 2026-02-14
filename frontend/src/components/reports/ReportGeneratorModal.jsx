import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { FileText, CheckSquare, Square, Printer } from 'lucide-react';

const REPORT_SECTIONS = [
  {
    id: 'summary',
    label: 'Executive Summary',
    description: 'Overview stats, completion rates, revenue, and key metrics',
  },
  {
    id: 'trends',
    label: 'Booking Trends',
    description: 'Appointment volume over time grouped by day, week, or month',
  },
  {
    id: 'services',
    label: 'Service Performance',
    description: 'Bookings, completion rates, and revenue per service',
  },
  {
    id: 'employees',
    label: 'Employee Performance',
    description: 'Bookings, completion rates, and revenue per employee',
    requiresEmployees: true,
  },
  {
    id: 'popular',
    label: 'Popular Days & Time Slots',
    description: 'Busiest days of the week and peak booking hours',
  },
  {
    id: 'clients',
    label: 'Client Analytics',
    description: 'New vs returning clients, retention rate, and top clients by visits',
  },
  {
    id: 'revenue',
    label: 'Revenue Over Time',
    description: 'Revenue trends, averages, and period-over-period comparison',
  },
  {
    id: 'appointments',
    label: 'Appointment Insights',
    description: 'Status breakdown and recent cancellations & no-shows',
  },
];

export default function ReportGeneratorModal({ open, onOpenChange, dateRange, hasEmployees }) {
  const [selectedSections, setSelectedSections] = useState(
    REPORT_SECTIONS.filter(s => !s.requiresEmployees || hasEmployees).map(s => s.id)
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sync dates from parent when modal opens
  useEffect(() => {
    if (open && dateRange) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(dateRange));
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [open, dateRange]);

  // Reset selections when hasEmployees changes
  useEffect(() => {
    setSelectedSections(
      REPORT_SECTIONS.filter(s => !s.requiresEmployees || hasEmployees).map(s => s.id)
    );
  }, [hasEmployees]);

  const availableSections = REPORT_SECTIONS.filter(
    s => !s.requiresEmployees || hasEmployees
  );

  const allSelected = availableSections.every(s => selectedSections.includes(s.id));

  const toggleSection = (id) => {
    setSelectedSections(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedSections([]);
    } else {
      setSelectedSections(availableSections.map(s => s.id));
    }
  };

  const handleGenerate = () => {
    if (selectedSections.length === 0) return;

    const params = new URLSearchParams({
      startDate,
      endDate,
      sections: selectedSections.join(','),
    });

    window.open(`/dashboard/reports?${params.toString()}`, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Select the date range and report sections you want to include.
          </DialogDescription>
        </DialogHeader>

        {/* Date Range */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Date Range</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Report Sections</label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-primary hover:underline"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-1 max-h-[260px] overflow-y-auto">
            {availableSections.map((section) => {
              const checked = selectedSections.includes(section.id);
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors ${
                    checked
                      ? 'bg-primary/5 border border-primary/20'
                      : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{section.label}</div>
                    <div className="text-xs text-muted-foreground">{section.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedSections.length === 0 || !startDate || !endDate}
          >
            <Printer className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
