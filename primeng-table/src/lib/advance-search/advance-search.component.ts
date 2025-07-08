import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Calendar } from 'primeng/calendar';
import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'lib-advance-search',
  standalone: false,
  templateUrl: './advance-search.component.html',
  styleUrl: './advance-search.component.css',
})
export class AdvanceSearchComponent {
  // Inputs
  @Input() language: string;
  @Input() advanceSearchColumns = [];
  @Input() tableId: any;
  @Input() selectedAdvanceFilter: any;
  @Input() isAdvanced: any;

  // Outputs
  @Output() applyAdvancedSearchFilter: EventEmitter<any> =
    new EventEmitter<any>();
  @Output() onFilterAdd: EventEmitter<any> = new EventEmitter<any>();
  @Output() onFilterRemove: EventEmitter<any> = new EventEmitter<any>();

  // ViewChild
  @ViewChild('targetfl', { static: false }) targetfl!: ElementRef;
  @ViewChild('calendar') calendar: Calendar;

  // Public state variables
  isPriceRange: boolean;
  isDateFilter: boolean;
  isText: boolean;
  isDropDown: boolean;
  isMinMax: boolean;
  minPrice: number;
  maxPrice: number;
  priceRangeValue: number;
  dropDownItems = [];
  public advancedSearchFilterArray = [];
  public rangeDates: Date[] | undefined;
  public rangeDatesMultiple: any[] = [];
  public tempDateArray = [];
  selectedDropdownItems = [];
  displayName: any;
  activeIndexItem: number[] = [];
  isSidebarVisible: boolean = false;
  data = new searchSelection();
  searchTextValue: any = '';
  searchTextOperation: any = '';
  advanceSearchColumnsValue = [{ text: 'Contains', value: 'Contains' }];
  itemSelectedItemsArray = [];
  previousValue = [];

  // Constructor and lifecycle
  constructor(
    public messageService: MessageService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.addLocalstorageFilterInAdvanceSearchArray();
    if (this.language === 'ar') {
      this.translateItems();
    }
  }

  /**
   * Centralized filter object builder for all filter types
   * Accepts either a UI filter object (from itemSelectedItemsArray) or a storage filter object (from localstorage/session)
   */
  private buildFilterObject(res: any, isFromStorage: boolean = false) {
    switch (res.filterType) {
      case 'isDropDown':
      case 'isText': {
        // For storage, keys may differ
        const keyName = isFromStorage ? res.columnName : res.keyName;
        const value = isFromStorage ? res.filterValue : res.value;
        const text = isFromStorage ? res.text : res.text;
        const displayName = isFromStorage ? res.headingName : res.displayName;
        let data = new searchSelection();
        data.columnName = keyName;
        data.value = value;
        data.text = text;
        data.headingName = displayName;
        data.displayLabel = displayName + ': ';
        data.displayLabel += text
          ? text.replace(/,/g, ', ')
          : value.replace(/,/g, ', ');
        data['filterValue'] = res.keyValue ? res.keyValue : value;
        data['filterColumn'] = keyName;
        data['filterType'] = res.filterType;
        return data;
      }
      case 'isDateFilter':
      case 'isMinMax':
      case 'isPriceRange':
        return this.buildCommonFilterObject(res, isFromStorage);
      case 'isMultipleDateFilter': {
        const obj: any = this.buildCommonFilterObject(res, isFromStorage);
        obj.index = res.index;
        return obj;
      }
      default:
        // fallback for unknown types
        return {
          displayName: res.headingName,
          filterType: res.filterType,
          keyName: res.columnName,
          value: res.filterValue,
        };
    }
  }

  /**
   * Builds the common filter object for isDateFilter, isMinMax, isPriceRange, and isMultipleDateFilter
   */
  private buildCommonFilterObject(res: any, isFromStorage: boolean = false) {
    return {
      filterColumn: res.filterColumn,
      filterValue: res.filterValue,
      filterOperator: res.filterOperator,
      keyName: res.keyName,
      filterType: res.filterType,
      displayName: isFromStorage ? res.displayLabel : res.displayName,
      displayLabel: isFromStorage ? res.displayLabel : res.displayName,
      headingName: isFromStorage ? res.displayLabel : res.displayName,
    };
  }

