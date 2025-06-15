
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X, Search } from 'lucide-react';
import { format } from 'date-fns';

export interface FeatureFilters {
  search: string;
  status: string[];
  priority: string[];
  complexity: string[];
  category: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
}

interface AdvancedFeatureFiltersProps {
  filters: FeatureFilters;
  onFiltersChange: (filters: FeatureFilters) => void;
  categories: string[];
}

const AdvancedFeatureFilters = ({ filters, onFiltersChange, categories }: AdvancedFeatureFiltersProps) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'on-hold', label: 'On Hold' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const complexityOptions = [
    { value: 'simple', label: 'Simple' },
    { value: 'medium', label: 'Medium' },
    { value: 'complex', label: 'Complex' }
  ];

  const updateFilter = (key: keyof FeatureFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayFilter = (key: 'status' | 'priority' | 'complexity' | 'category', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      priority: [],
      complexity: [],
      category: [],
      dateRange: {}
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.complexity.length > 0) count++;
    if (filters.category.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search features by title or description..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={filters.status.includes(option.value)}
                          onCheckedChange={() => toggleArrayFilter('status', option.value)}
                        />
                        <Label htmlFor={`status-${option.value}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {priorityOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${option.value}`}
                          checked={filters.priority.includes(option.value)}
                          onCheckedChange={() => toggleArrayFilter('priority', option.value)}
                        />
                        <Label htmlFor={`priority-${option.value}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complexity Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Complexity</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {complexityOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`complexity-${option.value}`}
                          checked={filters.complexity.includes(option.value)}
                          onCheckedChange={() => toggleArrayFilter('complexity', option.value)}
                        />
                        <Label htmlFor={`complexity-${option.value}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={filters.category.includes(category)}
                            onCheckedChange={() => toggleArrayFilter('category', category)}
                          />
                          <Label htmlFor={`category-${category}`} className="text-sm">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? format(filters.dateRange.from, 'PP') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.to ? format(filters.dateRange.to, 'PP') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.status.map(status => (
                <Badge key={status} variant="secondary" className="cursor-pointer">
                  Status: {status}
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={() => toggleArrayFilter('status', status)}
                  />
                </Badge>
              ))}
              {filters.priority.map(priority => (
                <Badge key={priority} variant="secondary" className="cursor-pointer">
                  Priority: {priority}
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={() => toggleArrayFilter('priority', priority)}
                  />
                </Badge>
              ))}
              {filters.complexity.map(complexity => (
                <Badge key={complexity} variant="secondary" className="cursor-pointer">
                  Complexity: {complexity}
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={() => toggleArrayFilter('complexity', complexity)}
                  />
                </Badge>
              ))}
              {filters.category.map(category => (
                <Badge key={category} variant="secondary" className="cursor-pointer">
                  Category: {category}
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={() => toggleArrayFilter('category', category)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedFeatureFilters;