  addLocalstorageFilterInAdvanceSearchArray() {
    let tableConfig: any = JSON.parse(sessionStorage.getItem('tableConfig'));
    if (tableConfig && tableConfig.length > 0) {
      tableConfig.forEach((res) => {
        if (res.tableId === this.tableId) {
          if (res.advanceSearchArray && res.advanceSearchArray.length > 0) {
            res.advanceSearchArray.forEach((xs) => {
              // Use the reusable builder
              const obj = this.buildFilterObject(xs, true);
              // Special handling for date ranges
              if (xs.filterType == 'isDateFilter') {
                this.rangeDates = this.extractDateRange(xs.displayLabel);
              } else if (xs.filterType == 'isMultipleDateFilter') {
                this.rangeDatesMultiple[xs.index] = this.extractDateRange(xs.displayLabel);
              }
              this.itemSelectedItemsArray.push(obj);
            });
          }
        }
      });
    }
    if (this.selectedAdvanceFilter && this.selectedAdvanceFilter.length > 0) {
      this.advancedSearchFilterArray = [];
      this.advancedSearchFilterArray.push(...this.selectedAdvanceFilter);
      this.selectedAdvanceFilter.forEach((ls) => {
        if (ls.filterType === 'isDropDown') {
          let array = ls.value.split(',');
          this.selectedDropdownItems.push(...array);
        }
      });

      this.previousValue = [];
      this.previousValue.push(...this.selectedDropdownItems);
    }
  }

  keypress(event: any) {
    const pattern = /[0-9\.]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (event.keyCode != 8 && event.keyCode != 9 && !pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onRemoveClick(i: number, data) {
    // Remove the filter at the given index from both arrays
    this.advancedSearchFilterArray.splice(i, 1);
    this.itemSelectedItemsArray.splice(i, 1);

    // Handle special cases based on filter type/column
    if (data.filterColumn === 'max') {
      // Reset price range values
      this.priceRangeValue = 0;
      this.minPrice = null;
      this.maxPrice = null;
      // Remove corresponding 'min' filter
      this.removeFilterByColumn('min');
    } else if (
      data.filterColumn === 'startDate' &&
      data.filterType !== 'isMultipleDateFilter'
    ) {
      // Reset date range
      this.rangeDates = [];
      // Remove corresponding 'endDate' filter
      this.removeFilterByColumn('endDate', false, 'isMultipleDateFilter');
    } else if (data.filterColumn === 'Text') {
      // Reset text search
      this.searchTextOperation = '';
      this.searchTextValue = '';
    } else if (
      (data.filterColumn === 'startDate' ||
        data.filterColumn === 'endDate' ||
        data.filterColumn === 'createdate') &&
      data.filterType === 'isMultipleDateFilter'
    ) {
      // Reset multiple date filter for the given index
      this.rangeDatesMultiple[data.index] = [];
    } else {
      // Handle dropdown filter removal
      this.syncDropdownItemsWithSelected();
    }

    // Emit changes or clear all if no filters left
    if (this.advancedSearchFilterArray.length > 0) {
      this.applyAdvancedSearchFilter.emit(this.advancedSearchFilterArray);
      this.onFilterRemove.emit();
    } else {
      this.onClearAllFilter();
    }
  }

  // Helper to remove a filter by column name (optionally skip a filterType)
  private removeFilterByColumn(
    column: string,
    removeAll: boolean = true,
    skipType?: string,
  ) {
    for (let idx = this.advancedSearchFilterArray.length - 1; idx >= 0; idx--) {
      const filter = this.advancedSearchFilterArray[idx];
      if (
        filter.filterColumn === column &&
        (removeAll || (skipType && filter.filterType !== skipType))
      ) {
        this.advancedSearchFilterArray.splice(idx, 1);
        this.itemSelectedItemsArray.splice(idx, 1);
      }
    }
  }

  // Helper to sync selectedDropdownItems with current itemSelectedItemsArray
  private syncDropdownItemsWithSelected() {
    let allValues: string[] = [];
    for (let obj of this.itemSelectedItemsArray) {
      if (obj.filterType === 'isDropDown') {
        allValues = allValues.concat(
          obj.value.split(',').map((item) => item.trim()),
        );
      }
    }
    const resultArray = this.selectedDropdownItems.filter((item) =>
      allValues.includes(item),
    );
    setTimeout(() => {
      this.selectedDropdownItems = resultArray;
      this.previousValue = resultArray;
    }, 500);
  }

  onFilterButtonClick() {
    this.isSidebarVisible = true;
    setTimeout(() => {
      this.activeIndexItem = [0];
    }, 0);
    this.accordianOpen('', this.advanceSearchColumns[0]);
  }

  onLabelClick(i, data) {
    this.activeIndexItem = [];
    let index;
    if (data.filterType == 'isDropDown' || data.filterType == 'isText') {
      index = this.advanceSearchColumns.findIndex(
        (element) => element.keyName === data.columnName,
      );
      this.fetchData(this.advanceSearchColumns[index], data);
      this.activeIndexItem.push(index);
    } else if (
      data.filterType == 'isMinMax' ||
      data.filterType == 'isDateFilter' ||
      data.filterType == 'isPriceRange'
    ) {
      const index = this.advanceSearchColumns.findIndex(
        (element) => element[data.filterType] === true,
      );
      this.fetchData(this.advanceSearchColumns[index], data);
      this.activeIndexItem.push(index);
    } else if (data.filterType == 'isMultipleDateFilter') {
      const index = this.advanceSearchColumns.findIndex(
        (element) =>
          element[data.filterType] === true && element.keyName === data.keyName,
      );
      this.fetchData(this.advanceSearchColumns[index], data);
      this.activeIndexItem.push(index);
    } else {
      this.activeIndexItem.push(0);
    }

    this.isSidebarVisible = true;
  }

  isDate(value: any): boolean {
    return value instanceof Date;
  }

  setUTCTimeZoneForDate(date: Date) {
    const utcDate = new Date(date.toUTCString());
    const timezoneOffset = new Date().getTimezoneOffset() / 60;
    utcDate.setHours(utcDate.getHours() - timezoneOffset);
    // Format the date as "YYYY-MM-DD" without using moment
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getDate()).padStart(2, '0');
    const convertedDate = `${year}-${month}-${day}`;
    return convertedDate ? convertedDate : null;
  }

  formatDates(date) {
    if (this.isDate(date)) {
      let convertedStartDate: any = this.setUTCTimeZoneForDate(date);
      return convertedStartDate;
    } else {
      // Use Angular's DatePipe to format the date
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }
  convertDateToString(date) {
    if (this.isDate(date)) {
      let convertedStartDate: any = this.setUTCTimeZoneForDate(date);
      return convertedStartDate;
    } else {
      // Use Angular's DatePipe to format the date
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }

  translateItems() {
    this.advanceSearchColumns.forEach((item) => {
      this.translate.get(item.displayName).subscribe((translation: string) => {
        item.displayName = translation;
      });
    });
    this.advanceSearchColumnsValue.forEach((item) => {
      this.translate.get(item.text).subscribe((translation: string) => {
        item.text = translation;
      });
    });
  }

  /* To do Jeel */

  fetchData(tab: any, data?): void {
    if (tab) {
      if (
        (tab.dropDownApi !== null || tab.dropDownApi !== '') &&
        tab.displayName !== 'Order Date' &&
        tab.keyName !== 'MinMaxPrice' &&
        tab.keyName !== 'name' &&
        tab.keyName !== 'startDate' &&
        tab.keyName !== 'endDate' &&
        tab.keyName !== 'createdate'
      ) {
        if (tab.isStaticDropdown) {
          tab['dropDownItems'] = tab.dataList;
        } else {
          this.http.get(tab.dropDownApi).subscribe((res: any) => {
            if (res.responseCode === 200) {
              tab['dropDownItems'] = res.dataList;
            }
          });
        }
      } else if (tab.keyName === 'Date') {
        const dateString = data.displayLabel;
        this.rangeDates = this.extractDateRange(dateString);
      } else if (tab.keyName === 'MinMaxPrice') {
        const { minPrice, maxPrice } = this.extractMinMaxPriceFromString(
          data.displayLabel,
        );
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
      } else if (tab.keyName === 'name') {
        this.searchTextValue = data.filterValue;
      } else if (
        tab.keyName === 'startDate' ||
        tab.keyName === 'endDate' ||
        tab.keyName === 'createdate'
      ) {
        const dateString = data.displayLabel;
        this.rangeDatesMultiple[tab.index] = this.extractDateRange(dateString);
      }
    }
  }
  extractMinMaxPriceFromString(string) {
    const [min, max] = string.split(':')[1].split('-');
    const minPrice = min;
    const maxPrice = max;
    return { minPrice, maxPrice };
  }
  extractDateRange(dateString) {
    const datePattern = /(\d{2}-\d{2}-\d{4})/g;
    const dates = dateString.match(datePattern);
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates.map((dateStr) => {
        const [day, month, year] = dateStr.split('-');
        return new Date(year, month - 1, day);
      });
      return [startDate, endDate];
    } else {
      return [];
    }
  }
  accordianOpen(event, tab) {
    if (!tab?.dropDownItems) {
      this.displayName = tab?.displayName;
      if (tab?.isDropDown) {
        this.fetchData(tab);
      }
    }
  }

  onClearAllFilter() {
    this.advancedSearchFilterArray = [];
    this.selectedDropdownItems = [];
    this.minPrice = null;
    this.maxPrice = null;
    this.searchTextOperation = '';
    this.searchTextValue = '';
    this.itemSelectedItemsArray = [];
    this.rangeDates = [];
    this.rangeDatesMultiple = [];
    this.priceRangeValue = 0;
    this.previousValue = [];
    this.applyAdvancedSearchFilter.emit(undefined);

    setTimeout(() => {
      this.onFilterRemove.emit();
    }, 100);
  }

  onMainApplyClick(event) {
    this.advancedSearchFilterArray = [];
    this.itemSelectedItemsArray.forEach((res) => {
      const filterObject = this.buildFilterObject(res);
      if (filterObject) {
        this.advancedSearchFilterArray.push(filterObject);
      }
    });
    this.applyAdvancedSearchFilter.emit(this.advancedSearchFilterArray);
    setTimeout(() => {
      this.onFilterAdd.emit();
    }, 100);
  }

  OnChangeSel(tab: any, selectedDropdownItems: any) {
    this.cdr.detectChanges();
    const filterTypeKey = Object.keys(tab).find((key) => tab[key] === true);

    if (filterTypeKey === 'isDropDown') {
      this.handleDropdownChange(tab, selectedDropdownItems, filterTypeKey);
    } else if (filterTypeKey === 'isText') {
      this.handleTextChange(tab, filterTypeKey);
    } else if (filterTypeKey === 'isDateFilter') {
      this.handleDateFilterChange(tab, filterTypeKey);
    } else if (filterTypeKey === 'isMinMax') {
      this.handleMinMaxChange(tab, filterTypeKey);
    } else if (filterTypeKey === 'isPriceRange') {
      this.handlePriceRangeChange(tab, filterTypeKey);
    } else if (filterTypeKey === 'isMultipleDateFilter') {
      this.handleMultipleDateFilterChange(tab, filterTypeKey);
    }
    return;
  }

  // --- Helper methods for OnChangeSel ---

  private handleDropdownChange(
    tab: any,
    selectedDropdownItems: any,
    filterTypeKey: string,
  ) {
    const latestValue = selectedDropdownItems[selectedDropdownItems.length - 1];
    if (this.previousValue.length < selectedDropdownItems.length) {
      let existingEntry = this.itemSelectedItemsArray.find(
        (entry) => entry.keyName.toLowerCase() === tab.keyName.toLowerCase(),
      );
      if (existingEntry) {
        if (typeof latestValue === 'object') {
          if (!existingEntry.value.split(',').includes(latestValue.name)) {
            existingEntry.text += `,${tab.dropDownItems.find((ls) => ls.value == latestValue.name).text}`;
            existingEntry.value += `,${latestValue.name}`;
          }
        } else {
          if (!existingEntry.value.split(',').includes(latestValue)) {
            existingEntry.text += `,${tab.dropDownItems.find((ls) => ls.value == latestValue).text}`;
            existingEntry.value += `,${latestValue}`;
          }
        }
      } else {
        if (typeof latestValue === 'object') {
          this.itemSelectedItemsArray.push({
            filterType: filterTypeKey,
            displayName: tab.displayName,
            keyValue: tab.keyValue ? tab.keyValue : undefined,
            keyName: tab.keyName,
            value: latestValue.name,
            text: tab.dropDownItems.find((ls) => ls.value == latestValue.name)
              .text,
          });
        } else {
          this.itemSelectedItemsArray.push({
            filterType: filterTypeKey,
            displayName: tab.displayName,
            keyName: tab.keyName,
            keyValue: tab.keyValue ? tab.keyValue : undefined,
            value: latestValue,
            text: tab.dropDownItems.find((ls) => ls.value == latestValue).text,
          });
        }
      }
    } else {
      // Handle removal
      const missingItems = this.previousValue.filter(
        (item) => !selectedDropdownItems.includes(item),
      );
      this.itemSelectedItemsArray.forEach((obj) => {
        if (obj.displayName == tab.displayName) {
          const existingValues = obj.value
            .split(',')
            .map((item) => item.trim());
          let updatedItems;
          if (
            typeof missingItems === 'object' &&
            missingItems.length > 0 &&
            missingItems[0].hasOwnProperty('name')
          ) {
            updatedItems = existingValues.filter(
              (item) => !missingItems[0]['name'].includes(item),
            );
          } else {
            updatedItems = existingValues.filter(
              (item) => !missingItems.includes(item),
            );
          }
          if (updatedItems.length > 0) {
            obj.value = updatedItems.join(',');
            obj.text = updatedItems
              .map(
                (item) =>
                  tab.dropDownItems.find((ls) => ls.value === item)?.text,
              )
              .filter((text) => text)
              .join(',');
          } else {
            for (let i = this.itemSelectedItemsArray.length - 1; i >= 0; i--) {
              if (
                this.itemSelectedItemsArray[i].displayName === tab.displayName
              ) {
                this.itemSelectedItemsArray.splice(i, 1);
              }
            }
          }
        }
      });
    }
    this.previousValue = selectedDropdownItems;
  }

  private handleTextChange(tab: any, filterTypeKey: string) {
    setTimeout(() => {
      let existingEntry = this.itemSelectedItemsArray.find(
        (entry) => entry.keyName.toLowerCase() === tab.keyName.toLowerCase(),
      );
      if (existingEntry) {
        existingEntry.value = this.searchTextValue;
      } else {
        this.itemSelectedItemsArray.push({
          operation: this.searchTextOperation,
          filterType: filterTypeKey,
          displayName: tab.displayName,
          keyName: tab.keyName,
          value: this.searchTextValue,
        });
      }
    }, 0);
  }

  private handleDateFilterChange(tab: any, filterTypeKey: string) {
    if (this.rangeDates && this.rangeDates.length === 2) {
      if (this.rangeDates[0] != null && this.rangeDates[1] != null) {
        let startDate = this.convertDateToString(this.rangeDates[0]);
        let endDate = this.convertDateToString(this.rangeDates[1]);
        let formattedStartDate = this.formatDates(startDate);
        let formattedEndDate = this.formatDates(endDate);
        this.tempDateArray = [
          {
            filterColumn: 'startDate',
            filterValue: startDate,
            filterOperator: 'equalto',
            formattedStartDate: formattedStartDate,
            keyName: tab.keyName,
            filterType: filterTypeKey,
            displayName: `${tab.displayName} ${this.translate.instant('Between')} ${formattedStartDate}${this.translate.instant(' To ')}${formattedEndDate}`,
          },
          {
            filterColumn: 'endDate',
            filterValue: endDate,
            filterOperator: 'equalto',
            formattedEndDate: formattedEndDate,
            keyName: tab.keyName,
            filterType: filterTypeKey,
            displayName: `${tab.displayName} ${this.translate.instant('Between')} ${formattedStartDate}${this.translate.instant(' To ')}${formattedEndDate}`,
          },
        ];
        let existingEntry = this.itemSelectedItemsArray.find(
          (entry) => entry.keyName.toLowerCase() === tab.keyName.toLowerCase(),
        );
        if (existingEntry) {
          if (existingEntry.filterColumn == 'startDate') {
            existingEntry.filterValue = startDate;
            existingEntry.displayName = `${tab.displayName} ${this.translate.instant('Between')} ${formattedStartDate}${this.translate.instant(' To ')}${formattedEndDate}`;
            let existingEntryForendDate = this.itemSelectedItemsArray.find(
              (entry) =>
                entry.keyName.toLowerCase() === tab.keyName.toLowerCase() &&
                entry.filterColumn === 'endDate',
            );
            existingEntryForendDate.filterValue = endDate;
            existingEntryForendDate.displayName = `${tab.displayName} ${this.translate.instant('Between')} ${formattedStartDate}${this.translate.instant(' To ')}${formattedEndDate}`;
          }
        } else {
          this.itemSelectedItemsArray.push(...this.tempDateArray);
        }
      }
    }
  }

  private handleMinMaxChange(tab: any, filterTypeKey: string) {
    setTimeout(() => {
      if (this.minPrice != null && this.maxPrice != null) {
        this.tempDateArray = [
          {
            filterColumn: 'max',
            filterValue: this.maxPrice,
            filterOperator: 'equalto',
            keyName: tab.keyName,
            filterType: filterTypeKey,
            displayName: `min-max:${this.minPrice}-${this.maxPrice}`,
          },
          {
            filterColumn: 'min',
            filterValue: this.minPrice,
            filterOperator: 'equalto',
            keyName: tab.keyName,
            filterType: filterTypeKey,
            displayName: `min-max:${this.minPrice}-${this.maxPrice}`,
          },
        ];
        let existingEntry = this.itemSelectedItemsArray.find(
          (entry) => entry.keyName.toLowerCase() === tab.keyName.toLowerCase(),
        );
        if (existingEntry) {
          if (existingEntry.filterColumn == 'max') {
            existingEntry.filterValue = this.maxPrice;
            existingEntry.displayName = `min-max:${this.minPrice}-${this.maxPrice}`;
            let existingEntryForMin = this.itemSelectedItemsArray.find(
              (entry) =>
                entry.keyName.toLowerCase() === tab.keyName.toLowerCase() &&
                entry.filterColumn.toLowerCase() === 'min',
            );
            existingEntryForMin.filterValue = this.minPrice;
            existingEntryForMin.displayName = `min-max:${this.minPrice}-${this.maxPrice}`;
          }
        } else {
          this.itemSelectedItemsArray.push(...this.tempDateArray);
        }
      }
    }, 0);
  }

  private handlePriceRangeChange(tab: any, filterTypeKey: string) {
    if (this.priceRangeValue != null) {
      let existingEntry = this.itemSelectedItemsArray.find(
        (entry) => entry.keyName.toLowerCase() === tab.keyName.toLowerCase(),
      );
      this.tempDateArray = [
        {
          filterColumn: 'max',
          filterValue: this.priceRangeValue,
          filterOperator: 'equalto',
          keyName: tab.keyName,
          filterType: filterTypeKey,
          displayName: `min-max:0-${this.priceRangeValue}`,
        },
        {
          filterColumn: 'min',
          filterValue: 0,
          filterOperator: 'equalto',
          keyName: tab.keyName,
          filterType: filterTypeKey,
          displayName: `min-max:0-${this.priceRangeValue}`,
        },
      ];
      if (existingEntry) {
        if (existingEntry.filterColumn == 'max') {
          existingEntry.filterValue = this.priceRangeValue;
          existingEntry.displayName = `min-max:0-${this.priceRangeValue}`;
        } else if (existingEntry.filterColumn == 'min') {
          existingEntry.displayName = `min-max:0-${this.priceRangeValue}`;
        }
      } else {
        this.itemSelectedItemsArray.push(...this.tempDateArray);
      }
    }
  }

  private handleMultipleDateFilterChange(tab: any, filterTypeKey: string) {
    if (
      this.rangeDatesMultiple[tab.index] &&
      this.rangeDatesMultiple[tab.index].length === 2
    ) {
      if (
        this.rangeDatesMultiple[tab.index][0] != null &&
        this.rangeDatesMultiple[tab.index][1] != null
      ) {
        let startDate = this.convertDateToString(
          this.rangeDatesMultiple[tab.index][0],
        );
        let endDate = this.convertDateToString(
          this.rangeDatesMultiple[tab.index][1],
        );
        let formattedStartDate = this.formatDates(startDate);
        let formattedEndDate = this.formatDates(endDate);
        this.tempDateArray = [
          {
            filterColumn: tab.keyName,
            filterValue: `${startDate}&${endDate}`,
            filterOperator: 'equalto',
            formattedStartDate: formattedStartDate,
            keyName: tab.keyName,
            filterType: filterTypeKey,
            index: tab.index,
            displayName: `${tab.displayName} ${this.translate.instant('Between')} ${formattedStartDate}${this.translate.instant(' To ')}${formattedEndDate}`,
          },
        ];
        let existingEntry = this.itemSelectedItemsArray.find(
          (entry) => entry.keyName.toLowerCase() === tab.keyName.toLowerCase(),
        );
        if (existingEntry) {
          if (existingEntry.filterColumn == tab.keyName) {
            existingEntry.filterValue = `${startDate}&${endDate}`;
            existingEntry.displayName = `${tab.displayName} ${this.translate.instant('Between')} ${formattedStartDate}${this.translate.instant(' To ')}${formattedEndDate}`;
          }
        } else {
          this.itemSelectedItemsArray.push(...this.tempDateArray);
        }
      }
    }
  }

  isObjectDropdown(dropDownItems: any[]): boolean {
    return dropDownItems?.length > 0 && typeof dropDownItems[0] === 'object';
  }
}

export class searchSelection {
  operation = 'Contains';
  value: string;
  columnName: string;
  displayLabel: string;
  headingName: string;
  text: string;
}
